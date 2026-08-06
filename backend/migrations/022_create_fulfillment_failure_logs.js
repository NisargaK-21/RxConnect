exports.up = (pgm) => {
  pgm.createTable("fulfillment_failure_logs", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    branch_id: {
      type: "integer",
      notNull: true,
      references: "branches",
      onDelete: "CASCADE",
    },
    medicine_id: {
      type: "integer",
      references: "medicines",
      onDelete: "SET NULL",
    },
    order_id: {
      type: "integer",
      references: "orders",
      onDelete: "SET NULL",
    },
    failure_reason: {
      type: "text",
      notNull: true,
      default: "insufficient_stock",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("fulfillment_failure_logs");
};
