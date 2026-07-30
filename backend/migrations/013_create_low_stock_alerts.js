exports.up = (pgm) => {
  pgm.createTable("low_stock_alerts", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    branch_stock_id: {
      type: "integer",
      notNull: true,
      references: "branch_stock",
      onDelete: "CASCADE",
    },

    quantity_at_alert: {
      type: "integer",
      notNull: true,
    },

    acknowledged: {
      type: "boolean",
      notNull: true,
      default: false,
    },

    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("low_stock_alerts");
};