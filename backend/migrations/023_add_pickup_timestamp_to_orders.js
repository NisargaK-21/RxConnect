exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'pickup_timestamp'
      ) THEN
        ALTER TABLE orders ADD COLUMN pickup_timestamp timestamp DEFAULT NULL;
      END IF;
    END
    $$;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'pickup_timestamp'
      ) THEN
        ALTER TABLE orders DROP COLUMN pickup_timestamp;
      END IF;
    END
    $$;
  `);
};
