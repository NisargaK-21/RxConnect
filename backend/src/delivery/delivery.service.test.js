const pool = require("../database/db");
const {
  getAvailableJobs,
  claimJob,
  confirmPickup,
  confirmDelivery,
  getMyJobs,
} = require("./delivery.service");

let seq = 0;
const unique = (prefix = "del_test") => `${prefix}_${Date.now()}_${seq++}`;

async function createBranch() {
  const res = await pool.query(
    `INSERT INTO branches (name, address) VALUES ($1, $2) RETURNING *;`,
    [unique("branch"), unique("addr")]
  );
  return res.rows[0];
}

async function createUser(role = "delivery", branchId = null) {
  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, branch_id, address)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
    [unique("user"), unique("mail"), "hash", role, branchId, unique("user_addr")]
  );
  return res.rows[0];
}

async function createOrder(customerId, branchId, status = "Packed") {
  const res = await pool.query(
    `INSERT INTO orders (customer_id, branch_id, status)
     VALUES ($1, $2, $3) RETURNING *;`,
    [customerId, branchId, status]
  );
  return res.rows[0];
}

describe("Delivery Partner Service Unit & Concurrency Tests", () => {
  let branch, customer, deliveryPartner1, deliveryPartner2;

  beforeAll(async () => {
    try {
      await pool.query("SELECT 1;");
    } catch (err) {
      throw new Error(`DB not reachable: ${err.message}`);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    branch = await createBranch();
    customer = await createUser("customer", null);
    deliveryPartner1 = await createUser("delivery", branch.id);
    deliveryPartner2 = await createUser("delivery", branch.id);
  });

  test("getAvailableJobs returns only Packed unclaimed orders", async () => {
    const packedOrder = await createOrder(customer.id, branch.id, "Packed");
    await createOrder(customer.id, branch.id, "Placed");
    await createOrder(customer.id, branch.id, "Verified");

    const jobs = await getAvailableJobs(deliveryPartner1);
    const found = jobs.find((j) => Number(j.id) === Number(packedOrder.id));

    expect(found).toBeDefined();
    expect(found.status).toBe("Packed");
    expect(found.pickup_branch).toBe(branch.name);
    expect(found.delivery_address).toBe(customer.address);
  });

  test("claimJob: concurrency safe, only 1 delivery partner can claim", async () => {
    const packedOrder = await createOrder(customer.id, branch.id, "Packed");

    const results = await Promise.allSettled([
      claimJob(packedOrder.id, deliveryPartner1.id),
      claimJob(packedOrder.id, deliveryPartner2.id),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason.message).toMatch(/already been claimed/i);

    const claimedPartnerId = fulfilled[0].value.order.delivery_partner_id;
    expect([deliveryPartner1.id, deliveryPartner2.id]).toContain(Number(claimedPartnerId));

    const availableJobs = await getAvailableJobs(deliveryPartner1);
    expect(availableJobs.some((j) => Number(j.id) === Number(packedOrder.id))).toBe(false);
  });

  test("confirmPickup transitions order from Packed -> Out for Delivery and records pickup_timestamp", async () => {
    const order = await createOrder(customer.id, branch.id, "Packed");
    await claimJob(order.id, deliveryPartner1.id);

    const pickupRes = await confirmPickup(order.id, deliveryPartner1.id);

    expect(pickupRes.success).toBe(true);
    expect(pickupRes.order.status).toBe("Out for Delivery");
    expect(pickupRes.order.pickup_timestamp).not.toBeNull();

    // Verify invalid status transition fails
    await expect(confirmPickup(order.id, deliveryPartner1.id)).rejects.toThrow(/Invalid transition/i);
  });

  test("getMyJobs returns assigned orders for logged in delivery partner", async () => {
    const order = await createOrder(customer.id, branch.id, "Packed");
    await claimJob(order.id, deliveryPartner1.id);

    const myJobs = await getMyJobs(deliveryPartner1.id);
    expect(myJobs.length).toBeGreaterThanOrEqual(1);
    expect(Number(myJobs[0].id)).toBe(Number(order.id));
  });
});
