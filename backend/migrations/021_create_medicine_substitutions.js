exports.up = (pgm) => {
  pgm.createTable("medicine_substitutions", {
    id: "id",
    medicine_id: {
      type: "integer",
      references: "medicines",
      onDelete: "CASCADE",
      notNull: true,
    },
    substitute_medicine_id: {
      type: "integer",
      references: "medicines",
      onDelete: "CASCADE",
      notNull: true,
    },
  });

  pgm.addConstraint(
    "medicine_substitutions",
    "unique_medicine_substitution",
    'UNIQUE("medicine_id","substitute_medicine_id")'
  );
};

exports.down = (pgm) => {
  pgm.dropTable("medicine_substitutions");
};
