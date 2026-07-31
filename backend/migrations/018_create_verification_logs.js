exports.up = (pgm) => {
  pgm.createTable("verification_logs", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    prescription_id: {
      type: "integer",
      notNull: true,
      references: "prescriptions",
      onDelete: "CASCADE",
    },

    pharmacist_id: {
      type: "integer",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },

    decision: {
      type: "varchar(20)",
      notNull: true,
    },

    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("verification_logs");
};