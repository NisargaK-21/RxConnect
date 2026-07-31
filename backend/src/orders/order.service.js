const pool = require("../database/db");
const {
    decrementStock,
    restoreStock,
    findAlternativeBranch,
    findSubstituteMedicine,
    findSubstituteInOtherBranch
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

    if (medicine.requires_prescription) {
        throw new Error("Prescription medicine cannot be ordered through OTC API");
    }
    const orderItemResult = await client.query(
    `
    INSERT INTO order_items
    (
        order_id,
        medicine_id,
        quantity,
        unit_price,
        status
    )
    VALUES($1,$2,$3,$4,'Pending Substitution')
    RETURNING *;
    `,
    [
        order.id,
        medicineId,
        quantity,
        medicine.price
    ]
);

const orderItem = orderItemResult.rows[0];

try {

    await decrementStock(
        client,
        branchId,
        medicineId,
        quantity
    );

    await client.query(
        `
        UPDATE order_items
        SET status = 'Confirmed'
        WHERE id = $1;
        `,
        [orderItem.id]
    );

} catch (error) {

    if (error.message === "Insufficient stock") {

        const alternativeBranch =
            await findAlternativeBranch(
                branchId,
                medicineId,
                quantity
            );

        

        const substituteMedicine =
            await findSubstituteMedicine(
                branchId,
                medicineId,
                quantity
            );

        
        const substituteOtherBranch =
            await findSubstituteInOtherBranch(
                branchId,
                medicineId,
                quantity
            );

        

        if (
    alternativeBranch ||
    substituteMedicine ||
    substituteOtherBranch
) {

    await client.query("COMMIT");

    const stockError = new Error("OUT_OF_STOCK");

    stockError.orderId = order.id;
    stockError.orderItemId = orderItem.id;

    stockError.alternativeBranch = alternativeBranch;
    stockError.substituteMedicine = substituteMedicine;
    stockError.substituteOtherBranch = substituteOtherBranch;

    stockError.transactionCommitted = true;

    throw stockError;
}

throw new Error("Medicine is unavailable in all branches and no substitute exists.");
    }

    throw error;
}

    
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

    if (!err.transactionCommitted) {
        await client.query("ROLLBACK");
    }

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
        SELECT p.id
        FROM prescriptions p
        JOIN order_items oi
            ON p.order_item_id = oi.id
        WHERE oi.order_id = $1
          AND p.status <> 'approved'
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
            await restoreStock(
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
const changeOrderBranch = async (orderId, newBranchId) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Fetch the order
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
        if (order.branch_id === Number(newBranchId)) {
    throw new Error("Order is already assigned to this branch");
}

        // 2. Get all medicines in the order
        const itemsResult = await client.query(
            `
            SELECT medicine_id, quantity
            FROM order_items
            WHERE order_id = $1;
            `,
            [orderId]
        );

        const items = itemsResult.rows;
        // 3. Restore stock to the old branch
for (const item of items) {
    await restoreStock(
        client,
        order.branch_id,
        item.medicine_id,
        item.quantity
    );
}
// 4. Check stock and deduct from the new branch
// 4. Check stock and deduct from the new branch
for (const item of items) {
    try {
        await decrementStock(
            client,
            newBranchId,
            item.medicine_id,
            item.quantity
        );
    } catch (err) {
        if (err.message === "Insufficient stock") {
            throw new Error(
                `Medicine ${item.medicine_id} is not available in the selected branch`
            );
        }
        throw err;
    }
}
// 5. Update the order branch
const updatedOrder = await client.query(
    `
    UPDATE orders
    SET branch_id = $1
    WHERE id = $2
    RETURNING *;
    `,
    [newBranchId, orderId]
);
await client.query("COMMIT");

return {
    success: true,
    message: "Order branch updated successfully.",
    order: updatedOrder.rows[0],
};
} catch (err) {
    await client.query("ROLLBACK");
    throw err;
} finally {
    client.release();
}
};
const acceptSubstitution = async (
    orderId,
    orderItemId,
    newBranchId,
    newMedicineId
) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Fetch order
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

        // Fetch order item
        const itemResult = await client.query(
    `
    SELECT *
    FROM order_items
    WHERE id = $1
      AND order_id = $2;
    `,
    [orderItemId, orderId]
);

        if (itemResult.rowCount === 0) {
            throw new Error("Order items not found");
        }

        const item = itemResult.rows[0];
        const targetBranchId =
    newBranchId || order.branch_id;

const targetMedicineId =
    newMedicineId || item.medicine_id;
    const substituteResult = await client.query(
    `
    SELECT *
    FROM medicine_substitutions
    WHERE medicine_id = $1
      AND substitute_medicine_id = $2;
    `,
    [item.medicine_id, targetMedicineId]
);

if (
    targetMedicineId !== item.medicine_id &&
    substituteResult.rowCount === 0
) {
    throw new Error(
        "Selected medicine is not a valid substitute."
    );
}

    await restoreStock(
    client,
    order.branch_id,
    item.medicine_id,
    item.quantity
);
await decrementStock(
    client,
    targetBranchId,
    targetMedicineId,
    item.quantity
);
await client.query(
    `
    UPDATE order_items
    SET medicine_id = $1,
        unit_price = (
            SELECT price
            FROM medicines
            WHERE id = $1
        )
    WHERE id = $2;
    `,
    [targetMedicineId, orderItemId]
);
const updatedOrder = await client.query(
    `
    UPDATE orders
    SET branch_id = $1
    WHERE id = $2
    RETURNING *;
    `,
    [targetBranchId, orderId]
);
await client.query("COMMIT");

return {
    success: true,
    message: "Substitution accepted successfully.",
    order: updatedOrder.rows[0]
};
} catch (err) {
    await client.query("ROLLBACK");
    throw err;
} finally {
    client.release();
}
};
const rejectSubstitution = async (
    orderId,
    orderItemId
) => {
    const client = await pool.connect();

try {
    await client.query("BEGIN");

    const itemResult = await client.query(
        `
        SELECT *
        FROM order_items
        WHERE id = $1
          AND order_id = $2;
        `,
        [orderItemId, orderId]
    );

    if (itemResult.rowCount === 0) {
        throw new Error("Order item not found");
    }

    const item = itemResult.rows[0];
    const orderResult = await client.query(
    `
    SELECT *
    FROM orders
    WHERE id = $1;
    `,
    [orderId]
);

const order = orderResult.rows[0];
await restoreStock(
    client,
    order.branch_id,
    item.medicine_id,
    item.quantity
);
await client.query(
    `
    DELETE
    FROM order_items
    WHERE id = $1;
    `,
    [orderItemId]
);
const remainingItems = await client.query(
    `
    SELECT id
    FROM order_items
    WHERE order_id = $1;
    `,
    [orderId]
);
if (remainingItems.rowCount === 0) {

    await client.query(
        `
        UPDATE orders
        SET status = 'Cancelled',
            status_updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
        `,
        [orderId]
    );
}
await client.query("COMMIT");

return {
    success: true,
    message: "Rejected item removed successfully."
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
    updateOrderStatus,
     cancelOrder,
     changeOrderBranch,
     acceptSubstitution,
     rejectSubstitution,
};