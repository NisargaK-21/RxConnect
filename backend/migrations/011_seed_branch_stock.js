exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO branch_stock
      (branch_id, medicine_id, quantity, low_stock_threshold)
    VALUES
      (1, 1, 100, 10),
      (2, 1, 40, 10),

      (1, 2, 60, 10),
      (2, 2, 15, 10),

      (1, 4, 25, 5),
      (2, 4, 5, 5),

      (1, 6, 12, 5),
      (2, 6, 2, 5);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM branch_stock;
  `);
};