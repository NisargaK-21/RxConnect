exports.up = (pgm) => {
  pgm.addColumn("prescriptions", {
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("prescriptions", "created_at");
};