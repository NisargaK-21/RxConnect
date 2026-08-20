const pool = require("./db");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf8").trim();
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("Seeding RxConnect database with normalized CSV datasets and realistic operational data...");

    const csvDir = path.join(__dirname, "../../../data/csv");

    // 1. Seed Branches from branches.csv
    const branchesCsv = parseCSV(path.join(csvDir, "branches.csv"));
    for (const row of branchesCsv.rows) {
      const [id, name, address, created_at] = row;
      await client.query(`
        INSERT INTO branches (id, name, address, created_at)
        VALUES ($1, $2, $3, COALESCE($4::timestamp, NOW()))
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address;
      `, [parseInt(id, 10), name, address, created_at || null]);
    }
    await client.query("SELECT setval('branches_id_seq', (SELECT MAX(id) FROM branches))");

    const branches = (await client.query("SELECT id, name FROM branches ORDER BY id")).rows;
    const b1 = branches[0]?.id || 1;
    const b2 = branches[1]?.id || 2;
    const b3 = branches[2]?.id || 3;
    const b4 = branches[3]?.id || 4;
    const b5 = branches[4]?.id || 5;

    // 2. Seed Medicines from medicines.csv
    const medicinesCsv = parseCSV(path.join(csvDir, "medicines.csv"));
    for (const row of medicinesCsv.rows) {
      const [id, name, description, price, requires_prescription, created_at] = row;
      await client.query(`
        INSERT INTO medicines (id, name, description, price, requires_prescription, created_at)
        VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamp, NOW()))
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name, 
          description = EXCLUDED.description, 
          price = EXCLUDED.price, 
          requires_prescription = EXCLUDED.requires_prescription;
      `, [parseInt(id, 10), name, description, parseFloat(price), requires_prescription === "true", created_at || null]);
    }
    await client.query("SELECT setval('medicines_id_seq', (SELECT MAX(id) FROM medicines))");

    const medicines = (await client.query("SELECT id, name, requires_prescription, price FROM medicines ORDER BY id")).rows;
    const mPara = medicines.find(m => m.name.includes("Paracetamol")) || medicines[0];
    const mAmox = medicines.find(m => m.name.includes("Amoxicillin")) || medicines[1];
    const mCeti = medicines.find(m => m.name.includes("Cetirizine")) || medicines[2];
    const mIbu = medicines.find(m => m.name.includes("Ibuprofen")) || medicines[3];
    const mMet = medicines.find(m => m.name.includes("Metformin")) || medicines[4];

    // 3. Seed Branch Stock from branch_stock.csv
    const stockCsv = parseCSV(path.join(csvDir, "branch_stock.csv"));
    for (const row of stockCsv.rows) {
      const [id, branch_id, medicine_id, quantity, low_stock_threshold, reserved_quantity] = row;
      await client.query(`
        INSERT INTO branch_stock (id, branch_id, medicine_id, quantity, low_stock_threshold, reserved_quantity)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (branch_id, medicine_id) DO UPDATE SET 
          quantity = EXCLUDED.quantity, 
          low_stock_threshold = EXCLUDED.low_stock_threshold,
          reserved_quantity = EXCLUDED.reserved_quantity;
      `, [
        parseInt(id, 10),
        parseInt(branch_id, 10),
        parseInt(medicine_id, 10),
        parseInt(quantity, 10),
        parseInt(low_stock_threshold, 10),
        parseInt(reserved_quantity || "0", 10)
      ]);
    }
    await client.query("SELECT setval('branch_stock_id_seq', (SELECT MAX(id) FROM branch_stock))");

    // 4. Seed Medicine Substitutions from medicine_substitutions.csv
    const subsCsv = parseCSV(path.join(csvDir, "medicine_substitutions.csv"));
    for (const row of subsCsv.rows) {
      const [id, medicine_id, substitute_medicine_id] = row;
      await client.query(`
        INSERT INTO medicine_substitutions (id, medicine_id, substitute_medicine_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (medicine_id, substitute_medicine_id) DO NOTHING;
      `, [parseInt(id, 10), parseInt(medicine_id, 10), parseInt(substitute_medicine_id, 10)]);
    }
    await client.query("SELECT setval('medicine_substitutions_id_seq', (SELECT MAX(id) FROM medicine_substitutions))");

    // 5. Seed Users
    const hashedPass = await bcrypt.hash("password123", 10);
    const usersData = [
      { name: "System Admin", email: "admin@gmail.com", role: "admin", branch_id: null },
      { name: "Senior Pharmacist", email: "pharma@gmail.com", role: "pharmacist", branch_id: b1 },
      { name: "Branch Pharmacist Kajal", email: "kajal@gmail.com", role: "pharmacist", branch_id: b2 },
      { name: "Branch Staff Khushi", email: "khushi@gmail.com", role: "staff", branch_id: b1 },
      { name: "Store Manager Staff", email: "staff@gmail.com", role: "staff", branch_id: b2 },
      { name: "Delivery Partner Vidheesh", email: "vidheesh@gmail.com", role: "delivery", branch_id: b1 },
      { name: "Express Delivery Partner", email: "delivery@gmail.com", role: "delivery", branch_id: b2 },
      { name: "Regular Customer Nisarga", email: "nisarga@gmail.com", role: "customer", branch_id: null },
      { name: "Customer Pooja", email: "pooja@gmail.com", role: "customer", branch_id: null },
      { name: "Customer Sriraksha", email: "sri@gmail.com", role: "customer", branch_id: null },
      { name: "Test Customer", email: "customer@gmail.com", role: "customer", branch_id: null },
    ];

    for (const u of usersData) {
      await client.query(`
        INSERT INTO users (name, email, password_hash, role, branch_id, phone, address)
        VALUES ($1, $2, $3, $4, $5, '9876543210', '123 Residency Road, Bengaluru')
        ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, branch_id = EXCLUDED.branch_id;
      `, [u.name, u.email, hashedPass, u.role, u.branch_id]);
    }

    const users = (await client.query("SELECT id, email, role FROM users")).rows;
    const cust1 = users.find(u => u.email === "customer@gmail.com")?.id || users.find(u => u.role === "customer")?.id;
    const cust2 = users.find(u => u.email === "nisarga@gmail.com")?.id || cust1;
    const pharma1 = users.find(u => u.email === "pharma@gmail.com")?.id;
    const deliv1 = users.find(u => u.email === "delivery@gmail.com")?.id || users.find(u => u.role === "delivery")?.id;

    // 6. Seed Low Stock Alerts
    const lowStockItems = await client.query(`
      SELECT id, quantity FROM branch_stock WHERE quantity <= low_stock_threshold
    `);
    for (const bsRow of lowStockItems.rows) {
      await client.query(`
        INSERT INTO low_stock_alerts (branch_stock_id, quantity_at_alert, acknowledged, escalated)
        VALUES ($1, $2, false, false)
        ON CONFLICT DO NOTHING;
      `, [bsRow.id, bsRow.quantity]);
    }

    // 7. Seed Orders
    const ordersToCreate = [
      { cust: cust1, branch: b1, status: 'Placed' },
      { cust: cust2, branch: b1, status: 'Pending Pharmacist Review' },
      { cust: cust1, branch: b2, status: 'Verified' },
      { cust: cust2, branch: b2, status: 'Packed', delivery_partner: deliv1 },
      { cust: cust1, branch: b1, status: 'Out for Delivery', delivery_partner: deliv1, pickup: true },
      { cust: cust2, branch: b1, status: 'Delivered', delivery_partner: deliv1, pickup: true },
      { cust: cust1, branch: b3, status: 'Cancelled' }
    ];

    for (const oData of ordersToCreate) {
      const orderRes = await client.query(`
        INSERT INTO orders (customer_id, branch_id, status, delivery_partner_id, pickup_timestamp)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `, [
        oData.cust,
        oData.branch,
        oData.status,
        oData.delivery_partner || null,
        oData.pickup ? new Date() : null
      ]);

      const orderId = orderRes.rows[0].id;
      const isRx = oData.status === 'Pending Pharmacist Review';
      const med = isRx ? mAmox : mPara;

      const itemRes = await client.query(`
        INSERT INTO order_items (order_id, medicine_id, quantity, unit_price)
        VALUES ($1, $2, 2, $3)
        RETURNING id;
      `, [orderId, med.id, med.price || 30.00]);

      const itemId = itemRes.rows[0].id;

      if (isRx) {
        await client.query(`
          INSERT INTO prescriptions (order_item_id, file_url, status)
          VALUES ($1, '/uploads/sample_prescription.jpg', 'pending')
          ON CONFLICT DO NOTHING;
        `, [itemId]);
      } else if (oData.status === 'Verified' || oData.status === 'Delivered') {
        if (mAmox) {
          const itemRxRes = await client.query(`
            INSERT INTO order_items (order_id, medicine_id, quantity, unit_price)
            VALUES ($1, $2, 1, $3)
            RETURNING id;
          `, [orderId, mAmox.id, mAmox.price || 120.00]);
          await client.query(`
            INSERT INTO prescriptions (order_item_id, file_url, status, reviewed_by, reviewed_at)
            VALUES ($1, '/uploads/sample_prescription.jpg', 'approved', $2, NOW())
            ON CONFLICT DO NOTHING;
          `, [itemRxRes.rows[0].id, pharma1 || 2]);
        }
      }
    }

    // 8. Seed Notifications
    const sampleNotifications = [
      { user_id: cust1, type: "ORDER_STATUS_UPDATE", payload: { orderId: 1, status: "Verified", message: "Your order #1 has been verified." } },
      { user_id: cust1, type: "ORDER_STATUS_UPDATE", payload: { orderId: 5, status: "Out for Delivery", message: "Your order #5 is out for delivery with Vidheesh." } },
      { user_id: pharma1, type: "LOW_STOCK_ALERT", payload: { medicine: "Paracetamol 500mg", branch: "Central Pharmacy - MG Road", remainingQuantity: 4 } },
      { user_id: pharma1, type: "NEW_PRESCRIPTION", payload: { message: "New prescription uploaded for review." } },
    ];

    for (const n of sampleNotifications) {
      if (n.user_id) {
        await client.query(`
          INSERT INTO notifications (user_id, type, payload, is_read)
          VALUES ($1, $2, $3, false);
        `, [n.user_id, n.type, JSON.stringify(n.payload)]);
      }
    }

    await client.query("COMMIT");
    console.log("Database seeded successfully from CSV datasets and initial records!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding error:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seed };
