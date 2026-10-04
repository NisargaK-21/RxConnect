exports.up = (pgm) => {
  pgm.sql(`
    /*
     * Remove old/duplicate medicine seed data.
     *
     * Current medicines are IDs 1-12,
     * sourced from data/csv/medicines.csv.
     */

    -- 1. Remove prescriptions belonging to old medicine order items
    DELETE FROM prescriptions
    WHERE order_item_id IN (
      SELECT id
      FROM order_items
      WHERE medicine_id > 12
    );

    -- 2. Remove order items using old medicines
    DELETE FROM order_items
    WHERE medicine_id > 12;

    -- 3. Remove medicine substitutions involving old medicines
    DELETE FROM medicine_substitutions
    WHERE medicine_id > 12
       OR substitute_medicine_id > 12;

    -- 4. Remove branch stock for old medicines
    DELETE FROM branch_stock
    WHERE medicine_id > 12;

    -- 5. Remove old/duplicate medicines
    DELETE FROM medicines
    WHERE id > 12;

    -- 6. Reset medicine ID sequence
    SELECT setval(
      'medicines_id_seq',
      COALESCE((SELECT MAX(id) FROM medicines), 1)
    );
  `);
};

exports.down = (pgm) => {
  /*
   * The removed medicines were old seed/test records.
   * They are intentionally not recreated here.
   *
   * The current medicine data comes from:
   * data/csv/medicines.csv
   */
};