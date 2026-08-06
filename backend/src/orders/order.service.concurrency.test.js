if (!process.env.DB_POOL_MAX) {
  process.env.DB_POOL_MAX = "50";
}

const pool = require("../database/db");
const {
  decrementStock,
  reserveStock,
  releaseReservedStock,
} = require("../stock/stock.service");
const { placeOrder } = require("./order.service");


let seq = 0;
const unique = (prefix = "t") => `${prefix}_${Date.now()}_${seq++}`;

async function createBranch() {
  const res = await pool.query(
    `INSERT INTO branches (name, address) VALUES ($1, $2) RETURNING *;`,
    [unique("branch"), unique("addr")]
  );
  return res.rows[0];
}

async function createMedicine({ requiresPrescription = false } = {}) {
  const res = await pool.query(
    `INSERT INTO medicines (name, description, price, requires_prescription)
     VALUES ($1, $2, $3, $4) RETURNING *;`,
    [unique("med"), unique("desc"), 10.0, requiresPrescription]
  );
  return res.rows[0];
}

async function createCustomer() {
  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, branch_id)
     VALUES ($1, $2, $3, 'customer', NULL) RETURNING *;`,
    [unique("cust"), unique("custmail"), "test-hash"]
  );
  return res.rows[0];
}

async function createBranchStock(medicineId, branchId, quantity, reserved = 0) {
  const res = await pool.query(
    `INSERT INTO branch_stock (branch_id, medicine_id, quantity, reserved_quantity, low_stock_threshold)
     VALUES ($1, $2, $3, $4, 0) RETURNING *;`,
    [branchId, medicineId, quantity, reserved]
  );
  return res.rows[0];
}

async function getStock(branchId, medicineId) {
  const res = await pool.query(
    `SELECT quantity, reserved_quantity FROM branch_stock
     WHERE branch_id = $1 AND medicine_id = $2;`,
    [branchId, medicineId]
  );
  if (res.rowCount === 0) return null;
  return res.rows[0];
}

async function countOrdersForCustomer(customerId) {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS c FROM orders WHERE customer_id = $1;`,
    [customerId]
  );
  return res.rows[0].c;
}

async function cleanup(ctx) {
  if (!ctx) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (ctx.customerIds && ctx.customerIds.length) {
      await client.query(`DELETE FROM users WHERE id = ANY($1);`, [
        ctx.customerIds,
      ]);
    }
    if (ctx.medicineIds && ctx.medicineIds.length) {
      await client.query(`DELETE FROM medicines WHERE id = ANY($1);`, [
        ctx.medicineIds,
      ]);
    }
    if (ctx.branchIds && ctx.branchIds.length) {
      await client.query(`DELETE FROM branches WHERE id = ANY($1);`, [
        ctx.branchIds,
      ]);
    }
    await client.query("COMMIT");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
    }
  } finally {
    client.release();
  }
}
async function runConcurrently(n, fn) {
  return Promise.allSettled(
    Array.from({ length: n }, () => fn())
  );
}

async function runConcurrentlyOnOwnClients(n, op) {
  const clients = await Promise.all(
    Array.from({ length: n }, () => pool.connect())
  );
  try {
    return await Promise.allSettled(
      clients.map((client) => op(client))
    );
  } finally {
    for (const client of clients) client.release();
  }
}

describe("Concurrency: Stock Reservation / Order Placement", () => {
  let ctx;

  beforeAll(async () => {
    try {
      await pool.query("SELECT 1;");
    } catch (err) {
      throw new Error(
        `PostgreSQL is not reachable. Start the database and run migrations first. (${err.message})`
      );
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(() => {
    ctx = { branchIds: [], medicineIds: [], customerIds: [] };
  });

  afterEach(async () => {
    await cleanup(ctx);
  });

  test("non-prescription: concurrent placeOrder never oversells (decrementStock path)", async () => {
    const branch = await createBranch();
const medicine = await createMedicine({ requiresPrescription: false });
    const customer = await createCustomer();
    ctx.branchIds.push(branch.id);
    ctx.medicineIds.push(medicine.id);
    ctx.customerIds.push(customer.id);

    const STOCK = 5;
    const ATTEMPTS = 20;
    const QTY = 1;
    await createBranchStock(medicine.id, branch.id, STOCK);

    const results = await runConcurrently(ATTEMPTS, () =>
      placeOrder(customer.id, branch.id, [{ medicineId: medicine.id, quantity: QTY }])
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(STOCK);
    expect(rejected.length).toBe(ATTEMPTS - STOCK);

    for (const r of rejected) {
      expect(r.reason).toBeDefined();
      expect(String(r.reason.message)).toMatch(/insufficient|unavailable|OUT_OF_STOCK/i);
    }

    const stock = await getStock(branch.id, medicine.id);
    expect(Number(stock.quantity)).toBe(0);
    expect(Number(stock.quantity)).toBeGreaterThanOrEqual(0);
    expect(Number(stock.reserved_quantity)).toBe(0);
    expect(await countOrdersForCustomer(customer.id)).toBe(STOCK);
  });

test("prescription: concurrent placeOrder reserves only available stock (reserveStock path)", async () => {
    const branch = await createBranch();
    const medicine = await createMedicine({ requiresPrescription: true });
    const customer = await createCustomer();
    ctx.branchIds.push(branch.id);
    ctx.medicineIds.push(medicine.id);
    ctx.customerIds.push(customer.id);

    const STOCK = 5;
    const RESERVED = 2;
    const ATTEMPTS = 20;
    const QTY = 1;
    await createBranchStock(medicine.id, branch.id, STOCK, RESERVED);

    const results = await runConcurrently(ATTEMPTS, () =>
      placeOrder(customer.id, branch.id, [{ medicineId: medicine.id, quantity: QTY }])
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    const available = STOCK - RESERVED;
    expect(fulfilled.length).toBe(available);
    expect(rejected.length).toBe(ATTEMPTS - available);

    for (const r of rejected) {
      expect(r.reason).toBeDefined();
      expect(String(r.reason.message)).toMatch(/insufficient|unavailable|OUT_OF_STOCK/i);
    }

    const stock = await getStock(branch.id, medicine.id);
    expect(Number(stock.quantity)).toBe(STOCK);
    expect(Number(stock.reserved_quantity)).toBe(STOCK);
    expect(Number(stock.quantity) - Number(stock.reserved_quantity)).toBe(0);
    expect(Number(stock.quantity) - Number(stock.reserved_quantity)).toBeGreaterThanOrEqual(0);

    expect(await countOrdersForCustomer(customer.id)).toBe(available);
  });

  test("direct decrementStock: exactly STOCK of many concurrent calls succeed", async () => {
    const branch = await createBranch();
    const medicine = await createMedicine({ requiresPrescription: false });
    ctx.branchIds.push(branch.id);
    ctx.medicineIds.push(medicine.id);

const STOCK = 10;
    const ATTEMPTS = 30;
    const QTY = 1;
    await createBranchStock(medicine.id, branch.id, STOCK);

    const results = await runConcurrentlyOnOwnClients(ATTEMPTS, (client) =>
      decrementStock(client, branch.id, medicine.id, QTY)
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(STOCK);
    expect(rejected.length).toBe(ATTEMPTS - STOCK);

    for (const r of rejected) {
      expect(String(r.reason.message)).toBe("Insufficient stock");
    }

    const stock = await getStock(branch.id, medicine.id);
    expect(Number(stock.quantity)).toBe(0);
    expect(Number(stock.quantity)).toBeGreaterThanOrEqual(0);
    expect(Number(stock.reserved_quantity)).toBe(0);
  });

  test("direct reserveStock: available = quantity - reserved is never exceeded", async () => {
    const branch = await createBranch();
    const medicine = await createMedicine({ requiresPrescription: true });
    ctx.branchIds.push(branch.id);
    ctx.medicineIds.push(medicine.id);

const STOCK = 8;
    const RESERVED = 3;
    const ATTEMPTS = 25;
    const QTY = 1;
    await createBranchStock(medicine.id, branch.id, STOCK, RESERVED);

    const results = await runConcurrentlyOnOwnClients(ATTEMPTS, (client) =>
      reserveStock(client, branch.id, medicine.id, QTY)
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    const available = STOCK - RESERVED;
    expect(fulfilled.length).toBe(available);
    expect(rejected.length).toBe(ATTEMPTS - available);

    for (const r of rejected) {
      expect(String(r.reason.message)).toBe("Insufficient stock");
    }

    const stock = await getStock(branch.id, medicine.id);
    expect(Number(stock.quantity)).toBe(STOCK);
    expect(Number(stock.reserved_quantity)).toBe(STOCK);
    expect(Number(stock.quantity) - Number(stock.reserved_quantity)).toBe(0);
    expect(Number(stock.quantity) - Number(stock.reserved_quantity)).toBeGreaterThanOrEqual(0);
  });

  test("mixed quantities: total sold never exceeds available stock (no oversell)", async () => {
    const branch = await createBranch();
const medicine = await createMedicine({ requiresPrescription: false });
    const customer = await createCustomer();
    ctx.branchIds.push(branch.id);
    ctx.medicineIds.push(medicine.id);
    ctx.customerIds.push(customer.id);

    const STOCK = 10;
    await createBranchStock(medicine.id, branch.id, STOCK);

const requests = [3, 4, 2, 1, 5, 6, 2, 3, 4, 2, 1, 1, 5, 2, 3];
    const totalRequested = requests.reduce((a, b) => a + b, 0);
    expect(totalRequested).toBeGreaterThan(STOCK);

    const results = await Promise.allSettled(
      requests.map((qty) =>
        placeOrder(customer.id, branch.id, [
          { medicineId: medicine.id, quantity: qty },
        ])
      )
    );

    const fulfilled = results
      .map((r, idx) => ({ ...r, qty: requests[idx] }))
      .filter((r) => r.status === "fulfilled");

    const totalSold = fulfilled.reduce((sum, r) => sum + r.qty, 0);

    expect(totalSold).toBeLessThanOrEqual(STOCK);

    const stock = await getStock(branch.id, medicine.id);
    const remainingQty = Number(stock.quantity);
    const reservedQty = Number(stock.reserved_quantity);

    expect(remainingQty).toBeGreaterThanOrEqual(0);
    expect(remainingQty + totalSold).toBe(STOCK);
    expect(reservedQty).toBe(0);
  });

  test("releaseReservedStock restores availability under concurrency", async () => {
    const branch = await createBranch();
    const medicine = await createMedicine({ requiresPrescription: true });
    ctx.branchIds.push(branch.id);
    ctx.medicineIds.push(medicine.id);

const STOCK = 5;
    await createBranchStock(medicine.id, branch.id, STOCK);

    const reserveResults = await runConcurrentlyOnOwnClients(STOCK, (client) =>
      reserveStock(client, branch.id, medicine.id, 1)
    );
    expect(reserveResults.filter((r) => r.status === "fulfilled").length).toBe(STOCK);

    const releaseResults = await runConcurrentlyOnOwnClients(STOCK, (client) =>
      releaseReservedStock(client, branch.id, medicine.id, 1)
    );
    expect(releaseResults.filter((r) => r.status === "fulfilled").length).toBe(STOCK);

    const stock = await getStock(branch.id, medicine.id);
    expect(Number(stock.quantity)).toBe(STOCK);
    expect(Number(stock.reserved_quantity)).toBe(0);
    expect(Number(stock.quantity) - Number(stock.reserved_quantity)).toBe(STOCK);
  });
});
