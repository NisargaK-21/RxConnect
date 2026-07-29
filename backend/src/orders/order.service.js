const pool = require("../database/db");
const { decrementStock } = require("../stock/stock.service");

const placeOrder = async (customerId, branchId, medicineId, quantity) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const medicineResult = await client.query(
            `SELECT * FROM medicines WHERE id = $1`,
            [medicineId]
        );

        if (medicineResult.rowCount === 0) {
            throw new Error("Medicine not found");
        }

        const medicine = medicineResult.rows[0];

        if (medicine.requires_prescription) {
            throw new Error("Prescription medicine cannot be ordered through OTC API");
        }

        await decrementStock(client, branchId, medicineId, quantity);

        const orderResult = await client.query(
            `
            INSERT INTO orders(customer_id, branch_id)
            VALUES($1, $2)
            RETURNING *;
            `,
            [customerId, branchId]
        );

        const order = orderResult.rows[0];

        await client.query(
            `
            INSERT INTO order_items(order_id, medicine_id, quantity, unit_price)
            VALUES($1, $2, $3, $4)
            `,
            [
                order.id,
                medicineId,
                quantity,
                medicine.price
            ]
        );

        await client.query("COMMIT");

        return {
            success: true,
            message: "Order placed successfully",
            order
        };

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    placeOrder,
};