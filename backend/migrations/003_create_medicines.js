exports.up = (pgm) => {
  pgm.createTable("medicines", {
    id: "id",
    name: {
      type: "varchar(150)",
      notNull: true,
    },
    description: {
      type: "text",
    },
    price: {
      type: "numeric(10,2)",
      notNull: true,
    },
    requires_prescription: {
      type: "boolean",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("medicines");
};