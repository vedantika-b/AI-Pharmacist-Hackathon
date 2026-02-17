# Database Quick Reference Guide

## Common Queries and Operations

### Table of Contents
- [Medicines](#medicines)
- [Orders](#orders)
- [Refill Predictions](#refill-predictions)
- [AI Logs](#ai-logs)
- [User Management](#user-management)
- [Inventory](#inventory)
- [Analytics](#analytics)

---

## Medicines

### Search Medicines by Name
```sql
SELECT * FROM public.medicines 
WHERE name ILIKE '%aspirin%'
  AND is_active = true;
```

### Full-Text Search
```sql
SELECT 
  id, name, generic_name, price, stock_quantity,
  ts_rank(search_vector, query) AS rank
FROM public.medicines,
     to_tsquery('english', 'pain & relief') query
WHERE search_vector @@ query
  AND is_active = true
ORDER BY rank DESC;
```

### Get Low Stock Medicines
```sql
SELECT * FROM public.low_stock_medicines;
```

### Check Medicine Availability
```sql
SELECT public.check_medicine_stock('medicine-uuid-here', 10);
```

### Update Stock Quantity
```sql
UPDATE public.medicines 
SET stock_quantity = stock_quantity - 5,
    updated_by = auth.uid()
WHERE id = 'medicine-uuid-here';
```

---

## Orders

### Get Customer Orders with Items
```sql
SELECT 
  o.*,
  json_agg(
    json_build_object(
      'id', oi.id,
      'medicine_name', m.name,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'total_price', oi.total_price
    )
  ) AS items
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
LEFT JOIN public.medicines m ON oi.medicine_id = m.id
WHERE o.customer_id = auth.uid()
GROUP BY o.id
ORDER BY o.order_date DESC;
```

### Create Order with Items
```sql
-- Step 1: Create order
INSERT INTO public.orders (customer_id, total_amount, status)
VALUES (auth.uid(), 100.00, 'pending')
RETURNING id;

-- Step 2: Add order items
INSERT INTO public.order_items (order_id, medicine_id, quantity, unit_price)
VALUES 
  ('order-uuid', 'medicine-uuid-1', 2, 15.99),
  ('order-uuid', 'medicine-uuid-2', 1, 25.00);
```

### Update Order Status
```sql
UPDATE public.orders 
SET 
  status = 'confirmed',
  confirmed_at = NOW(),
  pharmacist_id = auth.uid()
WHERE id = 'order-uuid';
```

### Get Orders by Status
```sql
SELECT * FROM public.order_summary
WHERE status = 'pending'
ORDER BY order_date DESC;
```

### Calculate Order Total
```sql
SELECT public.calculate_order_total('order-uuid-here');
```

---

## Refill Predictions

### Get Upcoming Refills (Next 7 Days)
```sql
SELECT * FROM public.upcoming_refills;
```

### Get Customer's Active Predictions
```sql
SELECT 
  rp.*,
  m.name AS medicine_name,
  m.price,
  m.stock_quantity
FROM public.refill_predictions rp
JOIN public.medicines m ON rp.medicine_id = m.id
WHERE rp.customer_id = auth.uid()
  AND rp.is_active = true
  AND rp.predicted_refill_date >= CURRENT_DATE
ORDER BY rp.predicted_refill_date;
```

### Create Refill Prediction
```sql
INSERT INTO public.refill_predictions (
  customer_id,
  medicine_id,
  predicted_refill_date,
  confidence_score,
  average_consumption_days,
  model_version
) VALUES (
  'customer-uuid',
  'medicine-uuid',
  '2026-03-15',
  0.85,
  30,
  'v1.0'
);
```

### Mark Prediction as Converted
```sql
UPDATE public.refill_predictions
SET 
  converted_to_order = true,
  converted_order_id = 'order-uuid',
  customer_responded = true,
  customer_response_at = NOW()
WHERE id = 'prediction-uuid';
```

---

## AI Logs

### Log AI Interaction
```sql
INSERT INTO public.ai_logs (
  user_id,
  action_type,
  input_data,
  output_data,
  model_used,
  prompt_tokens,
  completion_tokens,
  execution_time_ms,
  success
) VALUES (
  auth.uid(),
  'chat',
  '{"message": "What medicines do you have for headache?"}',
  '{"response": "We have Ibuprofen and Acetaminophen available..."}',
  'gpt-4',
  50,
  120,
  1500,
  true
);
```

### Get AI Usage Statistics
```sql
SELECT * FROM public.daily_ai_usage_stats
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

### Get Failed AI Requests
```sql
SELECT 
  id,
  action_type,
  error_code,
  error_message,
  created_at
FROM public.ai_logs
WHERE success = false
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Calculate AI Costs (Monthly)
```sql
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  action_type,
  COUNT(*) AS total_requests,
  SUM(total_tokens) AS total_tokens,
  SUM(estimated_cost) AS total_cost
FROM public.ai_logs
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', created_at), action_type;
```

---

## User Management

### Get User Profile with Role
```sql
SELECT 
  up.*,
  r.name AS role_name,
  r.permissions
FROM public.user_profiles up
JOIN public.roles r ON up.role_id = r.id
WHERE up.id = auth.uid();
```

### Get User Role Name
```sql
SELECT public.get_user_role(auth.uid());
```

### Update User Profile
```sql
UPDATE public.user_profiles
SET 
  first_name = 'John',
  last_name = 'Doe',
  phone = '+1234567890',
  address = '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}'
WHERE id = auth.uid();
```

### Check User Permissions
```sql
SELECT r.permissions
FROM public.user_profiles up
JOIN public.roles r ON up.role_id = r.id
WHERE up.id = auth.uid();
```

---

## Inventory

### Get Inventory Transaction History
```sql
SELECT 
  it.*,
  m.name AS medicine_name,
  up.first_name || ' ' || up.last_name AS performed_by_name
FROM public.inventory_transactions it
JOIN public.medicines m ON it.medicine_id = m.id
LEFT JOIN public.user_profiles up ON it.performed_by = up.id
WHERE it.medicine_id = 'medicine-uuid'
ORDER BY it.created_at DESC;
```

### Record Manual Stock Adjustment
```sql
-- Get current stock
WITH current_stock AS (
  SELECT stock_quantity FROM public.medicines WHERE id = 'medicine-uuid'
)
-- Insert transaction
INSERT INTO public.inventory_transactions (
  medicine_id,
  transaction_type,
  quantity_change,
  quantity_before,
  quantity_after,
  reason,
  performed_by
)
SELECT 
  'medicine-uuid',
  'adjustment',
  10,
  stock_quantity,
  stock_quantity + 10,
  'Manual restock',
  auth.uid()
FROM current_stock;

-- Update medicine stock
UPDATE public.medicines
SET stock_quantity = stock_quantity + 10
WHERE id = 'medicine-uuid';
```

### Get Medicines Expiring Soon
```sql
SELECT 
  id,
  name,
  batch_number,
  expiry_date,
  stock_quantity,
  EXTRACT(DAY FROM expiry_date - CURRENT_DATE) AS days_until_expiry
FROM public.medicines
WHERE expiry_date IS NOT NULL
  AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  AND is_active = true
ORDER BY expiry_date;
```

---

## Analytics

### Daily Order Statistics
```sql
SELECT 
  DATE(order_date) AS date,
  COUNT(*) AS total_orders,
  SUM(total_amount) AS total_revenue,
  AVG(total_amount) AS avg_order_value,
  COUNT(DISTINCT customer_id) AS unique_customers
FROM public.orders
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(order_date)
ORDER BY date DESC;
```

### Top Selling Medicines
```sql
SELECT 
  m.id,
  m.name,
  m.generic_name,
  COUNT(oi.id) AS times_ordered,
  SUM(oi.quantity) AS total_quantity_sold,
  SUM(oi.total_price) AS total_revenue
FROM public.medicines m
JOIN public.order_items oi ON m.id = oi.medicine_id
JOIN public.orders o ON oi.order_id = o.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
  AND o.status NOT IN ('cancelled', 'returned')
GROUP BY m.id, m.name, m.generic_name
ORDER BY total_quantity_sold DESC
LIMIT 10;
```

### Customer Order Frequency
```sql
SELECT 
  up.first_name || ' ' || up.last_name AS customer_name,
  COUNT(o.id) AS total_orders,
  SUM(o.total_amount) AS total_spent,
  AVG(o.total_amount) AS avg_order_value,
  MAX(o.order_date) AS last_order_date,
  EXTRACT(DAY FROM NOW() - MAX(o.order_date)) AS days_since_last_order
FROM public.user_profiles up
JOIN public.orders o ON up.id = o.customer_id
WHERE o.status NOT IN ('cancelled')
GROUP BY up.id, up.first_name, up.last_name
HAVING COUNT(o.id) > 1
ORDER BY total_spent DESC;
```

### Refill Prediction Accuracy
```sql
SELECT 
  DATE_TRUNC('week', created_at) AS week,
  COUNT(*) AS total_predictions,
  SUM(CASE WHEN converted_to_order THEN 1 ELSE 0 END) AS conversions,
  ROUND(
    100.0 * SUM(CASE WHEN converted_to_order THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) AS conversion_rate,
  AVG(confidence_score) AS avg_confidence
FROM public.refill_predictions
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;
```

---

## Advanced Queries

### Customer Lifetime Value (CLV)
```sql
WITH customer_metrics AS (
  SELECT 
    customer_id,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_spent,
    MIN(order_date) AS first_order,
    MAX(order_date) AS last_order,
    EXTRACT(DAY FROM MAX(order_date) - MIN(order_date)) AS customer_age_days
  FROM public.orders
  WHERE status IN ('delivered', 'shipped')
  GROUP BY customer_id
)
SELECT 
  up.first_name || ' ' || up.last_name AS customer_name,
  cm.total_orders,
  cm.total_spent,
  cm.customer_age_days,
  CASE 
    WHEN cm.customer_age_days > 0 
    THEN ROUND((cm.total_spent / cm.customer_age_days * 365)::numeric, 2)
    ELSE cm.total_spent
  END AS projected_annual_value
FROM customer_metrics cm
JOIN public.user_profiles up ON cm.customer_id = up.id
ORDER BY projected_annual_value DESC
LIMIT 20;
```

### Cohort Analysis
```sql
WITH cohorts AS (
  SELECT 
    customer_id,
    DATE_TRUNC('month', MIN(order_date)) AS cohort_month,
    MIN(order_date) AS first_order
  FROM public.orders
  GROUP BY customer_id
),
cohort_orders AS (
  SELECT 
    c.cohort_month,
    DATE_TRUNC('month', o.order_date) AS order_month,
    EXTRACT(MONTH FROM AGE(o.order_date, c.first_order)) AS months_since_first,
    COUNT(DISTINCT o.customer_id) AS customers
  FROM cohorts c
  JOIN public.orders o ON c.customer_id = o.customer_id
  GROUP BY c.cohort_month, DATE_TRUNC('month', o.order_date), EXTRACT(MONTH FROM AGE(o.order_date, c.first_order))
)
SELECT 
  cohort_month,
  months_since_first,
  customers,
  ROUND(
    100.0 * customers / FIRST_VALUE(customers) OVER (
      PARTITION BY cohort_month 
      ORDER BY months_since_first
    ),
    2
  ) AS retention_rate
FROM cohort_orders
ORDER BY cohort_month DESC, months_since_first;
```

---

## Performance Tips

1. **Use indexes**: All foreign keys and frequently queried columns are indexed
2. **Use views**: Pre-defined views like `order_summary` are optimized
3. **Limit results**: Always use `LIMIT` for large result sets
4. **Use pagination**: Implement cursor-based pagination for better performance
5. **Batch operations**: Use array operations or CTEs for bulk updates
6. **Monitor queries**: Use `EXPLAIN ANALYZE` to check query plans

## Security Best Practices

1. **Always use RLS**: Never disable Row Level Security in production
2. **Use auth.uid()**: Reference current user with `auth.uid()` in policies
3. **Service role carefully**: Only use service role key in trusted backend
4. **Validate inputs**: Always validate and sanitize user inputs
5. **Audit logs**: Regularly review `ai_logs` and `inventory_transactions`

---

For more examples, see the README.md and official documentation.
