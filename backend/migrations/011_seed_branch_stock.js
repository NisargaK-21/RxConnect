exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO branch_stock (branch_id, medicine_id, quantity, low_stock_threshold)
    SELECT
      b.id,
      m.id,
      s.quantity,
      s.low_stock_threshold
    FROM (
      VALUES
        ('Bengaluru Branch', 'Paracetamol 500mg', 100, 10),
        ('Mysuru Branch', 'Paracetamol 500mg', 40, 10),

        ('Bengaluru Branch', 'Vitamin C Tablets', 60, 10),
        ('Mysuru Branch', 'Vitamin C Tablets', 15, 10),

        ('Bengaluru Branch', 'Amoxicillin 500mg', 25, 5),
        ('Mysuru Branch', 'Amoxicillin 500mg', 5, 5),

        ('Bengaluru Branch', 'Insulin', 12, 5),
        ('Mysuru Branch', 'Insulin', 2, 5)
    ) AS s(branch_name, medicine_name, quantity, low_stock_threshold)
    JOIN branches b
      ON b.name = s.branch_name
    JOIN medicines m
      ON m.name = s.medicine_name;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM branch_stock;
  `);
};