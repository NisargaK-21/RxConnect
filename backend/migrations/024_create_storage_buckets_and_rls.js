exports.up = (pgm) => {
  // 1. Enable Row Level Security (RLS)
  pgm.sql(`ALTER TABLE orders ENABLE ROW LEVEL SECURITY;`);
  pgm.sql(`ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;`);
  pgm.sql(`ALTER TABLE branch_stock ENABLE ROW LEVEL SECURITY;`);

  // 2. Add RLS Policies for orders
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'allow_all_access_orders'
      ) THEN
        CREATE POLICY allow_all_access_orders ON orders FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END
    $$;
  `);

  // 3. Add RLS Policies for prescriptions
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'allow_all_access_prescriptions'
      ) THEN
        CREATE POLICY allow_all_access_prescriptions ON prescriptions FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END
    $$;
  `);

  // 4. Add RLS Policies for branch_stock
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'branch_stock' AND policyname = 'allow_all_access_branch_stock'
      ) THEN
        CREATE POLICY allow_all_access_branch_stock ON branch_stock FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END
    $$;
  `);

  // 5. Configure Supabase storage buckets if storage schema exists
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES 
          ('medicine-images', 'medicine-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
          ('prescription-docs', 'prescription-docs', false, 10485760, ARRAY['image/png', 'image/jpeg', 'image/pdf', 'application/pdf'])
        ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
      END IF;
    END
    $$;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP POLICY IF EXISTS allow_all_access_orders ON orders;`);
  pgm.sql(`DROP POLICY IF EXISTS allow_all_access_prescriptions ON prescriptions;`);
  pgm.sql(`DROP POLICY IF EXISTS allow_all_access_branch_stock ON branch_stock;`);
  pgm.sql(`ALTER TABLE orders DISABLE ROW LEVEL SECURITY;`);
  pgm.sql(`ALTER TABLE prescriptions DISABLE ROW LEVEL SECURITY;`);
  pgm.sql(`ALTER TABLE branch_stock DISABLE ROW LEVEL SECURITY;`);
};
