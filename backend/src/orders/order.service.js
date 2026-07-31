const pool = require("../database/db");
const {
    decrementStock,
    restoreStock,
    findAlternativeBranch,
    reserveStock,
    releaseReservedStock
} = require("../stock/stock.service");
const placeOrder = async (customerId, branchId, items) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        if (!items || items.length === 0) {
    throw new Error("Order must contain at least one medicine");
    }

        const orderResult = await client.query(
            `
            INSERT INTO orders(customer_id, branch_id)
            VALUES($1, $2)
            RETURNING *;
            `,
            [customerId, branchId]
        );

        const order = orderResult.rows[0];
        const orderedItems = [];

        for (const item of items) {
    const { medicineId, quantity } = item;
   if (
    medicineId === undefined ||
    quantity === undefined ||
    quantity <= 0
) {
    throw new Error("Each item must have a valid medicineId and quantity");
}

    const medicineResult = await client.query(
        `SELECT * FROM medicines WHERE id = $1`,
        [medicineId]
    );

    if (medicineResult.rowCount === 0) {
        throw new Error("Medicine not found");
    }

    const medicine = medicineResult.rows[0];

    await reserveStock(
    client,
    branchId,
    medicineId,
    quantity
);


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
    orderedItems.push({
    medicineId,
    quantity,
    unitPrice: medicine.price
});
}

        await client.query("COMMIT");

        return {
    success: true,
    message: "Order placed successfully",
    order,
    items: orderedItems
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

    const expectedStatus = validTransitions[order.status];

    if (newStatus !== expectedStatus) {
        throw new Error(
            `Invalid status transition. Order can only move from ${order.status} to ${expectedStatus}.`
        );
    }
    if (newStatus === "Verified" || newStatus === "Packed") {
    const pendingPrescription = await pool.query(
        `
        SELECT oi.id
        FROM order_items oi
        JOIN medicines m
            ON oi.medicine_id = m.id
        LEFT JOIN prescriptions p
            ON p.order_item_id = oi.id
        WHERE oi.order_id = $1
          AND m.requires_prescription = TRUE
          AND (
                p.id IS NULL
                OR p.status <> 'approved'
          )
        LIMIT 1;
        `,
        [orderId]
    );

    if (pendingPrescription.rowCount > 0) {
        throw new Error(
            `Order contains unapproved prescription items and cannot be marked as ${newStatus}.`
        );
    }
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
const cancelOrder = async (orderId, customerId) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Check if order exists
        const orderResult = await client.query(
            `
            SELECT *
            FROM orders
            WHERE id = $1;
            `,
            [orderId]
        );

        if (orderResult.rowCount === 0) {
            throw new Error("Order not found");
        }

        const order = orderResult.rows[0];

        // Check if customer owns the order
        if (order.customer_id !== Number(customerId)) {
            throw new Error("You can only cancel your own orders");
        }

        // Allow cancellation only for Placed or Verified orders
        if (
            order.status !== "Placed" &&
            order.status !== "Verified"
        ) {
            throw new Error(
                "Only Placed or Verified orders can be cancelled"
            );
        }

        // Fetch all order items
        const itemsResult = await client.query(
            `
            SELECT medicine_id, quantity
            FROM order_items
            WHERE order_id = $1;
            `,
            [orderId]
        );

        // Restore stock
        for (const item of itemsResult.rows) {
           await releaseReservedStock(
    client,
    order.branch_id,
    item.medicine_id,
    item.quantity
);
        }

        // Update order status
        const updatedOrder = await client.query(
            `
            UPDATE orders
            SET status = 'Cancelled',
                status_updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
            `,
            [orderId]
        );

        await client.query("COMMIT");

        return {
            success: true,
            message: "Order cancelled successfully",
            order: updatedOrder.rows[0]
        };

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};
const getCustomerOrders = async (customerId) => {
    const result = await pool.query(
        `
        SELECT
            id,
            customer_id,
            branch_id,
            status,
            created_at,
            status_updated_at
        FROM orders
        WHERE customer_id = $1
        ORDER BY created_at DESC;
        `,
        [customerId]
    );

    return {
        success: true,
        count: result.rowCount,
        orders: result.rows
    };
};
const getOrderById = async (orderId) => {
    const orderResult = await pool.query(
        `
        SELECT *
        FROM orders
        WHERE id = $1;
        `,
        [orderId]
    );

    if (orderResult.rowCount === 0) {
        throw new Error("Order not found");
    }

    const itemsResult = await pool.query(
        `
        SELECT
            oi.id,
            oi.medicine_id,
            m.name AS medicine_name,
            oi.quantity,
            oi.unit_price
        FROM order_items oi
        JOIN medicines m
            ON oi.medicine_id = m.id
        WHERE oi.order_id = $1;
        `,
        [orderId]
    );

    return {
        success: true,
        order: orderResult.rows[0],
        items: itemsResult.rows,
    };
};
module.exports = {
    placeOrder,
    updateOrderStatus,
     cancelOrder,
     getCustomerOrders,
     getOrderById,
};