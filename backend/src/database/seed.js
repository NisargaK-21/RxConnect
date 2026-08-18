const pool = require("./db");
const bcrypt = require("bcrypt");

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("Seeding RxConnect database with comprehensive realistic data...");

    // 1. Seed Branches
    const branchRes = await client.query(`
      INSERT INTO branches (name, address)
      VALUES 
        ('Central Pharmacy - MG Road', '123 MG Road, Bengaluru, KA 560001'),
        ('RxConnect Indiranagar', '456 100ft Road, Indiranagar, Bengaluru, KA 560038'),
        ('RxConnect Koramangala', '789 80ft Road, Koramangala, Bengaluru, KA 560095'),
        ('RxConnect Whitefield', '12 ITPL Main Rd, Whitefield, Bengaluru, KA 560066'),
        ('RxConnect Jayanagar', '34 4th Block, Jayanagar, Bengaluru, KA 560011')
      ON CONFLICT DO NOTHING
      RETURNING id, name;
    `);
    
    const branches = (await client.query("SELECT id, name FROM branches ORDER BY id")).rows;
    const b1 = branches[0]?.id || 1;
    const b2 = branches[1]?.id || 2;
    const b3 = branches[2]?.id || 3;
    const b4 = branches[3]?.id || 4;
    const b5 = branches[4]?.id || 5;

    // 2. Seed Medicines
    const medicinesData = [
      { name: "Paracetamol 500mg", description: "Pain reliever and fever reducer", price: 30.00, requires_prescription: false },
      { name: "Amoxicillin 500mg", description: "Broad-spectrum antibiotic capsule", price: 120.00, requires_prescription: true },
      { name: "Cetirizine 10mg", description: "Antihistamine for allergy relief", price: 45.00, requires_prescription: false },
      { name: "Ibuprofen 400mg", description: "Anti-inflammatory pain reliever", price: 50.00, requires_prescription: false },
      { name: "Metformin 500mg", description: "First-line medication for type 2 diabetes", price: 85.00, requires_prescription: true },
      { name: "Atorvastatin 10mg", description: "Statin for cholesterol management", price: 140.00, requires_prescription: true },
      { name: "Omeprazole 20mg", description: "Proton pump inhibitor for acid reflux", price: 65.00, requires_prescription: false },
      { name: "Azithromycin 500mg", description: "Macrolide antibiotic tablet", price: 180.00, requires_prescription: true },
      { name: "Vitamin C 500mg", description: "Chewable immunity supplement", price: 95.00, requires_prescription: false },
      { name: "Cough Relief Syrup 100ml", description: "Soothing formula for dry cough", price: 75.00, requires_prescription: false },
      { name: "Pantoprazole 40mg", description: "Acid reducer for GERD", price: 110.00, requires_prescription: true },
      { name: "Montelukast 10mg", description: "Asthma and allergy controller", price: 130.00, requires_prescription: true }
    ];

    for (const m of medicinesData) {
      await client.query(`
        INSERT INTO medicines (name, description, price, requires_prescription)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING;
      `, [m.name, m.description, m.price, m.requires_prescription]);
    }

    const medicines = (await client.query("SELECT id, name, requires_prescription FROM medicines ORDER BY id")).rows;
    const mPara = medicines.find(m => m.name.includes("Paracetamol")) || medicines[0];
    const mAmox = medicines.find(m => m.name.includes("Amoxicillin")) || medicines[1];
    const mCeti = medicines.find(m => m.name.includes("Cetirizine")) || medicines[2];
    const mIbu = medicines.find(m => m.name.includes("Ibuprofen")) || medicines[3];
    const mMet = medicines.find(m => m.name.includes("Metformin")) || medicines[4];
    const mAtor = medicines.find(m => m.name.includes("Atorvastatin")) || medicines[5];

    // 3. Seed Users
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

    // 4. Seed Branch Stock with low stock & high stock
    for (const b of branches) {
      for (const m of medicines) {
        // Vary stock to ensure some items are below threshold
        let quantity = 50;
        let lowThreshold = 10;
        if (m.id % 3 === 0) quantity = 4; // Low stock!
        if (m.id % 5 === 0) quantity = 2; // Critical low stock!

        await client.query(`
          INSERT INTO branch_stock (branch_id, medicine_id, quantity, low_stock_threshold, reserved_quantity)
          VALUES ($1, $2, $3, $4, 0)
          ON CONFLICT (branch_id, medicine_id) DO UPDATE SET quantity = EXCLUDED.quantity, low_stock_threshold = EXCLUDED.low_stock_threshold;
        `, [b.id, m.id, quantity, lowThreshold]);
      }
    }

    // 5. Seed Low Stock Alerts
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

    // 6. Seed Orders in different states
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
        // Create an approved prescription record for verified/delivered order if medicine requires Rx
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

    // 7. Seed Notifications
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
    console.log("Database seeded successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding error:", err);
  } finally {
    client.release();
    process.exit();
  }
}

seed();
