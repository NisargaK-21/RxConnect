exports.up = (pgm) => {
  pgm.createTable("orders", {
    id: "id",
    customer_id: {
      type: "integer",
      references: "users",
      onDelete: "CASCADE",
    },
    branch_id: {
      type: "integer",
      references: "branches",
      onDelete: "CASCADE",
    },
    status: {
      type: "varchar(30)",
      default: "Placed",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("orders");
};