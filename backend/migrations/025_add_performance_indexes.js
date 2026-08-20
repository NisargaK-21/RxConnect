exports.up = (pgm) => {
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_orders_customer_id_status ON orders(customer_id, status);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_orders_branch_id_status ON orders(branch_id, status);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_id ON orders(delivery_partner_id);`);

  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_branch_stock_branch_medicine ON branch_stock(branch_id, medicine_id);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_branch_stock_low_stock ON branch_stock(branch_id, quantity, low_stock_threshold);`);

  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_order_items_medicine_id ON order_items(medicine_id);`);

  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_prescriptions_order_item_id ON prescriptions(order_item_id);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);`);

  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON notifications(user_id, is_read);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_branch_stock ON low_stock_alerts(branch_stock_id, acknowledged);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_medicine_substitutions_med ON medicine_substitutions(medicine_id);`);
};

exports.down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_orders_customer_id_status;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_orders_branch_id_status;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_orders_delivery_partner_id;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_branch_stock_branch_medicine;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_branch_stock_low_stock;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_order_items_order_id;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_order_items_medicine_id;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_prescriptions_order_item_id;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_prescriptions_status;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_notifications_user_is_read;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_low_stock_alerts_branch_stock;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_medicine_substitutions_med;`);
};
