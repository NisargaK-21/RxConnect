const pool = require('../src/database/db');

async function verify() {
  try {
    const branches = await pool.query('SELECT count(*) FROM branches');
    const medicines = await pool.query('SELECT count(*) FROM medicines');
    const stock = await pool.query('SELECT count(*) FROM branch_stock');
    const subs = await pool.query('SELECT count(*) FROM medicine_substitutions');
    const orders = await pool.query('SELECT count(*) FROM orders');
    const rls = await pool.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('orders', 'prescriptions', 'branch_stock')");
    const indexes = await pool.query("SELECT indexname FROM pg_indexes WHERE tablename IN ('orders', 'branch_stock', 'prescriptions', 'notifications', 'order_items', 'low_stock_alerts', 'medicine_substitutions')");
    const buckets = await pool.query("SELECT id, name, public FROM storage.buckets WHERE id IN ('medicine-images', 'prescription-docs')");

    console.log('====================================');
    console.log('SUPABASE DATABASE & STORAGE VERIFICATION');
    console.log('====================================');
    console.log(`- Branches count: ${branches.rows[0].count}`);
    console.log(`- Medicines count: ${medicines.rows[0].count}`);
    console.log(`- Branch Stock count: ${stock.rows[0].count}`);
    console.log(`- Medicine Substitutions count: ${subs.rows[0].count}`);
    console.log(`- Orders count: ${orders.rows[0].count}`);
    
    console.log('\n--- Row Level Security (RLS) Status ---');
    rls.rows.forEach(r => {
      console.log(`  * Table: ${r.relname} -> RLS Enabled: ${r.relrowsecurity}`);
    });

    console.log('\n--- Performance Indexes ---');
    const customIndexes = indexes.rows.map(r => r.indexname).filter(i => i.startsWith('idx_'));
    customIndexes.forEach(idx => {
      console.log(`  * Index: ${idx}`);
    });

    console.log('\n--- Storage Buckets ---');
    buckets.rows.forEach(b => {
      console.log(`  * Bucket: ${b.id} (Name: ${b.name}, Public: ${b.public})`);
    });
    console.log('====================================');
  } catch (err) {
    console.error('Verification Error:', err);
    process.exitCode = 1;
  } finally {
    pool.end();
  }
}

verify();
