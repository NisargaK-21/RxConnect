exports.up = (pgm) => {
  pgm.addColumn("branch_stock", {
    reserved_quantity: {
      type: "integer",
      notNull: true,
      default: 0,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("branch_stock", "reserved_quantity");
};