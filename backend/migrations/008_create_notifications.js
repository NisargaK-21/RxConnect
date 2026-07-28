exports.up = (pgm) => {
  pgm.createTable("notifications", {
    id: "id",
    user_id: {
      type: "integer",
      references: "users",
      onDelete: "CASCADE",
    },
    type: {
      type: "varchar(100)",
      notNull: true,
    },
    payload: {
      type: "jsonb",
    },
    is_read: {
      type: "boolean",
      default: false,
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("notifications");
};