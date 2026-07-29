
const decrementStock = async (client, branchId, medicineId, quantity) => {
    const result = await client.query(
        `
        UPDATE branch_stock
        SET quantity = quantity - $1
        WHERE branch_id = $2
          AND medicine_id = $3
          AND quantity >= $1
        RETURNING *;
        `,
        [quantity, branchId, medicineId]
    );

    if (result.rowCount === 0) {
        throw new Error("Insufficient stock");
    }

    return result.rows[0];
};

module.exports = {
    decrementStock,
};