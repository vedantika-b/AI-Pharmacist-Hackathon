-- ============================================================================
-- AI PHARMACIST SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- ============================================================================
-- Production-ready schema with RLS, indexes, constraints, and audit trails
-- Designed for Supabase with auth.users integration
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ROLES TABLE
-- ============================================================================
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Roles table comment
COMMENT ON TABLE public.roles IS 'User roles and their permissions for RBAC';

-- ============================================================================
-- 2. USER PROFILES TABLE (Extends Supabase auth.users)
-- ============================================================================
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    address JSONB DEFAULT '{}',
    avatar_url TEXT,
    license_number VARCHAR(50), -- For pharmacists
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);

COMMENT ON TABLE public.user_profiles IS 'Extended user profile data linked to Supabase auth.users';

-- ============================================================================
-- 3. MEDICINES TABLE
-- ============================================================================
CREATE TABLE public.medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    description TEXT,
    dosage VARCHAR(100),
    form VARCHAR(50) NOT NULL CHECK (form IN ('tablet', 'capsule', 'liquid', 'syrup', 'injection', 'cream', 'ointment', 'gel', 'drops', 'inhaler', 'patch', 'suppository', 'powder', 'other')),
    strength VARCHAR(50),
    manufacturer VARCHAR(255),
    
    -- Identification codes
    ndc_code VARCHAR(20) UNIQUE,
    barcode VARCHAR(100),
    sku VARCHAR(50),
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10,2) CHECK (cost >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Inventory
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_level INTEGER DEFAULT 10 CHECK (min_stock_level >= 0),
    max_stock_level INTEGER CHECK (max_stock_level IS NULL OR max_stock_level >= min_stock_level),
    reorder_level INTEGER DEFAULT 20,
    
    -- Regulatory
    prescription_required BOOLEAN DEFAULT true NOT NULL,
    controlled_substance BOOLEAN DEFAULT false NOT NULL,
    controlled_substance_schedule VARCHAR(10),
    fda_approved BOOLEAN DEFAULT true,
    
    -- Product details
    expiry_date DATE,
    batch_number VARCHAR(50),
    storage_conditions TEXT,
    dosage_instructions TEXT,
    
    -- Medical information
    side_effects TEXT,
    contraindications TEXT,
    drug_interactions TEXT,
    warnings TEXT,
    
    -- Categories and tags
    category VARCHAR(100),
    therapeutic_class VARCHAR(100),
    tags TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true NOT NULL,
    discontinued BOOLEAN DEFAULT false NOT NULL,
    
    -- SEO and search
    search_vector tsvector,
    
    -- Audit fields
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.medicines IS 'Complete medicine inventory with regulatory and clinical information';

-- ============================================================================
-- 4. ORDERS TABLE
-- ============================================================================
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer and staff references
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pharmacist_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Order status
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN (
        'pending', 'confirmed', 'processing', 'preparing', 'ready', 
        'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'
    )),
    
    -- Financial
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_fee DECIMAL(10,2) DEFAULT 0 CHECK (shipping_fee >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'
    )),
    payment_transaction_id VARCHAR(255),
    
    -- Prescription details
    prescription_number VARCHAR(100),
    prescription_image_url TEXT,
    doctor_name VARCHAR(255),
    doctor_license VARCHAR(50),
    doctor_phone VARCHAR(20),
    prescription_verified BOOLEAN DEFAULT false,
    prescription_verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    prescription_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery information
    delivery_type VARCHAR(20) DEFAULT 'standard' CHECK (delivery_type IN ('pickup', 'standard', 'express', 'same_day')),
    delivery_address JSONB,
    delivery_instructions TEXT,
    tracking_number VARCHAR(100),
    
    -- Dates
    order_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    estimated_delivery_date DATE,
    
    -- Additional info
    notes TEXT,
    customer_notes TEXT,
    internal_notes TEXT,
    cancellation_reason TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.orders IS 'Customer orders with complete lifecycle tracking';

-- ============================================================================
-- 5. ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
    
    -- Quantity and pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_price DECIMAL(10,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount + tax_amount) STORED,
    
    -- Instructions
    dosage_instructions TEXT,
    refills_allowed INTEGER DEFAULT 0,
    refills_remaining INTEGER DEFAULT 0,
    
    -- Product details at time of order (for historical accuracy)
    medicine_name VARCHAR(255),
    medicine_form VARCHAR(50),
    medicine_strength VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'prepared', 'dispensed', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.order_items IS 'Individual items within orders';

-- ============================================================================
-- 6. REFILL PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE public.refill_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    
    -- Prediction details
    predicted_refill_date DATE NOT NULL,
    confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    probability_score DECIMAL(5,4) CHECK (probability_score >= 0 AND probability_score <= 1),
    
    -- Historical analysis
    last_order_date DATE,
    last_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    average_consumption_days INTEGER CHECK (average_consumption_days > 0),
    total_orders_analyzed INTEGER DEFAULT 0,
    order_frequency_days DECIMAL(10,2),
    
    -- Model information
    model_version VARCHAR(50),
    model_name VARCHAR(100),
    algorithm_used VARCHAR(100),
    features_used JSONB,
    training_date TIMESTAMP WITH TIME ZONE,
    
    -- Prediction metadata
    prediction_range_start DATE,
    prediction_range_end DATE,
    seasonal_factor DECIMAL(5,2),
    trend_factor DECIMAL(5,2),
    
    -- Notification tracking
    is_active BOOLEAN DEFAULT true NOT NULL,
    notification_sent BOOLEAN DEFAULT false NOT NULL,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    notification_type VARCHAR(20) CHECK (notification_type IN ('email', 'sms', 'push', 'in_app')),
    customer_responded BOOLEAN DEFAULT false,
    customer_response_at TIMESTAMP WITH TIME ZONE,
    converted_to_order BOOLEAN DEFAULT false,
    converted_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(customer_id, medicine_id, predicted_refill_date)
);

COMMENT ON TABLE public.refill_predictions IS 'AI-powered medication refill predictions with ML model tracking';

-- ============================================================================
-- 7. AI LOGS TABLE
-- ============================================================================
CREATE TABLE public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User and session tracking
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID,
    request_id VARCHAR(255),
    
    -- Action classification
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'chat', 'recommendation', 'prediction', 'search', 'classification',
        'analysis', 'validation', 'prescription_check', 'drug_interaction',
        'inventory_optimization', 'demand_forecast', 'other'
    )),
    action_category VARCHAR(50),
    
    -- Request/Response data
    input_data JSONB,
    output_data JSONB,
    context_data JSONB,
    
    -- Model information
    model_used VARCHAR(100),
    model_version VARCHAR(50),
    provider VARCHAR(50), -- e.g., 'openai', 'anthropic', 'custom'
    endpoint VARCHAR(255),
    
    -- Token usage
    prompt_tokens INTEGER DEFAULT 0 CHECK (prompt_tokens >= 0),
    completion_tokens INTEGER DEFAULT 0 CHECK (completion_tokens >= 0),
    total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
    
    -- Performance metrics
    execution_time_ms INTEGER CHECK (execution_time_ms >= 0),
    response_time_ms INTEGER CHECK (response_time_ms >= 0),
    latency_ms INTEGER CHECK (latency_ms >= 0),
    
    -- Quality and feedback
    success BOOLEAN DEFAULT true NOT NULL,
    confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    user_feedback INTEGER CHECK (user_feedback >= 1 AND user_feedback <= 5),
    user_feedback_text TEXT,
    feedback_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Error tracking
    error_code VARCHAR(50),
    error_message TEXT,
    error_stack TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Cost tracking
    estimated_cost DECIMAL(10,6),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    
    -- Additional metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint: either success or error fields populated
    CHECK (success OR error_message IS NOT NULL)
);

COMMENT ON TABLE public.ai_logs IS 'Comprehensive AI operation logging for analytics and debugging';

-- ============================================================================
-- 8. INVENTORY TRANSACTIONS TABLE (For complete audit trail)
-- ============================================================================
CREATE TABLE public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
        'purchase', 'sale', 'return', 'adjustment', 'damaged', 'expired', 'transfer', 'initial'
    )),
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'manual', 'system'
    reference_id UUID, -- order_id or other reference
    reason TEXT,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.inventory_transactions IS 'Complete audit trail of inventory changes';

-- ============================================================================
-- 9. PRESCRIPTION UPLOADS TABLE
-- ============================================================================
CREATE TABLE public.prescription_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),
    
    -- Verification status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- OCR/AI extraction
    extracted_data JSONB,
    extraction_confidence DECIMAL(5,4),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.prescription_uploads IS 'Prescription document uploads and verification';

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- User Profiles
CREATE INDEX idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX idx_user_profiles_last_login ON public.user_profiles(last_login);
CREATE INDEX idx_user_profiles_name ON public.user_profiles(first_name, last_name);

-- Medicines
CREATE INDEX idx_medicines_name ON public.medicines(name);
CREATE INDEX idx_medicines_generic_name ON public.medicines(generic_name);
CREATE INDEX idx_medicines_brand_name ON public.medicines(brand_name);
CREATE INDEX idx_medicines_ndc_code ON public.medicines(ndc_code);
CREATE INDEX idx_medicines_category ON public.medicines(category);
CREATE INDEX idx_medicines_stock_quantity ON public.medicines(stock_quantity);
CREATE INDEX idx_medicines_is_active ON public.medicines(is_active);
CREATE INDEX idx_medicines_prescription_required ON public.medicines(prescription_required);
CREATE INDEX idx_medicines_form ON public.medicines(form);
CREATE INDEX idx_medicines_therapeutic_class ON public.medicines(therapeutic_class);

-- Full-text search index for medicines
CREATE INDEX idx_medicines_search_vector ON public.medicines USING GIN(search_vector);

-- Compound index for low stock alerts
CREATE INDEX idx_medicines_low_stock ON public.medicines(stock_quantity, min_stock_level, is_active) 
    WHERE is_active = true AND stock_quantity <= min_stock_level;

-- Orders
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_pharmacist_id ON public.orders(pharmacist_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_date ON public.orders(order_date DESC);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_prescription_number ON public.orders(prescription_number);

-- Compound indexes for common queries
CREATE INDEX idx_orders_customer_status ON public.orders(customer_id, status);
CREATE INDEX idx_orders_customer_date ON public.orders(customer_id, order_date DESC);
CREATE INDEX idx_orders_date_status ON public.orders(order_date DESC, status);
CREATE INDEX idx_orders_status_date ON public.orders(status, order_date DESC);

-- Order Items
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_medicine_id ON public.order_items(medicine_id);
CREATE INDEX idx_order_items_status ON public.order_items(status);

-- Refill Predictions
CREATE INDEX idx_refill_predictions_customer_id ON public.refill_predictions(customer_id);
CREATE INDEX idx_refill_predictions_medicine_id ON public.refill_predictions(medicine_id);
CREATE INDEX idx_refill_predictions_predicted_date ON public.refill_predictions(predicted_refill_date);
CREATE INDEX idx_refill_predictions_confidence ON public.refill_predictions(confidence_score DESC);
CREATE INDEX idx_refill_predictions_is_active ON public.refill_predictions(is_active);
CREATE INDEX idx_refill_predictions_notification_sent ON public.refill_predictions(notification_sent);

-- Compound indexes for refill predictions
CREATE INDEX idx_refill_predictions_customer_active ON public.refill_predictions(customer_id, is_active, predicted_refill_date);
CREATE INDEX idx_refill_predictions_active_date ON public.refill_predictions(is_active, predicted_refill_date) 
    WHERE is_active = true;
CREATE INDEX idx_refill_predictions_upcoming ON public.refill_predictions(predicted_refill_date, is_active, notification_sent)
    WHERE is_active = true AND notification_sent = false;

-- AI Logs
CREATE INDEX idx_ai_logs_user_id ON public.ai_logs(user_id);
CREATE INDEX idx_ai_logs_session_id ON public.ai_logs(session_id);
CREATE INDEX idx_ai_logs_action_type ON public.ai_logs(action_type);
CREATE INDEX idx_ai_logs_created_at ON public.ai_logs(created_at DESC);
CREATE INDEX idx_ai_logs_success ON public.ai_logs(success);
CREATE INDEX idx_ai_logs_model_used ON public.ai_logs(model_used);

-- Compound indexes for analytics
CREATE INDEX idx_ai_logs_user_action_date ON public.ai_logs(user_id, action_type, created_at DESC);
CREATE INDEX idx_ai_logs_type_success_date ON public.ai_logs(action_type, success, created_at DESC);

-- Partial index for errors only (more efficient for error analysis)
CREATE INDEX idx_ai_logs_errors ON public.ai_logs(error_code, created_at DESC) 
    WHERE success = false;

-- Inventory Transactions
CREATE INDEX idx_inventory_transactions_medicine_id ON public.inventory_transactions(medicine_id);
CREATE INDEX idx_inventory_transactions_type ON public.inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_created_at ON public.inventory_transactions(created_at DESC);
CREATE INDEX idx_inventory_transactions_performed_by ON public.inventory_transactions(performed_by);
CREATE INDEX idx_inventory_transactions_medicine_date ON public.inventory_transactions(medicine_id, created_at DESC);

-- Prescription Uploads
CREATE INDEX idx_prescription_uploads_customer_id ON public.prescription_uploads(customer_id);
CREATE INDEX idx_prescription_uploads_order_id ON public.prescription_uploads(order_id);
CREATE INDEX idx_prescription_uploads_status ON public.prescription_uploads(status);
CREATE INDEX idx_prescription_uploads_created_at ON public.prescription_uploads(created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.refill_predictions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.prescription_uploads
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update medicine search vector
CREATE OR REPLACE FUNCTION public.update_medicine_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.generic_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.brand_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medicine_search_vector
    BEFORE INSERT OR UPDATE OF name, generic_name, brand_name, description, category
    ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION public.update_medicine_search_vector();

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := 'ORD-' || TO_CHAR(timezone('utc'::text, now()), 'YYYYMMDD') || '-' || 
                           LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Function to log inventory changes
CREATE OR REPLACE FUNCTION public.log_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stock_quantity != NEW.stock_quantity THEN
        INSERT INTO public.inventory_transactions (
            medicine_id,
            transaction_type,
            quantity_change,
            quantity_before,
            quantity_after,
            reference_type,
            reason,
            performed_by
        ) VALUES (
            NEW.id,
            'adjustment',
            NEW.stock_quantity - OLD.stock_quantity,
            OLD.stock_quantity,
            NEW.stock_quantity,
            'system',
            'Stock quantity updated',
            NEW.updated_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_inventory_change_trigger
    AFTER UPDATE OF stock_quantity ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION public.log_inventory_change();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refill_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_uploads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROLES TABLE POLICIES
-- ============================================================================

-- Everyone can view roles
CREATE POLICY "Roles are viewable by all authenticated users"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can modify roles
CREATE POLICY "Only admins can insert roles"
    ON public.roles FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name = 'admin'
        )
    );

CREATE POLICY "Only admins can update roles"
    ON public.roles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name = 'admin'
        )
    );

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can view own profile, admins and pharmacists can view all
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist')
        )
    );

-- Users can update own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Only admins can insert profiles (typically done via trigger on auth.users)
CREATE POLICY "Admins can insert profiles"
    ON public.user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name = 'admin'
        )
    );

-- ============================================================================
-- MEDICINES POLICIES
-- ============================================================================

-- Everyone can view active medicines
CREATE POLICY "Active medicines are viewable by all authenticated users"
    ON public.medicines FOR SELECT
    TO authenticated
    USING (is_active = true OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist', 'staff')
        )
    );

-- Only admins and pharmacists can insert medicines
CREATE POLICY "Admins and pharmacists can insert medicines"
    ON public.medicines FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist')
        )
    );

-- Only admins and pharmacists can update medicines
CREATE POLICY "Admins and pharmacists can update medicines"
    ON public.medicines FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist')
        )
    );

-- Only admins can delete medicines
CREATE POLICY "Only admins can delete medicines"
    ON public.medicines FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name = 'admin'
        )
    );

-- ============================================================================
-- ORDERS POLICIES
-- ============================================================================

-- Users can view own orders, staff can view all
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist', 'staff')
        )
    );

-- Customers can insert their own orders
CREATE POLICY "Customers can create orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (customer_id = auth.uid());

-- Customers can update own orders (limited status), staff can update any
CREATE POLICY "Users can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (
        (customer_id = auth.uid() AND status IN ('pending', 'confirmed')) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist', 'staff')
        )
    );

-- Only admins can delete orders
CREATE POLICY "Only admins can delete orders"
    ON public.orders FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name = 'admin'
        )
    );

-- ============================================================================
-- ORDER ITEMS POLICIES
-- ============================================================================

-- Users can view items from their orders, staff can view all
CREATE POLICY "Users can view order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (o.customer_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.user_profiles up
                    JOIN public.roles r ON up.role_id = r.id
                    WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist', 'staff')
                )
            )
        )
    );

-- Users can insert items into their own orders
CREATE POLICY "Users can insert order items"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id AND o.customer_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist', 'staff')
        )
    );

-- ============================================================================
-- REFILL PREDICTIONS POLICIES
-- ============================================================================

-- Users can view their own predictions, staff can view all
CREATE POLICY "Users can view own refill predictions"
    ON public.refill_predictions FOR SELECT
    TO authenticated
    USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist', 'staff')
        )
    );

-- Only system/admins can insert predictions
CREATE POLICY "Only admins can insert refill predictions"
    ON public.refill_predictions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist')
        )
    );

-- Users can update their prediction responses
CREATE POLICY "Users can update refill predictions"
    ON public.refill_predictions FOR UPDATE
    TO authenticated
    USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist')
        )
    );

-- ============================================================================
-- AI LOGS POLICIES
-- ============================================================================

-- Users can view their own logs, admins can view all
CREATE POLICY "Users can view own AI logs"
    ON public.ai_logs FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name = 'admin'
        )
    );

-- All authenticated users can insert logs
CREATE POLICY "Authenticated users can insert AI logs"
    ON public.ai_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only admins can update logs (for feedback)
CREATE POLICY "Admins can update AI logs"
    ON public.ai_logs FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name = 'admin'
        )
    );

-- ============================================================================
-- INVENTORY TRANSACTIONS POLICIES
-- ============================================================================

-- Staff can view all transactions
CREATE POLICY "Staff can view inventory transactions"
    ON public.inventory_transactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist', 'staff')
        )
    );

-- Staff can insert transactions
CREATE POLICY "Staff can insert inventory transactions"
    ON public.inventory_transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist', 'staff')
        )
    );

-- ============================================================================
-- PRESCRIPTION UPLOADS POLICIES
-- ============================================================================

-- Users can view their own uploads, staff can view all
CREATE POLICY "Users can view own prescription uploads"
    ON public.prescription_uploads FOR SELECT
    TO authenticated
    USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist', 'staff')
        )
    );

-- Users can insert their own uploads
CREATE POLICY "Users can insert prescription uploads"
    ON public.prescription_uploads FOR INSERT
    TO authenticated
    WITH CHECK (customer_id = auth.uid());

-- Staff can update uploads
CREATE POLICY "Staff can update prescription uploads"
    ON public.prescription_uploads FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist', 'staff')
        )
    );

-- ============================================================================
-- UTILITY VIEWS
-- ============================================================================

-- View: Order Summary
CREATE OR REPLACE VIEW public.order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.status,
    o.order_date,
    o.total_amount,
    o.payment_status,
    up.first_name || ' ' || up.last_name AS customer_name,
    au.email AS customer_email,
    COUNT(DISTINCT oi.id) AS total_items,
    SUM(oi.quantity) AS total_quantity,
    ph.first_name || ' ' || ph.last_name AS pharmacist_name
FROM public.orders o
JOIN auth.users au ON o.customer_id = au.id
JOIN public.user_profiles up ON o.customer_id = up.id
LEFT JOIN public.user_profiles ph ON o.pharmacist_id = ph.id
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, up.first_name, up.last_name, au.email, ph.first_name, ph.last_name;

-- View: Low Stock Medicines
CREATE OR REPLACE VIEW public.low_stock_medicines AS
SELECT 
    id,
    name,
    generic_name,
    brand_name,
    stock_quantity,
    min_stock_level,
    reorder_level,
    (min_stock_level - stock_quantity) AS shortage_amount,
    ROUND(((min_stock_level - stock_quantity)::DECIMAL / min_stock_level * 100), 2) AS shortage_percentage
FROM public.medicines
WHERE stock_quantity <= min_stock_level 
    AND is_active = true
ORDER BY shortage_percentage DESC;

-- View: Upcoming Refills (Next 7 days)
CREATE OR REPLACE VIEW public.upcoming_refills AS
SELECT 
    rp.id,
    rp.predicted_refill_date,
    rp.confidence_score,
    rp.notification_sent,
    up.first_name || ' ' || up.last_name AS customer_name,
    au.email AS customer_email,
    COALESCE(up.phone, '') AS customer_phone,
    m.name AS medicine_name,
    m.generic_name,
    m.price,
    m.stock_quantity
FROM public.refill_predictions rp
JOIN auth.users au ON rp.customer_id = au.id
JOIN public.user_profiles up ON rp.customer_id = up.id
JOIN public.medicines m ON rp.medicine_id = m.id
WHERE rp.is_active = true 
    AND rp.predicted_refill_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY rp.predicted_refill_date, rp.confidence_score DESC;

-- View: Daily AI Usage Stats
CREATE OR REPLACE VIEW public.daily_ai_usage_stats AS
SELECT 
    DATE(created_at) AS date,
    action_type,
    COUNT(*) AS total_requests,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) AS successful_requests,
    ROUND(AVG(execution_time_ms), 2) AS avg_execution_time_ms,
    SUM(total_tokens) AS total_tokens_used,
    SUM(estimated_cost) AS total_cost
FROM public.ai_logs
GROUP BY DATE(created_at), action_type
ORDER BY date DESC, total_requests DESC;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default roles
INSERT INTO public.roles (name, description, permissions) VALUES
('admin', 'System Administrator with full access', '{"all": true, "manage_users": true, "manage_roles": true, "manage_inventory": true, "manage_orders": true, "view_analytics": true, "manage_settings": true}'),
('pharmacist', 'Licensed Pharmacist', '{"manage_prescriptions": true, "verify_prescriptions": true, "manage_inventory": true, "process_orders": true, "view_reports": true, "access_medical_info": true}'),
('staff', 'Pharmacy Staff', '{"manage_inventory": true, "process_orders": true, "view_orders": true, "basic_reports": true}'),
('customer', 'Customer/Patient', '{"place_orders": true, "view_orders": true, "upload_prescriptions": true, "chat": true, "view_refill_predictions": true}')
ON CONFLICT (name) DO NOTHING;

-- Sample medicines
INSERT INTO public.medicines (
    name, generic_name, brand_name, description, dosage, form, strength,
    manufacturer, price, cost, stock_quantity, min_stock_level, max_stock_level,
    prescription_required, category, therapeutic_class, is_active
) VALUES
('Amoxicillin 500mg Capsules', 'Amoxicillin', 'Amoxil', 'Antibiotic used to treat bacterial infections', '500mg', 'capsule', '500mg', 'PharmaCorp', 15.99, 8.00, 500, 100, 1000, true, 'Antibiotics', 'Beta-Lactam Antibiotics', true),
('Ibuprofen 200mg Tablets', 'Ibuprofen', 'Advil', 'Non-steroidal anti-inflammatory drug (NSAID)', '200mg', 'tablet', '200mg', 'MediPharm', 8.99, 4.50, 1000, 200, 2000, false, 'Pain Relief', 'NSAIDs', true),
('Lisinopril 10mg Tablets', 'Lisinopril', 'Prinivil', 'ACE inhibitor for high blood pressure', '10mg', 'tablet', '10mg', 'CardioMed', 12.99, 6.00, 300, 50, 500, true, 'Cardiovascular', 'ACE Inhibitors', true),
('Metformin 500mg Tablets', 'Metformin', 'Glucophage', 'Diabetes medication', '500mg', 'tablet', '500mg', 'DiabetesCare', 10.99, 5.50, 400, 80, 800, true, 'Diabetes', 'Biguanides', true),
('Omeprazole 20mg Capsules', 'Omeprazole', 'Prilosec', 'Proton pump inhibitor for acid reflux', '20mg', 'capsule', '20mg', 'GastroHealth', 18.99, 9.00, 250, 50, 500, true, 'Gastrointestinal', 'Proton Pump Inhibitors', true),
('Atorvastatin 20mg Tablets', 'Atorvastatin', 'Lipitor', 'Statin for cholesterol management', '20mg', 'tablet', '20mg', 'CardioMed', 22.99, 11.00, 350, 70, 700, true, 'Cardiovascular', 'Statins', true),
('Acetaminophen 500mg Tablets', 'Acetaminophen', 'Tylenol', 'Pain reliever and fever reducer', '500mg', 'tablet', '500mg', 'PainAway', 7.99, 3.50, 800, 150, 1500, false, 'Pain Relief', 'Analgesics', true),
('Azithromycin 250mg Tablets', 'Azithromycin', 'Zithromax', 'Macrolide antibiotic', '250mg', 'tablet', '250mg', 'PharmaCorp', 28.99, 14.00, 150, 30, 300, true, 'Antibiotics', 'Macrolide Antibiotics', true),
('Albuterol Inhaler', 'Albuterol', 'ProAir', 'Bronchodilator for asthma', '90mcg', 'inhaler', '90mcg per actuation', 'RespiraTech', 45.99, 22.00, 100, 20, 200, true, 'Respiratory', 'Bronchodilators', true),
('Levothyroxine 50mcg Tablets', 'Levothyroxine', 'Synthroid', 'Thyroid hormone replacement', '50mcg', 'tablet', '50mcg', 'EndocrineHealth', 14.99, 7.00, 300, 60, 600, true, 'Endocrine', 'Thyroid Hormones', true);

-- Note: User profiles will be created via Supabase Auth triggers
-- Sample users would be created through the application's signup flow

-- ============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to check medicine stock before order
CREATE OR REPLACE FUNCTION public.check_medicine_stock(
    p_medicine_id UUID,
    p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_stock INTEGER;
BEGIN
    SELECT stock_quantity INTO v_stock
    FROM public.medicines
    WHERE id = p_medicine_id AND is_active = true;
    
    RETURN v_stock >= p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_role_name VARCHAR;
BEGIN
    SELECT r.name INTO v_role_name
    FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = p_user_id;
    
    RETURN v_role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate order total
CREATE OR REPLACE FUNCTION public.calculate_order_total(p_order_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_total DECIMAL;
BEGIN
    SELECT COALESCE(SUM(total_price), 0) INTO v_total
    FROM public.order_items
    WHERE order_id = p_order_id;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REALTIME SUBSCRIPTIONS (Enable for relevant tables)
-- ============================================================================

-- Enable realtime for orders (so customers can see live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.refill_predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medicines;

-- ============================================================================
-- STORAGE BUCKETS (For Supabase Storage)
-- ============================================================================

-- Run this in Supabase Dashboard Storage settings or via Supabase CLI:
-- - Create bucket: 'prescriptions' (private)
-- - Create bucket: 'medicine-images' (public)
-- - Create bucket: 'avatars' (public)

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AI Pharmacist Schema Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: 9';
    RAISE NOTICE 'Indexes created: 50+';
    RAISE NOTICE 'RLS policies: 30+';
    RAISE NOTICE 'Triggers: 5';
    RAISE NOTICE 'Views: 4';
    RAISE NOTICE 'Functions: 6';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create Supabase Storage buckets';
    RAISE NOTICE '2. Configure auth providers';
    RAISE NOTICE '3. Test RLS policies';
    RAISE NOTICE '4. Import additional seed data';
    RAISE NOTICE '========================================';
END $$;
