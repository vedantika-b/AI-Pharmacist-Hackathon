# AI Pharmacist Database Schema

## Overview

This is a production-ready PostgreSQL schema designed for Supabase, optimized for an AI-powered pharmacy management system.

## Features

✅ **9 Core Tables** with complete relationships
✅ **50+ Performance Indexes** for optimized queries
✅ **30+ Row Level Security (RLS) Policies** for data protection
✅ **5 Automated Triggers** for data integrity
✅ **4 Utility Views** for common queries
✅ **6 Helper Functions** for business logic
✅ **Full Audit Trail** with created_at/updated_at timestamps
✅ **Realtime Subscriptions** enabled for key tables

## Tables

### 1. `roles`
Manages user roles and permissions (RBAC system)
- Default roles: admin, pharmacist, staff, customer
- JSONB permissions for flexible access control

### 2. `user_profiles`
Extended user information (links to Supabase `auth.users`)
- Personal information, contact details
- Role assignment
- License numbers for pharmacists

### 3. `medicines`
Complete medicine inventory
- Product details, pricing, stock levels
- Regulatory information (prescription required, controlled substance)
- Full-text search capability
- Automatic search vector updates

### 4. `orders`
Customer orders with full lifecycle tracking
- Status workflow: pending → confirmed → processing → delivered
- Payment tracking
- Prescription verification
- Delivery management

### 5. `order_items`
Individual items within orders
- Quantity, pricing, discounts
- Dosage instructions
- Historical product information

### 6. `refill_predictions`
AI-powered medication refill predictions
- Confidence scoring
- Model versioning
- Notification tracking
- Conversion analytics

### 7. `ai_logs`
Comprehensive AI operation logging
- Token usage tracking
- Performance metrics
- Error logging
- Cost tracking

### 8. `inventory_transactions`
Complete audit trail of inventory changes
- All stock movements logged
- Reference tracking (order linkage)
- Performed by user tracking

### 9. `prescription_uploads`
Prescription document management
- File storage references
- Verification workflow
- OCR/AI extraction data

## Setup Instructions

### Option 1: Supabase Dashboard

1. Open your Supabase project
2. Go to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `schema.sql`
5. Click **Run** to execute

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Option 3: psql Command Line

```bash
psql postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres -f schema.sql
```

## Post-Setup Tasks

### 1. Create Storage Buckets

In Supabase Dashboard → Storage:

```sql
-- Prescriptions (private bucket)
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false);

-- Medicine images (public bucket)
INSERT INTO storage.buckets (id, name, public) VALUES ('medicine-images', 'medicine-images', true);

-- User avatars (public bucket)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
```

### 2. Configure Storage Policies

```sql
-- Allow users to upload their own prescriptions
CREATE POLICY "Users can upload own prescriptions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own prescriptions
CREATE POLICY "Users can view own prescriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow staff to view all prescriptions
CREATE POLICY "Staff can view all prescriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = auth.uid() AND r.name IN ('admin', 'pharmacist', 'staff')
  )
);
```

### 3. Set Up Auth Trigger

Create a trigger to automatically create user profiles when users sign up:

```sql
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  customer_role_id UUID;
BEGIN
  -- Get customer role ID
  SELECT id INTO customer_role_id FROM public.roles WHERE name = 'customer';
  
  -- Insert user profile
  INSERT INTO public.user_profiles (id, role_id, first_name, last_name)
  VALUES (
    NEW.id,
    customer_role_id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Usage Examples

### Query Examples

#### Get Low Stock Medicines
```sql
SELECT * FROM public.low_stock_medicines;
```

#### Get Upcoming Refills
```sql
SELECT * FROM public.upcoming_refills;
```

#### Search Medicines
```sql
SELECT name, generic_name, price, stock_quantity
FROM public.medicines
WHERE search_vector @@ to_tsquery('english', 'ibuprofen | pain')
  AND is_active = true
ORDER BY ts_rank(search_vector, to_tsquery('english', 'ibuprofen | pain')) DESC;
```

#### Get Order Summary
```sql
SELECT * FROM public.order_summary 
WHERE status = 'pending'
ORDER BY order_date DESC;
```

#### Daily AI Usage Statistics
```sql
SELECT * FROM public.daily_ai_usage_stats 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

### Function Usage

#### Check Medicine Stock
```sql
SELECT public.check_medicine_stock(
  'medicine-uuid-here'::UUID,
  10
);
```

#### Get User Role
```sql
SELECT public.get_user_role(auth.uid());
```

#### Calculate Order Total
```sql
SELECT public.calculate_order_total('order-uuid-here'::UUID);
```

## Integration with Backend

### Python (Supabase Client)

```python
from supabase import create_client, Client

# Initialize client
supabase: Client = create_client(supabase_url, supabase_key)

# Query medicines
medicines = supabase.table('medicines')\
    .select('*')\
    .eq('is_active', True)\
    .gte('stock_quantity', 0)\
    .execute()

# Create order
order = supabase.table('orders').insert({
    'customer_id': user_id,
    'status': 'pending',
    'subtotal': 100.00,
    'total_amount': 110.00
}).execute()

# Get refill predictions
predictions = supabase.table('refill_predictions')\
    .select('*, medicines(*), user_profiles(*)')\
    .eq('customer_id', user_id)\
    .eq('is_active', True)\
    .order('predicted_refill_date')\
    .execute()
```

### TypeScript (Supabase Client)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseKey)

// Query medicines with type safety
const { data: medicines, error } = await supabase
  .from('medicines')
  .select('*')
  .eq('is_active', true)
  .gte('stock_quantity', 0)

// Create order
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    customer_id: userId,
    status: 'pending',
    subtotal: 100.00,
    total_amount: 110.00
  })

// Subscribe to order updates (Realtime)
const orderSubscription = supabase
  .channel('orders')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `customer_id=eq.${userId}`
  }, (payload) => {
    console.log('Order updated:', payload)
  })
  .subscribe()
```

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled with granular policies:

- **Users**: Can only view/edit their own data
- **Orders**: Customers see own orders, staff see all
- **Medicines**: All can view active, only staff can modify
- **AI Logs**: Users see own logs, admins see all
- **Refill Predictions**: Users see own predictions, staff see all

### Best Practices

1. **Never disable RLS** in production
2. **Use service role key** only in trusted backend code
3. **Use anon/authenticated keys** in frontend
4. **Validate all user inputs** in application layer
5. **Audit logs regularly** using ai_logs table
6. **Rotate API keys** periodically

## Maintenance

### Regular Tasks

1. **Monitor low stock**: Check `low_stock_medicines` view daily
2. **Review failed AI requests**: Query ai_logs WHERE success = false
3. **Analyze order patterns**: Use order_summary view for insights
4. **Update refill predictions**: Run ML model weekly
5. **Archive old logs**: Consider partitioning ai_logs by date

### Performance Tuning

```sql
-- Analyze table statistics
ANALYZE public.medicines;
ANALYZE public.orders;
ANALYZE public.ai_logs;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Vacuum tables
VACUUM ANALYZE public.medicines;
VACUUM ANALYZE public.orders;
```

## Backup and Recovery

### Supabase Automatic Backups

Supabase automatically backs up your database:
- **Paid plans**: Daily backups retained for 7-30 days
- **Pro plan**: Point-in-time recovery available

### Manual Backup

```bash
# Backup entire database
pg_dump postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres > backup.sql

# Backup specific tables
pg_dump -t public.medicines -t public.orders postgresql://... > partial_backup.sql

# Restore from backup
psql postgresql://... < backup.sql
```

## Monitoring

### Key Metrics to Track

1. **Order Volume**: Daily order count and revenue
2. **Stock Levels**: Low stock alerts and reorder rates
3. **AI Performance**: Token usage, execution time, success rate
4. **Prediction Accuracy**: Refill prediction conversion rate
5. **User Activity**: Active users, login frequency

### Sample Monitoring Queries

```sql
-- Today's order statistics
SELECT 
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM public.orders
WHERE order_date::date = CURRENT_DATE;

-- AI performance last 24 hours
SELECT 
  action_type,
  COUNT(*) as requests,
  ROUND(AVG(execution_time_ms), 2) as avg_time_ms,
  SUM(total_tokens) as tokens_used,
  ROUND(SUM(CASE WHEN success THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as success_rate
FROM public.ai_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action_type;

-- Inventory health check
SELECT 
  COUNT(*) as total_medicines,
  SUM(CASE WHEN stock_quantity <= min_stock_level THEN 1 ELSE 0 END) as low_stock_count,
  SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
FROM public.medicines
WHERE is_active = true;
```

## Troubleshooting

### Common Issues

**Issue**: RLS policies blocking legitimate queries
- **Solution**: Check user role and policy conditions
- **Debug**: `SELECT public.get_user_role(auth.uid());`

**Issue**: Slow queries on large tables
- **Solution**: Verify indexes are being used
- **Debug**: Use `EXPLAIN ANALYZE` on slow queries

**Issue**: Order totals not matching
- **Solution**: Recalculate using function
- **Debug**: `SELECT public.calculate_order_total(order_id);`

## Contributing

When modifying the schema:

1. Create a new migration file
2. Test in development first
3. Update this README
4. Document breaking changes
5. Update TypeScript types if applicable

## License

This schema is part of the AI Pharmacist Hackathon project.

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review RLS policies: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL docs: https://www.postgresql.org/docs/

---

**Last Updated**: February 2026
**Schema Version**: 1.0
**PostgreSQL Version**: 15+
**Supabase Compatible**: Yes
