exports.up = (pgm) => {
  pgm.addColumn("orders", {
    pickup_timestamp: {
      type: "timestamp",
      notNull: false,
      default: null,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("orders", "pickup_timestamp");
};
