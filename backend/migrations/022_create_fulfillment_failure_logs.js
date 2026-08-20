exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS fulfillment_failure_logs (
      id serial PRIMARY KEY,
      branch_id integer NOT NULL REFERENCES branches ON DELETE CASCADE,
      medicine_id integer REFERENCES medicines ON DELETE SET NULL,
      order_id integer REFERENCES orders ON DELETE SET NULL,
      failure_reason text NOT NULL DEFAULT 'insufficient_stock',
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS fulfillment_failure_logs CASCADE;`);
};
