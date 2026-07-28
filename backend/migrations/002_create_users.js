exports.up = (pgm) => {
  pgm.createTable("users", {
    id: "id",
    name: {
      type: "varchar(100)",
      notNull: true,
    },
    email: {
      type: "varchar(255)",
      unique: true,
      notNull: true,
    },
    password_hash: {
      type: "text",
      notNull: true,
    },
    role: {
      type: "varchar(50)",
      notNull: true,
    },
    branch_id: {
      type: "integer",
      references: "branches",
      onDelete: "SET NULL",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("users");
};