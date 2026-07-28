exports.up = (pgm) => {
  pgm.createTable("prescriptions", {
    id: "id",
    order_item_id: {
      type: "integer",
      references: "order_items",
      onDelete: "CASCADE",
    },
    file_url: {
      type: "text",
      notNull: true,
    },
    status: {
      type: "varchar(20)",
      default: "pending",
      notNull: true,
    },
    reviewed_by: {
      type: "integer",
      references: "users",
      onDelete: "SET NULL",
    },
    reviewed_at: {
      type: "timestamp",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("prescriptions");
};