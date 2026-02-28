-- Migration: Add support for prescription-based orders
-- Run this in Supabase SQL Editor

-- 1. Add order_id to prescription_scans table
ALTER TABLE prescription_scans
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prescription_order ON prescription_scans(order_id);

-- 2. Modify order_items to support medicines not in medicines table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS medicine_name TEXT,
ADD COLUMN IF NOT EXISTS dosage TEXT;

-- Make medicine_id nullable (for prescriptions with custom medicines)
ALTER TABLE order_items
ALTER COLUMN medicine_id DROP NOT NULL;

-- 3. Add constraint to ensure either medicine_id or medicine_name is provided
ALTER TABLE order_items
ADD CONSTRAINT check_medicine_reference 
CHECK (
  (medicine_id IS NOT NULL) OR 
  (medicine_name IS NOT NULL AND medicine_name != '')
);

-- 4. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_medicine ON order_items(medicine_id) WHERE medicine_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN order_items.medicine_name IS 'Medicine name for prescription orders (when medicine not in medicines table)';
COMMENT ON COLUMN order_items.dosage IS 'Dosage information from prescription';
COMMENT ON COLUMN prescription_scans.order_id IS 'Reference to created order after prescription confirmation';

SELECT 'Prescription order support migration completed!' AS status;
