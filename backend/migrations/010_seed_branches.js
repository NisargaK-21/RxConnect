exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO branches (name, address)
    VALUES
      ('Bengaluru Branch', 'MG Road, Bengaluru'),
      ('Mysuru Branch', 'Sayyaji Rao Road, Mysuru');
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM branches
    WHERE name IN ('Bengaluru Branch', 'Mysuru Branch');
  `);
};