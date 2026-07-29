exports.up = (pgm) => {
  pgm.createTable("branch_stock", {
    id: "id",
    branch_id: {
      type: "integer",
      references: "branches",
      onDelete: "CASCADE",
    },
    medicine_id: {
      type: "integer",
      references: "medicines",
      onDelete: "CASCADE",
    },
    quantity: {
      type: "integer",
      default: 0,
      notNull: true,
    },
    low_stock_threshold: {
      type: "integer",
      default: 10,
      notNull: true,
    },
  });

  pgm.addConstraint(
    "branch_stock",
    "unique_branch_medicine",
    'UNIQUE("branch_id","medicine_id")'
  );
};

exports.down = (pgm) => {
  pgm.dropTable("branch_stock");
};