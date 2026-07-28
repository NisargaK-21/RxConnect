exports.up = (pgm) => {
  pgm.createTable("order_items", {
    id: "id",
    order_id: {
      type: "integer",
      references: "orders",
      onDelete: "CASCADE",
    },
    medicine_id: {
      type: "integer",
      references: "medicines",
      onDelete: "CASCADE",
    },
    quantity: {
      type: "integer",
      notNull: true,
    },
    unit_price: {
      type: "numeric(10,2)",
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("order_items");
};