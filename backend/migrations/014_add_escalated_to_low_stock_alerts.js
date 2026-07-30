exports.up = (pgm) => {
  pgm.addColumn("low_stock_alerts", {
    escalated: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("low_stock_alerts", "escalated");
};