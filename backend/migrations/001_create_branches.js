exports.up = (pgm) => {
  pgm.createTable("branches", {
    id: "id",
    name: {
      type: "varchar(100)",
      notNull: true,
    },
    address: {
      type: "text",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("branches");
};