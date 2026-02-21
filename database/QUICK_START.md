# 📊 Supabase Schema Files - Quick Guide

## ✨ Recommended Setup (Start Here!)

### Step 1: Copy Schema
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** → **New Query**
3. Copy contents from `supabase_schema.sql`
4. Click **Run** or press Ctrl+Enter

### Step 2: Add Helper Functions (Optional but Recommended)
1. Create another new query
2. Copy contents from `helper_functions.sql`
3. Run it

### Step 3: Test
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- View sample data
SELECT * FROM roles;
SELECT name, price, stock_quantity FROM medicines;
```

---

## 📁 File Guide

### 🟢 Primary Files (Use These)

#### `supabase_schema.sql` ⭐ **MAIN FILE**
**Size:** ~800 lines  
**Purpose:** Complete production-ready schema  
**Contains:**
- 8 tables (roles, user_profiles, medicines, orders, etc.)
- 20+ indexes for performance
- RLS policies for security
- Auto-triggers (order numbers, user profiles)
- Sample seed data (4 roles, 10 medicines)
- Realtime enabled

**Run Time:** ~2 seconds  
**Use When:** Setting up new Supabase project

---

#### `helper_functions.sql` 🔧
**Size:** ~300 lines  
**Purpose:** Dashboard statistics & utilities  
**Contains:**
- 12 utility functions
- 7 analytics views
- 2 materialized views
- Scheduled cleanup functions

**Run After:** supabase_schema.sql  
**Use When:** Need dashboard stats API

---

#### `minimal_schema.sql` ⚡
**Size:** ~150 lines  
**Purpose:** Simplified quick-start version  
**Contains:**
- Essential tables only
- Basic RLS policies
- Minimal seed data

**Run Time:** <1 second  
**Use When:** Quick testing or learning

---

### 📚 Reference Files

#### `schema.sql`
Legacy comprehensive schema with detailed comments (1162 lines)  
Use for reference or advanced features

#### `rls_policies.sql`
Standalone RLS policies (extracted from main schema)

#### `SETUP_GUIDE.md` 📖
Complete setup instructions with troubleshooting

---

## 🎯 What Each Schema Includes

| Feature | supabase_schema.sql | minimal_schema.sql | schema.sql |
|---------|-------------------|-------------------|-----------|
| Core tables | ✅ 8 | ✅ 7 | ✅ 9 |
| RLS Policies | ✅ Complete | ✅ Basic | ✅ Advanced |
| Indexes | ✅ 20+ | ✅ 3 | ✅ 50+ |
| Triggers | ✅ 3 | ✅ 1 | ✅ 5 |
| Views | ✅ 2 | ❌ | ✅ 4 |
| Sample data | ✅ Yes | ✅ Minimal | ✅ Yes |
| Comments | ✅ Medium | ✅ Minimal | ✅ Extensive |
| File size | ~800 lines | ~150 lines | ~1162 lines |

---

## 🚀 Common Scenarios

### Scenario 1: Brand New Project
```bash
1. Run: supabase_schema.sql
2. Run: helper_functions.sql
3. Done! Start building your app
```

### Scenario 2: Quick Testing
```bash
1. Run: minimal_schema.sql
2. Test your API
3. Upgrade to full schema when ready
```

### Scenario 3: Need Dashboard Stats
```bash
1. Have supabase_schema.sql running
2. Run: helper_functions.sql
3. Use functions in your backend:
   - get_active_orders_count()
   - get_revenue()
   - get_low_stock_count()
```

### Scenario 4: Reference/Learning
```bash
1. Read: schema.sql (comprehensive with all features)
2. Read: SETUP_GUIDE.md (step-by-step help)
```

---

## 🔑 Key Functions (After Running helper_functions.sql)

### Dashboard Stats
```sql
-- Get all dashboard stats at once
SELECT 
    public.get_active_orders_count() AS active_orders,
    public.get_total_customers_count() AS total_customers,
    public.get_low_stock_count() AS low_stock,
    public.get_revenue(30) AS monthly_revenue;
```

### Analytics
```sql
-- Top selling medicines
SELECT * FROM public.top_selling_medicines;

-- Customer lifetime value
SELECT * FROM public.customer_lifetime_value LIMIT 10;

-- Order trend
SELECT * FROM public.get_order_trend();
```

---

## 📋 Tables Created

| Table | Records What | Used By |
|-------|-------------|---------|
| roles | User roles (admin, pharmacist, customer) | Auth system |
| user_profiles | User details, phone, avatar | All pages |
| medicines | Product catalog, inventory | Products API |
| orders | Customer orders | Orders API |
| order_items | Items in each order | Order details |
| refill_predictions | ML predictions | Alerts page |
| ai_logs | AI operations, chat logs | Chat API |
| inventory_transactions | Stock changes | Inventory audit |

---

## ⚠️ Before Running

### Check Your Environment
```env
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend (.env)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
```

### Supabase Project Requirements
- ✅ Project created at supabase.com
- ✅ Database active (not paused)
- ✅ Using PostgreSQL 15+

---

## 🐛 Troubleshooting

### Error: "already exists"
**Solution:** Tables already created. To reset:
```sql
-- WARNING: Deletes all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then run schema again
```

### Error: "permission denied"
**Solution:** Use service role key, not anon key

### RLS blocking queries?
**Solution:** Make sure user is authenticated:
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

---

## 📞 Need Help?

1. Check `SETUP_GUIDE.md` for detailed instructions
2. Review Supabase logs: Dashboard → Database → Logs
3. Test RLS policies: Dashboard → Database → Policies

---

## 🎓 Learning Path

**Beginner:**
1. Start with `minimal_schema.sql`
2. Read `SETUP_GUIDE.md`
3. Test simple queries

**Intermediate:**
1. Use `supabase_schema.sql`
2. Add `helper_functions.sql`
3. Connect your backend

**Advanced:**
1. Study `schema.sql` for all features
2. Customize RLS policies
3. Add custom triggers/functions

---

## 📊 Schema Comparison

**Choose `supabase_schema.sql` if:**
- ✅ Building production app
- ✅ Need complete features
- ✅ Want best practices

**Choose `minimal_schema.sql` if:**
- ✅ Just learning/testing
- ✅ Want simplicity
- ✅ Plan to customize heavily

**Use `schema.sql` if:**
- ✅ Need all advanced features
- ✅ Want comprehensive comments
- ✅ Studying PostgreSQL/Supabase

---

**Last Updated:** 2026-02-21  
**Version:** 1.0  
**Tested On:** Supabase PostgreSQL 15.x
