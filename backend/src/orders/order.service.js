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
const validTransitions = {
    "Placed": "Verified",
    "Verified": "Packed",
    "Packed": "Out for Delivery",
    "Out for Delivery": "Delivered"
};

const updateOrderStatus = async (orderId, newStatus) => {
    const result = await pool.query(
        `SELECT * FROM orders WHERE id = $1`,
        [orderId]
    );

    if (result.rowCount === 0) {
        throw new Error("Order not found");
    }

    const order = result.rows[0];

    // Get the next valid status
    const expectedStatus = validTransitions[order.status];

    // Check if the requested status is valid
    if (newStatus !== expectedStatus) {
        throw new Error(
            `Invalid status transition. Order can only move from ${order.status} to ${expectedStatus}.`
        );
    }

    const updatedOrder = await pool.query(
        `
        UPDATE orders
        SET status = $1,
            status_updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *;
        `,
        [newStatus, orderId]
    );

    return {
        success: true,
        message: "Order status updated successfully",
        order: updatedOrder.rows[0]
    };
};
module.exports = {
    placeOrder,
    updateOrderStatus,
};