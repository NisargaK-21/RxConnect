exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO medicines
      (name, description, price, requires_prescription)
    VALUES
      ('Paracetamol 500mg', 'Pain reliever and fever reducer', 20.00, false),
      ('Vitamin C Tablets', 'Vitamin supplement', 80.00, false),
      ('Cetirizine', 'Anti-allergy medicine', 35.00, false),

      ('Amoxicillin 500mg', 'Antibiotic', 120.00, true),
      ('Metformin 500mg', 'Diabetes medicine', 95.00, true),
      ('Insulin', 'Insulin injection', 850.00, true);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM medicines
    WHERE name IN (
      'Paracetamol 500mg',
      'Vitamin C Tablets',
      'Cetirizine',
      'Amoxicillin 500mg',
      'Metformin 500mg',
      'Insulin'
    );
  `);
};