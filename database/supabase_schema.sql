-- ============================================================================
-- AI PHARMACIST - SUPABASE SCHEMA
-- ============================================================================
-- Optimized for Supabase PostgreSQL
-- Run this script in Supabase SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.roles IS 'User roles for RBAC';

-- ============================================================================
-- 2. USER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.user_profiles IS 'Extended user profiles linked to Supabase auth';

-- ============================================================================
-- 3. MEDICINES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    description TEXT,
    dosage VARCHAR(100),
    form VARCHAR(50) CHECK (form IN ('tablet', 'capsule', 'liquid', 'syrup', 'injection', 'cream', 'ointment', 'inhaler', 'other')),
    strength VARCHAR(50),
    manufacturer VARCHAR(255),
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10,2) CHECK (cost >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Inventory
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_level INTEGER DEFAULT 10,
    reorder_level INTEGER DEFAULT 20,
    
    -- Regulatory
    prescription_required BOOLEAN DEFAULT true NOT NULL,
    
    -- Categories
    category VARCHAR(100),
    therapeutic_class VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT true NOT NULL,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.medicines IS 'Medicine inventory';

-- ============================================================================
-- 4. ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE,
    
    -- References
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pharmacist_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'ready', 'shipped', 'delivered', 'cancelled'
    )),
    
    -- Financial
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'paid', 'failed', 'refunded'
    )),
    
    -- Dates
    order_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.orders IS 'Customer orders';

-- ============================================================================
-- 5. ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
    
    -- Quantity and pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Product snapshot
    medicine_name VARCHAR(255),
    medicine_strength VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.order_items IS 'Items within orders';

-- ============================================================================
-- 6. REFILL PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.refill_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    
    -- Prediction details
    predicted_refill_date DATE NOT NULL,
    confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    days_remaining INTEGER,
    status VARCHAR(20) DEFAULT 'safe' CHECK (status IN ('safe', 'low', 'critical')),
    
    -- Historical data
    last_order_date DATE,
    last_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    average_consumption_days INTEGER,
    
    -- Model info
    model_version VARCHAR(50),
    
    -- Notifications
    is_active BOOLEAN DEFAULT true NOT NULL,
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(customer_id, medicine_id, predicted_refill_date)
);

COMMENT ON TABLE public.refill_predictions IS 'ML-powered refill predictions';

-- ============================================================================
-- 7. AI LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User tracking
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID,
    
    -- Action classification
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'chat', 'recommendation', 'prediction', 'search', 'analysis', 'other'
    )),
    
    -- Request/Response
    input_data JSONB,
    output_data JSONB,
    
    -- Model info
    model_used VARCHAR(100),
    provider VARCHAR(50),
    
    -- Tokens
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER,
    
    -- Performance
    execution_time_ms INTEGER,
    
    -- Quality
    success BOOLEAN DEFAULT true NOT NULL,
    confidence_score DECIMAL(5,4),
    
    -- Errors
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.ai_logs IS 'AI operation logging';

-- ============================================================================
-- 8. INVENTORY TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
        'purchase', 'sale', 'return', 'adjustment', 'damaged', 'expired'
    )),
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_id UUID,
    reason TEXT,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.inventory_transactions IS 'Inventory audit trail';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);

-- Medicines
CREATE INDEX IF NOT EXISTS idx_medicines_name ON public.medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON public.medicines(category);
CREATE INDEX IF NOT EXISTS idx_medicines_stock ON public.medicines(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_medicines_active ON public.medicines(is_active);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON public.orders(customer_id, status);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_medicine_id ON public.order_items(medicine_id);

-- Refill Predictions
CREATE INDEX IF NOT EXISTS idx_refill_predictions_customer ON public.refill_predictions(customer_id);
CREATE INDEX IF NOT EXISTS idx_refill_predictions_medicine ON public.refill_predictions(medicine_id);
CREATE INDEX IF NOT EXISTS idx_refill_predictions_date ON public.refill_predictions(predicted_refill_date);
CREATE INDEX IF NOT EXISTS idx_refill_predictions_status ON public.refill_predictions(status);
CREATE INDEX IF NOT EXISTS idx_refill_predictions_active ON public.refill_predictions(is_active, predicted_refill_date);

-- AI Logs
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON public.ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_action_type ON public.ai_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON public.ai_logs(created_at DESC);

-- Inventory Transactions
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_medicine ON public.inventory_transactions(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created ON public.inventory_transactions(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers
DROP TRIGGER IF EXISTS set_updated_at ON public.roles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.user_profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.medicines;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.orders;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.refill_predictions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.refill_predictions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function: Generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := 'ORD-' || TO_CHAR(timezone('utc'::text, now()), 'YYYYMMDD') || '-' || 
                           LPAD(floor(random() * 999999)::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Function: Create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Get default customer role
    SELECT id INTO default_role_id FROM public.roles WHERE name = 'customer' LIMIT 1;
    
    -- Create profile
    INSERT INTO public.user_profiles (id, role_id, full_name, created_at)
    VALUES (
        NEW.id,
        default_role_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (Supabase auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refill_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Roles: Everyone can view
DROP POLICY IF EXISTS "Roles viewable by authenticated users" ON public.roles;
CREATE POLICY "Roles viewable by authenticated users"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

-- User Profiles: Users see own, staff see all
DROP POLICY IF EXISTS "Users can view profiles" ON public.user_profiles;
CREATE POLICY "Users can view profiles"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- Medicines: All authenticated users can view active medicines
DROP POLICY IF EXISTS "Active medicines viewable by all" ON public.medicines;
CREATE POLICY "Active medicines viewable by all"
    ON public.medicines FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Orders: Users see own orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (customer_id = auth.uid());

-- Order Items: Inherit from orders
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
CREATE POLICY "Users can view order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id = auth.uid()
        )
    );

-- Refill Predictions: Users see own
DROP POLICY IF EXISTS "Users can view own predictions" ON public.refill_predictions;
CREATE POLICY "Users can view own predictions"
    ON public.refill_predictions FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid());

-- AI Logs: Users can insert and view own
DROP POLICY IF EXISTS "Users can view own logs" ON public.ai_logs;
CREATE POLICY "Users can view own logs"
    ON public.ai_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert logs" ON public.ai_logs;
CREATE POLICY "Users can insert logs"
    ON public.ai_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Inventory Transactions: Read-only for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.inventory_transactions;
CREATE POLICY "Authenticated users can view transactions"
    ON public.inventory_transactions FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================================
-- UTILITY VIEWS
-- ============================================================================

-- Low Stock View
CREATE OR REPLACE VIEW public.low_stock_medicines AS
SELECT 
    id,
    name,
    generic_name,
    stock_quantity,
    min_stock_level,
    reorder_level,
    price,
    category
FROM public.medicines
WHERE stock_quantity <= min_stock_level 
    AND is_active = true
ORDER BY stock_quantity ASC;

-- Upcoming Refills View
CREATE OR REPLACE VIEW public.upcoming_refills AS
SELECT 
    rp.id,
    rp.customer_id,
    rp.medicine_id,
    rp.predicted_refill_date,
    rp.confidence_score,
    rp.status,
    rp.notification_sent,
    m.name AS medicine_name,
    m.price,
    m.stock_quantity
FROM public.refill_predictions rp
JOIN public.medicines m ON rp.medicine_id = m.id
WHERE rp.is_active = true 
    AND rp.predicted_refill_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY rp.predicted_refill_date;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert roles
INSERT INTO public.roles (name, description, permissions) VALUES
('admin', 'System Administrator', '{"all": true}'),
('pharmacist', 'Licensed Pharmacist', '{"manage_prescriptions": true, "manage_inventory": true}'),
('staff', 'Pharmacy Staff', '{"manage_inventory": true, "process_orders": true}'),
('customer', 'Customer/Patient', '{"place_orders": true, "view_orders": true}')
ON CONFLICT (name) DO NOTHING;

-- Sample medicines
INSERT INTO public.medicines (
    name, generic_name, brand_name, description, form, strength,
    price, cost, stock_quantity, min_stock_level, category, is_active
) VALUES
('Amoxicillin 500mg', 'Amoxicillin', 'Amoxil', 'Antibiotic for bacterial infections', 'capsule', '500mg', 15.99, 8.00, 500, 100, 'Antibiotics', true),
('Ibuprofen 200mg', 'Ibuprofen', 'Advil', 'Pain reliever and anti-inflammatory', 'tablet', '200mg', 8.99, 4.50, 1000, 200, 'Pain Relief', true),
('Lisinopril 10mg', 'Lisinopril', 'Prinivil', 'Blood pressure medication', 'tablet', '10mg', 12.99, 6.00, 300, 50, 'Cardiovascular', true),
('Metformin 500mg', 'Metformin', 'Glucophage', 'Diabetes medication', 'tablet', '500mg', 10.99, 5.50, 400, 80, 'Diabetes', true),
('Omeprazole 20mg', 'Omeprazole', 'Prilosec', 'Acid reflux treatment', 'capsule', '20mg', 18.99, 9.00, 250, 50, 'Gastrointestinal', true),
('Atorvastatin 20mg', 'Atorvastatin', 'Lipitor', 'Cholesterol medication', 'tablet', '20mg', 22.99, 11.00, 350, 70, 'Cardiovascular', true),
('Acetaminophen 500mg', 'Acetaminophen', 'Tylenol', 'Pain reliever and fever reducer', 'tablet', '500mg', 7.99, 3.50, 800, 150, 'Pain Relief', true),
('Azithromycin 250mg', 'Azithromycin', 'Zithromax', 'Antibiotic', 'tablet', '250mg', 28.99, 14.00, 150, 30, 'Antibiotics', true),
('Albuterol Inhaler', 'Albuterol', 'ProAir', 'Asthma inhaler', 'inhaler', '90mcg', 45.99, 22.00, 100, 20, 'Respiratory', true),
('Levothyroxine 50mcg', 'Levothyroxine', 'Synthroid', 'Thyroid hormone', 'tablet', '50mcg', 14.99, 7.00, 300, 60, 'Endocrine', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- REALTIME PUBLICATIONS
-- ============================================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.refill_predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medicines;

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AI Pharmacist Schema Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables: 8 created';
    RAISE NOTICE 'Indexes: 20+ created';
    RAISE NOTICE 'RLS Policies: Active';
    RAISE NOTICE 'Triggers: 3 created';
    RAISE NOTICE 'Views: 2 created';
    RAISE NOTICE 'Sample Data: Loaded';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test user signup flow';
    RAISE NOTICE '2. Verify RLS policies';
    RAISE NOTICE '3. Create storage buckets if needed';
    RAISE NOTICE '========================================';
END $$;
