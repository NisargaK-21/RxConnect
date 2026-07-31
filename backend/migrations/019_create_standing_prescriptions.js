exports.up = (pgm) => {
  pgm.createTable("standing_prescriptions", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    customer_id: {
      type: "integer",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },

    medicine_id: {
      type: "integer",
      notNull: true,
      references: "medicines",
      onDelete: "CASCADE",
    },

    prescription_id: {
      type: "integer",
      notNull: true,
      references: "prescriptions",
      onDelete: "CASCADE",
    },

    approved_by: {
      type: "integer",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },

    is_active: {
      type: "boolean",
      notNull: true,
      default: true,
    },

    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },

    revoked_at: {
      type: "timestamp",
    },
  });

  pgm.addConstraint(
    "standing_prescriptions",
    "unique_customer_medicine",
    {
      unique: ["customer_id", "medicine_id"],
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable("standing_prescriptions");
};