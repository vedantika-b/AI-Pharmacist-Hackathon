-- ============================================================================
-- SUPABASE HELPER FUNCTIONS & COMPUTED COLUMNS
-- ============================================================================
-- Additional utilities for dashboard stats and business logic
-- Run AFTER supabase_schema.sql
-- ============================================================================

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Get days remaining until refill
CREATE OR REPLACE FUNCTION public.calculate_days_remaining(predicted_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN (predicted_date - CURRENT_DATE)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get refill status based on days remaining
CREATE OR REPLACE FUNCTION public.get_refill_status(days_remaining INTEGER)
RETURNS VARCHAR AS $$
BEGIN
    IF days_remaining <= 5 THEN
        RETURN 'critical';
    ELSIF days_remaining <= 14 THEN
        RETURN 'low';
    ELSE
        RETURN 'safe';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if medicine is low stock
CREATE OR REPLACE FUNCTION public.is_low_stock(medicine_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    stock_qty INTEGER;
    min_level INTEGER;
BEGIN
    SELECT stock_quantity, min_stock_level
    INTO stock_qty, min_level
    FROM public.medicines
    WHERE id = medicine_id;
    
    RETURN stock_qty <= min_level;
END;
$$ LANGUAGE plpgsql;

-- Get customer order count
CREATE OR REPLACE FUNCTION public.get_customer_order_count(customer_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    order_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO order_count
    FROM public.orders
    WHERE customer_id = customer_uuid;
    
    RETURN order_count;
END;
$$ LANGUAGE plpgsql;

-- Get total spent by customer
CREATE OR REPLACE FUNCTION public.get_customer_total_spent(customer_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total DECIMAL;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO total
    FROM public.orders
    WHERE customer_id = customer_uuid
        AND payment_status = 'paid';
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DASHBOARD STATISTICS FUNCTIONS
-- ============================================================================

-- Get active orders count (last 30 days)
CREATE OR REPLACE FUNCTION public.get_active_orders_count()
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*) INTO count
    FROM public.orders
    WHERE created_at >= NOW() - INTERVAL '30 days';
    
    RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Get total customers count
CREATE OR REPLACE FUNCTION public.get_total_customers_count()
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT customer_id) INTO count
    FROM public.orders;
    
    RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Get low stock medicines count
CREATE OR REPLACE FUNCTION public.get_low_stock_count()
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*) INTO count
    FROM public.medicines
    WHERE stock_quantity <= min_stock_level
        AND is_active = true;
    
    RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Get revenue for period (last 30 days)
CREATE OR REPLACE FUNCTION public.get_revenue(days INTEGER DEFAULT 30)
RETURNS DECIMAL AS $$
DECLARE
    revenue DECIMAL;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO revenue
    FROM public.orders
    WHERE created_at >= NOW() - (days || ' days')::INTERVAL
        AND payment_status = 'paid';
    
    RETURN revenue;
END;
$$ LANGUAGE plpgsql;

-- Get critical refill predictions count
CREATE OR REPLACE FUNCTION public.get_critical_refills_count()
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*) INTO count
    FROM public.refill_predictions
    WHERE days_remaining <= 5
        AND is_active = true
        AND notification_sent = false;
    
    RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Get order trend (growth percentage)
CREATE OR REPLACE FUNCTION public.get_order_trend()
RETURNS JSONB AS $$
DECLARE
    recent_count INTEGER;
    previous_count INTEGER;
    growth_rate DECIMAL;
BEGIN
    -- Orders in last 7 days
    SELECT COUNT(*) INTO recent_count
    FROM public.orders
    WHERE created_at >= NOW() - INTERVAL '7 days';
    
    -- Orders in previous 7 days
    SELECT COUNT(*) INTO previous_count
    FROM public.orders
    WHERE created_at >= NOW() - INTERVAL '14 days'
        AND created_at < NOW() - INTERVAL '7 days';
    
    -- Calculate growth rate
    IF previous_count > 0 THEN
        growth_rate := ((recent_count::DECIMAL - previous_count) / previous_count * 100);
    ELSE
        growth_rate := 0;
    END IF;
    
    RETURN jsonb_build_object(
        'recent_count', recent_count,
        'previous_count', previous_count,
        'growth_rate', ROUND(growth_rate, 2),
        'trending_up', growth_rate > 0
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Daily order statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_daily_order_stats AS
SELECT 
    DATE(created_at) AS order_date,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_revenue,
    AVG(total_amount) AS avg_order_value,
    COUNT(DISTINCT customer_id) AS unique_customers
FROM public.orders
WHERE payment_status = 'paid'
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

CREATE UNIQUE INDEX ON public.mv_daily_order_stats (order_date);

-- Medicine popularity
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_medicine_popularity AS
SELECT 
    m.id,
    m.name,
    m.category,
    COUNT(DISTINCT oi.order_id) AS order_count,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.total_price) AS total_revenue,
    AVG(oi.unit_price) AS avg_price
FROM public.medicines m
JOIN public.order_items oi ON m.id = oi.medicine_id
JOIN public.orders o ON oi.order_id = o.id
WHERE o.payment_status = 'paid'
GROUP BY m.id, m.name, m.category
ORDER BY order_count DESC;

CREATE UNIQUE INDEX ON public.mv_medicine_popularity (id);

-- Refresh materialized views (run periodically via cron or manually)
CREATE OR REPLACE FUNCTION public.refresh_stats_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_daily_order_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_medicine_popularity;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC CALCULATIONS
-- ============================================================================

-- Auto-calculate days_remaining in refill_predictions
CREATE OR REPLACE FUNCTION public.update_refill_days_remaining()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days_remaining := (NEW.predicted_refill_date - CURRENT_DATE)::INTEGER;
    NEW.status := public.get_refill_status(NEW.days_remaining);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_refill_days_trigger ON public.refill_predictions;
CREATE TRIGGER update_refill_days_trigger
    BEFORE INSERT OR UPDATE OF predicted_refill_date
    ON public.refill_predictions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_refill_days_remaining();

-- Auto-calculate order total from items
CREATE OR REPLACE FUNCTION public.update_order_total()
RETURNS TRIGGER AS $$
DECLARE
    order_total DECIMAL;
BEGIN
    SELECT COALESCE(SUM(total_price), 0) INTO order_total
    FROM public.order_items
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
    
    UPDATE public.orders
    SET total_amount = order_total,
        subtotal = order_total
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_order_total_trigger ON public.order_items;
CREATE TRIGGER update_order_total_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_order_total();

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Top selling medicines
CREATE OR REPLACE VIEW public.top_selling_medicines AS
SELECT 
    m.id,
    m.name,
    m.category,
    COUNT(DISTINCT oi.order_id) AS order_count,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.total_price) AS revenue
FROM public.medicines m
JOIN public.order_items oi ON m.id = oi.medicine_id
JOIN public.orders o ON oi.order_id = o.id
WHERE o.payment_status = 'paid'
    AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY m.id, m.name, m.category
ORDER BY total_sold DESC
LIMIT 10;

-- Customer lifetime value
CREATE OR REPLACE VIEW public.customer_lifetime_value AS
SELECT 
    o.customer_id,
    up.full_name AS customer_name,
    COUNT(DISTINCT o.id) AS total_orders,
    SUM(o.total_amount) AS lifetime_value,
    AVG(o.total_amount) AS avg_order_value,
    MAX(o.created_at) AS last_order_date,
    MIN(o.created_at) AS first_order_date
FROM public.orders o
JOIN public.user_profiles up ON o.customer_id = up.id
WHERE o.payment_status = 'paid'
GROUP BY o.customer_id, up.full_name
ORDER BY lifetime_value DESC;

-- Inventory turnover rate
CREATE OR REPLACE VIEW public.inventory_turnover AS
SELECT 
    m.id,
    m.name,
    m.category,
    m.stock_quantity,
    COALESCE(SUM(oi.quantity), 0) AS quantity_sold_30d,
    CASE 
        WHEN m.stock_quantity > 0 
        THEN ROUND((COALESCE(SUM(oi.quantity), 0)::DECIMAL / m.stock_quantity), 2)
        ELSE 0 
    END AS turnover_rate
FROM public.medicines m
LEFT JOIN public.order_items oi ON m.id = oi.medicine_id
LEFT JOIN public.orders o ON oi.order_id = o.id AND o.created_at >= NOW() - INTERVAL '30 days'
WHERE m.is_active = true
GROUP BY m.id, m.name, m.category, m.stock_quantity
ORDER BY turnover_rate DESC;

-- ============================================================================
-- SCHEDULED FUNCTIONS (Use with pg_cron or Supabase Functions)
-- ============================================================================

-- Daily cleanup of old AI logs (keep last 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_ai_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.ai_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Update refill predictions status daily
CREATE OR REPLACE FUNCTION public.update_refill_statuses()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.refill_predictions
    SET 
        days_remaining = (predicted_refill_date - CURRENT_DATE)::INTEGER,
        status = public.get_refill_status((predicted_refill_date - CURRENT_DATE)::INTEGER)
    WHERE is_active = true;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
-- Get dashboard statistics
SELECT 
    public.get_active_orders_count() AS active_orders,
    public.get_total_customers_count() AS total_customers,
    public.get_low_stock_count() AS low_stock_items,
    public.get_revenue(30) AS monthly_revenue,
    public.get_critical_refills_count() AS critical_refills;

-- Get order trend
SELECT * FROM public.get_order_trend();

-- Get top selling medicines
SELECT * FROM public.top_selling_medicines;

-- Get customer lifetime values
SELECT * FROM public.customer_lifetime_value LIMIT 10;

-- Refresh statistics (run daily)
SELECT public.refresh_stats_views();
SELECT public.update_refill_statuses();
SELECT public.cleanup_old_ai_logs();
*/

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Helper functions installed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Functions: 12 created';
    RAISE NOTICE 'Views: 7 created';
    RAISE NOTICE 'Materialized Views: 2 created';
    RAISE NOTICE 'Triggers: 2 updated';
    RAISE NOTICE '========================================';
END $$;
