-- ============================================================================
-- AI PHARMACIST - MINIMAL SUPABASE SCHEMA
-- ============================================================================
-- Simplified version with essential tables only
-- Perfect for quick setup and testing
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER PROFILES
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEDICINES
CREATE TABLE public.medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    description TEXT,
    form VARCHAR(50),
    strength VARCHAR(50),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 10,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REFILL PREDICTIONS
CREATE TABLE public.refill_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255),
    predicted_refill_date DATE NOT NULL,
    days_remaining INTEGER,
    confidence_score DECIMAL(5,4),
    status VARCHAR(20) DEFAULT 'safe',
    last_order_date DATE,
    notification_sent BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI LOGS
CREATE TABLE public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action_type VARCHAR(50) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    model_used VARCHAR(100),
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_medicines_name ON public.medicines(name);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_refill_predictions_customer ON public.refill_predictions(customer_id);

-- ENABLE RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refill_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- BASIC RLS POLICIES
CREATE POLICY "Allow read access" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access" ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read medicines" ON public.medicines FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Users create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Users view order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));
CREATE POLICY "Users view predictions" ON public.refill_predictions FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Users insert logs" ON public.ai_logs FOR INSERT TO authenticated WITH CHECK (true);

-- AUTO-CREATE USER PROFILE
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    customer_role_id UUID;
BEGIN
    SELECT id INTO customer_role_id FROM public.roles WHERE name = 'customer' LIMIT 1;
    INSERT INTO public.user_profiles (id, role_id, full_name)
    VALUES (NEW.id, customer_role_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- SEED DATA
INSERT INTO public.roles (name, description) VALUES
('customer', 'Customer/Patient'),
('pharmacist', 'Licensed Pharmacist'),
('admin', 'Administrator')
ON CONFLICT DO NOTHING;

INSERT INTO public.medicines (name, generic_name, form, strength, price, stock_quantity, category) VALUES
('Amoxicillin 500mg', 'Amoxicillin', 'capsule', '500mg', 15.99, 500, 'Antibiotics'),
('Ibuprofen 200mg', 'Ibuprofen', 'tablet', '200mg', 8.99, 1000, 'Pain Relief'),
('Lisinopril 10mg', 'Lisinopril', 'tablet', '10mg', 12.99, 300, 'Cardiovascular')
ON CONFLICT DO NOTHING;
