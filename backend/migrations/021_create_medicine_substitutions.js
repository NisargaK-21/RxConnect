exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS medicine_substitutions (
      id serial PRIMARY KEY,
      medicine_id integer NOT NULL REFERENCES medicines ON DELETE CASCADE,
      substitute_medicine_id integer NOT NULL REFERENCES medicines ON DELETE CASCADE
    );
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_medicine_substitution'
      ) THEN
        ALTER TABLE medicine_substitutions ADD CONSTRAINT unique_medicine_substitution UNIQUE (medicine_id, substitute_medicine_id);
      END IF;
    END
    $$;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS medicine_substitutions CASCADE;`);
};
