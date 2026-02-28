# Prescription Review & Order Creation

A complete prescription review and order confirmation system for the AI Pharmacist app.

## 🎯 Features

✅ **Responsive Design** - Works on mobile, tablet, and desktop  
✅ **Image Preview** - Display uploaded prescription image  
✅ **Editable Medicines** - Edit medicine names, dosages, and quantities  
✅ **Real-time Totals** - Calculate order total automatically  
✅ **Order Creation** - Save to Supabase orders table  
✅ **Success Confirmation** - Show success message and redirect  
✅ **Error Handling** - Comprehensive error messages  
✅ **Tailwind CSS** - Beautiful, consistent styling  

---

## 📁 File Structure

```
frontend/
├── app/
│   └── prescription/
│       ├── review/
│       │   └── page.tsx          # Main review page (with auth)
│       └── demo/
│           └── page.tsx          # Demo page (sample data)
├── components/
│   └── prescription/
│       ├── PrescriptionReview.tsx   # Main component
│       └── PrescriptionUpload.tsx   # Upload component
└── ...

database/
└── prescription_order_migration.sql  # Database migration
```

---

## 🚀 Setup

### 1. Run Database Migration

In Supabase SQL Editor, run:
```sql
-- Copy contents from database/prescription_order_migration.sql
```

This adds:
- `order_id` column to `prescription_scans` table
- `medicine_name` and `dosage` columns to `order_items` table
- Necessary constraints and indexes

### 2. Install Dependencies

All required packages are already included:
- `@supabase/supabase-js`
- `next`
- `lucide-react`
- `tailwindcss`

---

## 📖 Usage

### Option 1: Real Prescription Review (With Auth)

```typescript
// After uploading prescription, redirect to review page
router.push(/prescription/review?id=${prescriptionId});
```

**URL**: `/prescription/review?id=<prescription-id>`

**Requires**:
- User must be logged in
- Prescription must exist in database
- Prescription must belong to current user

---

### Option 2: Demo Mode (For Testing)

**URL**: `/prescription/demo`

Uses sample prescription data - no auth required.

---

### Option 3: Use Component Directly

```tsx
import PrescriptionReview from '@/components/prescription/PrescriptionReview';

function MyPage() {
  const medicines = [
    {
      id: '1',
      name: 'Paracetamol',
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: '5 days',
      quantity: 10,
      price: 5.0,
    },
  ];

  return (
    <PrescriptionReview
      prescriptionId="prescription-123"
      imageUrl="https://example.com/prescription.jpg"
      extractedMedicines={medicines}
      userId="user-id-here"
    />
  );
}
```

---

## 🎨 Features in Detail

### 1. **Image Display**
- Shows uploaded prescription image
- Responsive aspect ratio (3:4)
- Image zoom/fit to container
- Fallback for missing images

### 2. **Medicine Editing**
- **View Mode**: Display medicine info with Edit button
- **Edit Mode**: Inline form to modify details
- Fields: Name, Dosage, Quantity
- Save/Remove buttons per medicine

### 3. **Order Summary**
- Total items count
- Total quantity
- Total amount (₹)
- Real-time calculation

### 4. **Confirm Order**
Creates:
1. Order in `orders` table
2. Order items in `order_items` table  
3. Updates prescription status to 'processed'

### 5. **Success Flow**
- Shows success message with checkmark
- Displays order confirmation
- Auto-redirects to order details page

---

## 🗄️ Database Schema

### prescription_scans
```sql
- id (UUID)
- user_id (UUID)
- image_url (TEXT)
- extracted_medicines (JSONB)
- order_id (UUID) -- NEW
- status (TEXT)
- created_at (TIMESTAMP)
```

### orders
```sql
- id (UUID)
- order_number (VARCHAR)
- customer_id (UUID)
- status (VARCHAR) -- 'pending', 'confirmed', 'delivered'
- total_amount (DECIMAL)
- payment_status (VARCHAR)
- created_at (TIMESTAMP)
```

### order_items
```sql
- id (UUID)
- order_id (UUID)
- medicine_id (UUID) -- nullable
- medicine_name (TEXT) -- NEW
- dosage (TEXT) -- NEW
- quantity (INTEGER)
- unit_price (DECIMAL)
- total_price (DECIMAL)
- created_at (TIMESTAMP)
```

---

## 📊 Data Flow

```
1. User uploads prescription
   ↓
2. OCR extracts medicines
   ↓
3. Data saved to prescription_scans
   ↓
4. User redirected to /prescription/review?id=<id>
   ↓
5. User edits medicines if needed
   ↓
6. User clicks "Confirm Order"
   ↓
7. Creates order + order_items in database
   ↓
8. Updates prescription status to 'processed'
   ↓
9. Shows success message
   ↓
10. Redirects to /dashboard/orders/<order-id>
```

---

## 🎯 Component Props

### PrescriptionReview

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `prescriptionId` | string | Yes | Prescription ID from database |
| `imageUrl` | string | Yes | URL of prescription image |
| `extractedMedicines` | Medicine[] | Yes | Array of extracted medicines |
| `userId` | string | Yes | Current user ID |

### Medicine Interface

```typescript
interface Medicine {
  id?: string;          // Optional: medicine ID from database
  name: string;         // Medicine name
  dosage: string;       // e.g., "500mg", "10ml"
  frequency?: string;   // e.g., "Twice daily"
  duration?: string;    // e.g., "5 days"
  quantity: number;     // Number of units
  price: number;        // Unit price
  editing?: boolean;    // Internal state
}
```

---

## 🎨 Responsive Breakpoints

- **Mobile** (< 768px): Single column layout
- **Tablet** (768px - 1024px): Single column with larger spacing
- **Desktop** (> 1024px): Two-column grid (image | medicines)

---

## 🔒 Security

- ✅ User authentication required
- ✅ Row Level Security (RLS) on Supabase
- ✅ User can only access their own prescriptions
- ✅ Validates prescription ownership before displaying

---

## 🧪 Testing

### Demo Page
Visit: `http://localhost:3000/prescription/demo`

### Real Flow
1. Upload prescription via OCR
2. Get prescription ID from response
3. Navigate to `/prescription/review?id=<prescription-id>`
4. Edit medicines
5. Click "Confirm Order"
6. Verify order created in Supabase

---

## 🐛 Troubleshooting

**Issue**: Prescription not loading
- Check if user is logged in
- Verify prescription ID exists in database
- Check browser console for errors

**Issue**: Image not displaying
- Verify `image_url` is publicly accessible
- Check Supabase storage bucket permissions
- Ensure image URL is valid

**Issue**: Order creation fails
- Check database migration was run
- Verify user has permission to create orders
- Check Supabase RLS policies

**Issue**: Redirect not working
- Check if order ID is returned from database
- Verify `/dashboard/orders/[id]` route exists
- Check Next.js router configuration

---

## 📝 Example Medicine Data

```json
[
  {
    "name": "Paracetamol",
    "dosage": "500mg",
    "frequency": "Twice daily",
    "duration": "5 days",
    "quantity": 10,
    "price": 5.0
  },
  {
    "name": "Amoxicillin",
    "dosage": "250mg",
    "frequency": "Three times daily",
    "duration": "7 days",
    "quantity": 21,
    "price": 8.0
  }
]
```

---

## 🚀 Future Enhancements

- [ ] Add medicine search/autocomplete
- [ ] Verify medicine availability in stock
- [ ] Calculate medicine prices from database
- [ ] Support multiple prescriptions
- [ ] Add medicine interaction warnings
- [ ] Export order as PDF
- [ ] Send email confirmation
- [ ] Add payment integration

---

## 📚 Related Files

- `frontend/components/prescription/PrescriptionUpload.tsx` - Upload component
- `frontend/hooks/usePrescriptionUpload.ts` - Upload hook
- `frontend/app/api/prescription/upload/route.ts` - Upload API
- `database/prescription_scans.sql` - Database schema

---

**Created**: February 28, 2026  
**Status**: ✅ Production Ready
