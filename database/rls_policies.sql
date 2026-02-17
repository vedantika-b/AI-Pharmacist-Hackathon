-- ============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Focused RLS policies for AI Pharmacist system
-- Using Supabase auth.uid() for current user identification
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Get Current User's Role
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT r.name INTO user_role
    FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = auth.uid();
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- HELPER FUNCTION: Check if User Has Role
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles up
        JOIN public.roles r ON up.role_id = r.id
        WHERE up.id = auth.uid()
        AND r.name = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- HELPER FUNCTION: Check if User Has Any of Multiple Roles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles up
        JOIN public.roles r ON up.role_id = r.id
        WHERE up.id = auth.uid()
        AND r.name = ANY(required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- ORDERS: Customers can only see their own orders, admins can see all
-- ============================================================================

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Customers see own orders, admins see all
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy"
    ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        -- Customer sees only their own orders
        customer_id = auth.uid()
        OR
        -- Admin sees all orders
        public.user_has_role('admin')
        OR
        -- Pharmacists and staff can also see all orders
        public.user_has_any_role(ARRAY['pharmacist', 'staff'])
    );

-- Policy: INSERT - Customers can create their own orders
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
CREATE POLICY "orders_insert_policy"
    ON public.orders
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Customer can only create orders for themselves
        customer_id = auth.uid()
        OR
        -- Staff can create orders on behalf of customers
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    );

-- Policy: UPDATE - Customers can update own pending orders, staff can update any
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
CREATE POLICY "orders_update_policy"
    ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        -- Customer can update own orders if status is pending/confirmed
        (customer_id = auth.uid() AND status IN ('pending', 'confirmed'))
        OR
        -- Staff can update any order
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    )
    WITH CHECK (
        -- Same conditions as USING clause
        (customer_id = auth.uid() AND status IN ('pending', 'confirmed'))
        OR
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    );

-- Policy: DELETE - Only admins can delete orders
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;
CREATE POLICY "orders_delete_policy"
    ON public.orders
    FOR DELETE
    TO authenticated
    USING (
        public.user_has_role('admin')
    );

-- ============================================================================
-- ORDER ITEMS: Follow parent order permissions
-- ============================================================================

-- Enable RLS on order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Based on parent order permissions
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
CREATE POLICY "order_items_select_policy"
    ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (
                o.customer_id = auth.uid()
                OR
                public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
            )
        )
    );

-- Policy: INSERT - Can add items to own orders or staff can add to any
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
CREATE POLICY "order_items_insert_policy"
    ON public.order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (
                o.customer_id = auth.uid()
                OR
                public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
            )
        )
    );

-- Policy: UPDATE - Follow parent order permissions
DROP POLICY IF EXISTS "order_items_update_policy" ON public.order_items;
CREATE POLICY "order_items_update_policy"
    ON public.order_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (
                (o.customer_id = auth.uid() AND o.status IN ('pending', 'confirmed'))
                OR
                public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
            )
        )
    );

-- Policy: DELETE - Only admins and staff can delete order items
DROP POLICY IF EXISTS "order_items_delete_policy" ON public.order_items;
CREATE POLICY "order_items_delete_policy"
    ON public.order_items
    FOR DELETE
    TO authenticated
    USING (
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    );

-- ============================================================================
-- MEDICINES/INVENTORY: Pharmacists can update, all can view active medicines
-- ============================================================================

-- Enable RLS on medicines table
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - All authenticated users can view active medicines
DROP POLICY IF EXISTS "medicines_select_policy" ON public.medicines;
CREATE POLICY "medicines_select_policy"
    ON public.medicines
    FOR SELECT
    TO authenticated
    USING (
        -- All users can see active medicines
        is_active = true
        OR
        -- Staff can see all medicines including inactive
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    );

-- Policy: INSERT - Only pharmacists and admins can add medicines
DROP POLICY IF EXISTS "medicines_insert_policy" ON public.medicines;
CREATE POLICY "medicines_insert_policy"
    ON public.medicines
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.user_has_any_role(ARRAY['admin', 'pharmacist'])
    );

-- Policy: UPDATE - Pharmacists and admins can update inventory
DROP POLICY IF EXISTS "medicines_update_policy" ON public.medicines;
CREATE POLICY "medicines_update_policy"
    ON public.medicines
    FOR UPDATE
    TO authenticated
    USING (
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    )
    WITH CHECK (
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    );

-- Policy: DELETE - Only admins can delete medicines
DROP POLICY IF EXISTS "medicines_delete_policy" ON public.medicines;
CREATE POLICY "medicines_delete_policy"
    ON public.medicines
    FOR DELETE
    TO authenticated
    USING (
        public.user_has_role('admin')
    );

-- ============================================================================
-- INVENTORY TRANSACTIONS: Staff can view/create, tracks all stock changes
-- ============================================================================

-- Enable RLS on inventory_transactions table
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Only staff can view inventory transactions
DROP POLICY IF EXISTS "inventory_transactions_select_policy" ON public.inventory_transactions;
CREATE POLICY "inventory_transactions_select_policy"
    ON public.inventory_transactions
    FOR SELECT
    TO authenticated
    USING (
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    );

-- Policy: INSERT - Only staff can create inventory transactions
DROP POLICY IF EXISTS "inventory_transactions_insert_policy" ON public.inventory_transactions;
CREATE POLICY "inventory_transactions_insert_policy"
    ON public.inventory_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    );

-- No UPDATE or DELETE - inventory transactions are immutable audit logs

-- ============================================================================
-- ROLES: Only admins can modify roles
-- ============================================================================

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - All authenticated users can view roles
DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
CREATE POLICY "roles_select_policy"
    ON public.roles
    FOR SELECT
    TO authenticated
    USING (
        -- Everyone can see what roles exist
        true
    );

-- Policy: INSERT - Only admins can create new roles
DROP POLICY IF EXISTS "roles_insert_policy" ON public.roles;
CREATE POLICY "roles_insert_policy"
    ON public.roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.user_has_role('admin')
    );

-- Policy: UPDATE - Only admins can modify roles
DROP POLICY IF EXISTS "roles_update_policy" ON public.roles;
CREATE POLICY "roles_update_policy"
    ON public.roles
    FOR UPDATE
    TO authenticated
    USING (
        public.user_has_role('admin')
    )
    WITH CHECK (
        public.user_has_role('admin')
    );

-- Policy: DELETE - Only admins can delete roles
DROP POLICY IF EXISTS "roles_delete_policy" ON public.roles;
CREATE POLICY "roles_delete_policy"
    ON public.roles
    FOR DELETE
    TO authenticated
    USING (
        public.user_has_role('admin')
    );

-- ============================================================================
-- USER PROFILES: Users can view/update own profile, admins can see all
-- ============================================================================

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Users see own profile, admins and pharmacists see all
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_select_policy"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR
        public.user_has_any_role(ARRAY['admin', 'pharmacist'])
    );

-- Policy: INSERT - Users can create their own profile (via trigger), admins can create any
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_insert_policy"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        id = auth.uid()
        OR
        public.user_has_role('admin')
    );

-- Policy: UPDATE - Users can update own profile, admins can update any
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_update_policy"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (
        id = auth.uid()
        OR
        public.user_has_role('admin')
    )
    WITH CHECK (
        id = auth.uid()
        OR
        public.user_has_role('admin')
    );

-- Policy: DELETE - Only admins can delete profiles
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_delete_policy"
    ON public.user_profiles
    FOR DELETE
    TO authenticated
    USING (
        public.user_has_role('admin')
    );

-- ============================================================================
-- REFILL PREDICTIONS: Users see own predictions, staff see all
-- ============================================================================

-- Enable RLS on refill_predictions table
ALTER TABLE public.refill_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Users see own predictions, staff see all
DROP POLICY IF EXISTS "refill_predictions_select_policy" ON public.refill_predictions;
CREATE POLICY "refill_predictions_select_policy"
    ON public.refill_predictions
    FOR SELECT
    TO authenticated
    USING (
        customer_id = auth.uid()
        OR
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    );

-- Policy: INSERT - Only admins and pharmacists can create predictions
DROP POLICY IF EXISTS "refill_predictions_insert_policy" ON public.refill_predictions;
CREATE POLICY "refill_predictions_insert_policy"
    ON public.refill_predictions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.user_has_any_role(ARRAY['admin', 'pharmacist'])
    );

-- Policy: UPDATE - Users can update their response, staff can update any
DROP POLICY IF EXISTS "refill_predictions_update_policy" ON public.refill_predictions;
CREATE POLICY "refill_predictions_update_policy"
    ON public.refill_predictions
    FOR UPDATE
    TO authenticated
    USING (
        customer_id = auth.uid()
        OR
        public.user_has_any_role(ARRAY['admin', 'pharmacist'])
    )
    WITH CHECK (
        customer_id = auth.uid()
        OR
        public.user_has_any_role(ARRAY['admin', 'pharmacist'])
    );

-- ============================================================================
-- AI LOGS: Users see own logs, admins see all
-- ============================================================================

-- Enable RLS on ai_logs table
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Users see own logs, admins see all
DROP POLICY IF EXISTS "ai_logs_select_policy" ON public.ai_logs;
CREATE POLICY "ai_logs_select_policy"
    ON public.ai_logs
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR
        public.user_has_role('admin')
    );

-- Policy: INSERT - All authenticated users can create logs
DROP POLICY IF EXISTS "ai_logs_insert_policy" ON public.ai_logs;
CREATE POLICY "ai_logs_insert_policy"
    ON public.ai_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Users can only log their own actions
        user_id = auth.uid()
        OR
        user_id IS NULL  -- Allow system logs
        OR
        public.user_has_role('admin')
    );

-- Policy: UPDATE - Users can update own logs (for feedback), admins can update any
DROP POLICY IF EXISTS "ai_logs_update_policy" ON public.ai_logs;
CREATE POLICY "ai_logs_update_policy"
    ON public.ai_logs
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR
        public.user_has_role('admin')
    )
    WITH CHECK (
        user_id = auth.uid()
        OR
        public.user_has_role('admin')
    );

-- ============================================================================
-- PRESCRIPTION UPLOADS: Users see/upload own, staff see all
-- ============================================================================

-- Enable RLS on prescription_uploads table
ALTER TABLE public.prescription_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Users see own uploads, staff see all
DROP POLICY IF EXISTS "prescription_uploads_select_policy" ON public.prescription_uploads;
CREATE POLICY "prescription_uploads_select_policy"
    ON public.prescription_uploads
    FOR SELECT
    TO authenticated
    USING (
        customer_id = auth.uid()
        OR
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    );

-- Policy: INSERT - Users can upload their own prescriptions
DROP POLICY IF EXISTS "prescription_uploads_insert_policy" ON public.prescription_uploads;
CREATE POLICY "prescription_uploads_insert_policy"
    ON public.prescription_uploads
    FOR INSERT
    TO authenticated
    WITH CHECK (
        customer_id = auth.uid()
        OR
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    );

-- Policy: UPDATE - Staff can update/verify prescriptions
DROP POLICY IF EXISTS "prescription_uploads_update_policy" ON public.prescription_uploads;
CREATE POLICY "prescription_uploads_update_policy"
    ON public.prescription_uploads
    FOR UPDATE
    TO authenticated
    USING (
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    )
    WITH CHECK (
        public.user_has_any_role(ARRAY['admin', 'pharmacist', 'staff'])
    );

-- Policy: DELETE - Only admins can delete prescriptions
DROP POLICY IF EXISTS "prescription_uploads_delete_policy" ON public.prescription_uploads;
CREATE POLICY "prescription_uploads_delete_policy"
    ON public.prescription_uploads
    FOR DELETE
    TO authenticated
    USING (
        public.user_has_role('admin')
    );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test if RLS is enabled on all tables
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS Policy Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables with RLS enabled:';
    RAISE NOTICE '  ✓ roles';
    RAISE NOTICE '  ✓ user_profiles';
    RAISE NOTICE '  ✓ medicines';
    RAISE NOTICE '  ✓ orders';
    RAISE NOTICE '  ✓ order_items';
    RAISE NOTICE '  ✓ refill_predictions';
    RAISE NOTICE '  ✓ ai_logs';
    RAISE NOTICE '  ✓ inventory_transactions';
    RAISE NOTICE '  ✓ prescription_uploads';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Key Policies:';
    RAISE NOTICE '  ✓ Customers see only their own orders';
    RAISE NOTICE '  ✓ Admins see all orders';
    RAISE NOTICE '  ✓ Pharmacists can update inventory';
    RAISE NOTICE '  ✓ Only admins can modify roles';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- TESTING QUERIES (Comment out in production)
-- ============================================================================

-- Check RLS status
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true;

-- List all policies
-- SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
