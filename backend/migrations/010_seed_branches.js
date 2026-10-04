exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO branches (name, address)
    VALUES
      ('Bengaluru Branch', 'MG Road, Bengaluru'),
      ('Mysuru Branch', 'Sayyaji Rao Road, Mysuru'),
      ('Hubballi Branch', 'Vidyanagar, Hubballi'),
      ('Mangaluru Branch', 'Hampankatta, Mangaluru'),
      ('Belagavi Branch', 'Tilakwadi, Belagavi'),
      ('Shivamogga Branch', 'Sagar Road, Shivamogga');
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM branches
    WHERE name IN (
      'Bengaluru Branch',
      'Mysuru Branch',
      'Hubballi Branch',
      'Mangaluru Branch',
      'Belagavi Branch',
      'Shivamogga Branch'
    );
  `);
};