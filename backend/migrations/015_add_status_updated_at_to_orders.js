exports.up = (pgm) => {
  pgm.addColumn("orders", {
    status_updated_at: {
      type: "timestamp",
      notNull: false,
      default: null,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("orders", "status_updated_at");
};