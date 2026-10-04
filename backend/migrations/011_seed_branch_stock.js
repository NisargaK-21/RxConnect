exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO branch_stock (
      branch_id,
      medicine_id,
      quantity,
      low_stock_threshold
    )
    SELECT
      b.id,
      m.id,
      FLOOR(RANDOM() * 51)::INTEGER,
      CASE
        WHEN m.requires_prescription = true THEN 5
        ELSE 10
      END
    FROM branches b
    CROSS JOIN medicines m;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM branch_stock;
  `);
};