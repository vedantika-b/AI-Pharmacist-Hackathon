# Supabase Database Setup Guide

## Quick Setup

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Schema
1. Open the file: `database/supabase_schema.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Installation
The script will create:
- ✅ 8 Tables (roles, user_profiles, medicines, orders, order_items, refill_predictions, ai_logs, inventory_transactions)
- ✅ 20+ Indexes for performance
- ✅ RLS Policies for security
- ✅ 3 Triggers (auto-update timestamps, order numbers, user profiles)
- ✅ 2 Views (low_stock_medicines, upcoming_refills)
- ✅ Sample data (4 roles, 10 medicines)

### Step 4: Test Authentication Flow
1. Sign up a new user via your frontend
2. The trigger will automatically create a user profile with 'customer' role
3. Check in Supabase Dashboard > Authentication > Users

## Tables Overview

| Table | Purpose | Key Features |
|-------|---------|-------------|
| `roles` | User roles (admin, pharmacist, staff, customer) | RBAC permissions |
| `user_profiles` | Extended user data | Links to auth.users |
| `medicines` | Product catalog | Stock tracking, pricing |
| `orders` | Customer orders | Status tracking, payment |
| `order_items` | Order line items | Links orders to medicines |
| `refill_predictions` | ML predictions | AI-powered forecasting |
| `ai_logs` | AI operation logs | Chat, recommendations |
| `inventory_transactions` | Stock changes | Complete audit trail |

## Row Level Security (RLS)

All tables have RLS enabled with these rules:

### Customers can:
- ✅ View their own orders and predictions
- ✅ Create orders for themselves
- ✅ View active medicines
- ✅ Update their own profile
- ✅ Insert AI logs

### All authenticated users can:
- ✅ View roles
- ✅ View all user profiles
- ✅ View active medicines
- ✅ View inventory transactions

## Testing Your Setup

### Test 1: Check Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Test 2: Check Sample Data
```sql
-- View roles
SELECT * FROM public.roles;

-- View medicines
SELECT name, stock_quantity, price FROM public.medicines;
```

### Test 3: Check RLS Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## API Integration

Your backend should now work with these endpoints:

### Products
- `GET /api/v1/products` - List medicines
- `GET /api/v1/products/{id}` - Get medicine details

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - List user orders

### Predictions
- `GET /api/v1/predictions/refills` - Get refill predictions

### Chat
- `POST /api/v1/chat` - AI chat (logs to ai_logs table)

### Dashboard
- `GET /api/v1/dashboard/stats` - Statistics
- `GET /api/v1/dashboard/recent-orders` - Recent orders
- `GET /api/v1/dashboard/insights` - AI insights

## Troubleshooting

### Issue: "permission denied for table X"
**Solution:** RLS is enabled. Make sure:
1. User is authenticated via Supabase Auth
2. JWT token is included in requests
3. User has proper role assigned

### Issue: "relation X does not exist"
**Solution:** Run the schema script again. Check for errors in SQL editor.

### Issue: User profile not created on signup
**Solution:** 
1. Check if 'customer' role exists: `SELECT * FROM roles WHERE name = 'customer';`
2. Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`

### Issue: Order number not auto-generated
**Solution:** Check trigger: `SELECT * FROM pg_trigger WHERE tgname = 'generate_order_number_trigger';`

## Storage Buckets (Optional)

If you need file uploads, create these buckets in Supabase Storage:

1. **prescriptions** (Private)
   - For prescription image uploads
   - RLS: Only owner can access

2. **medicine-images** (Public)
   - For product photos
   - Public read access

3. **avatars** (Public)
   - For user profile pictures
   - Public read access

### Create via SQL:
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('prescriptions', 'prescriptions', false),
  ('medicine-images', 'medicine-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;
```

## Realtime Subscriptions

These tables have realtime enabled:
- `orders` - Listen for order status changes
- `refill_predictions` - Get live prediction updates
- `medicines` - Monitor stock changes

### Example (Frontend):
```typescript
import { supabase } from '@/lib/supabase'

// Subscribe to order updates
supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Order changed:', payload)
    }
  )
  .subscribe()
```

## Backup Your Data

### Export all tables:
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or use pg_dump
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
```

## Production Checklist

Before going live:

- [ ] All sample data replaced with real data
- [ ] RLS policies tested with different user roles
- [ ] Indexes verified for query performance
- [ ] Backup strategy implemented
- [ ] Environment variables secured
- [ ] API rate limiting configured
- [ ] Monitoring/alerts set up (Supabase Dashboard)

## Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Need Help?**
Check the console output after running the schema. It shows:
- Number of tables created
- Indexes created
- Policies active
- Sample data loaded

If you see any errors, check the Supabase logs in Dashboard > Database > Logs.
