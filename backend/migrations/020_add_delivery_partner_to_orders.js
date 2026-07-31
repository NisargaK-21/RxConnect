exports.up = (pgm) => {
  pgm.addColumn("orders", {
    delivery_partner_id: {
      type: "integer",
      references: "users",
      onDelete: "SET NULL",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("orders", "delivery_partner_id");
};