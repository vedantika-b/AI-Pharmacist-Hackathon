# Prescription Processing API - Setup Guide

## 🚀 Features

✅ **Image Upload** - JPG/PNG support with validation  
✅ **Google Vision OCR** - High-accuracy text extraction  
✅ **OpenAI GPT Processing** - Smart medicine name & dosage extraction  
✅ **Supabase Storage** - Secure image and data storage  
✅ **Confidence Scoring** - Automatic quality checks  
✅ **Production Ready** - Error handling, validation, type safety  

---

## 📋 Prerequisites

1. **Google Cloud Vision API**
   - Create project at https://console.cloud.google.com
   - Enable Vision API
   - Create service account and download credentials JSON

2. **OpenAI API**
   - Get API key from https://platform.openai.com

3. **Supabase**
   - Run the SQL migration in `database/prescription_scans.sql`
   - Create storage bucket for prescription images

---

## 🔧 Installation

### 1. Install Package Dependencies

```bash
cd frontend
npm install @google-cloud/vision openai
```

### 2. Environment Variables

Add to `.env.local`:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-...your_openai_api_key

# Google Vision API
GOOGLE_VISION_CREDENTIALS={"type":"service_account","project_id":"..."}
```

**For Google Vision Credentials:**
- Download service account JSON file
- Minify it to single line
- Paste entire JSON as environment variable value

### 3. Run Database Migration

In Supabase SQL Editor:
```sql
-- Copy contents from database/prescription_scans.sql and run
```

---

## 📖 Usage

### In a Next.js Page/Component

```tsx
import PrescriptionUpload from '@/components/prescription/PrescriptionUpload';

export default function UploadPage() {
  return <PrescriptionUpload />;
}
```

### Using the Hook Directly

```tsx
import { usePrescriptionUpload } from '@/hooks/usePrescriptionUpload';

function MyComponent() {
  const { upload, uploading, result, error } = usePrescriptionUpload();

  const handleUpload = async (file: File) => {
    const result = await upload(file, currentUser.id);
    
    if (result.success) {
      console.log('Medicines:', result.medicines);
      console.log('Confidence:', result.confidence);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => handleUpload(e.target.files[0])} 
      />
      {uploading && <p>Processing...</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

### Direct API Call

```typescript
const formData = new FormData();
formData.append('image', file);
formData.append('userId', userId);

const response = await fetch('/api/prescription/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

---

## 📊 API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "medicines": [
      {
        "name": "Paracetamol",
        "dosage": "500mg twice daily"
      },
      {
        "name": "Amoxicillin",
        "dosage": "250mg three times daily"
      }
    ],
    "confidence": 85,
    "prescriptionId": "uuid-here",
    "rawText": "..." // Only in development
  }
}
```

### Low Confidence Warning

```json
{
  "success": true,
  "warning": "Low OCR confidence. Please review manually.",
  "data": {
    "medicines": [],
    "confidence": 45,
    "prescriptionId": "uuid-here",
    "rawText": "partially extracted text..."
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Invalid file type. Only JPG and PNG allowed."
}
```

---

## 🗄️ Database Schema

```sql
prescription_scans (
  id                  UUID PRIMARY KEY,
  user_id             UUID REFERENCES auth.users,
  image_url           TEXT,
  raw_ocr_text        TEXT,
  confidence_score    INTEGER (0-100),
  extracted_medicines JSONB,
  status              VARCHAR(20),
  processed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ
)
```

Extracted medicines JSONB format:
```json
[
  { "name": "Medicine Name", "dosage": "dosage info" }
]
```

---

## 🔒 Security Features

- ✅ File type validation (JPG/PNG only)
- ✅ File size limit (10MB max)
- ✅ Row Level Security (RLS) on database
- ✅ User-specific storage folders
- ✅ Authenticated uploads only
- ✅ Service role for backend operations

---

## 🎯 Confidence Threshold

- **≥ 60%**: Automatically processed
- **< 60%**: Marked as "needs_review", empty medicines array returned

---

## 🧪 Testing

### Test API Endpoint
```bash
curl http://localhost:3000/api/prescription/upload
```

Expected response:
```json
{
  "message": "Prescription Upload API",
  "version": "1.0.0",
  "endpoints": {
    "POST": "/api/prescription/upload"
  }
}
```

### Test Upload
```bash
curl -X POST http://localhost:3000/api/prescription/upload \
  -F "image=@prescription.jpg" \
  -F "userId=user-uuid-here"
```

---

## 📝 File Structure

```
frontend/
├── app/
│   └── api/
│       └── prescription/
│           └── upload/
│               └── route.ts           # Main API route
├── components/
│   └── prescription/
│       └── PrescriptionUpload.tsx     # Upload component
├── hooks/
│   └── usePrescriptionUpload.ts       # React hook
└── .env.local                         # Environment variables

database/
└── prescription_scans.sql             # Database migration
```

---

## 🐛 Troubleshooting

**Error: "Failed to extract text from image"**
- Check Google Vision API credentials
- Verify API is enabled in Google Cloud Console
- Check service account permissions

**Error: "Failed to extract medicines with AI"**
- Verify OpenAI API key is valid
- Check API quota/limits
- Ensure GPT-4 access (or change to GPT-3.5-turbo)

**Error: "Failed to store prescription data"**
- Run database migration SQL
- Check Supabase connection
- Verify RLS policies are enabled

**Low confidence scores**
- Ensure image is clear and well-lit
- Check image resolution (higher is better)
- Avoid blurry or rotated images

---

## 💰 Cost Estimates (per 1000 uploads)

- **Google Vision API**: ~$1.50 (first 1000/month free)
- **OpenAI GPT-4**: ~$0.30 (varies by token usage)
- **Supabase Storage**: Free tier includes 1GB

**Total**: ~$1.80 per 1000 prescriptions (after free tier)

---

## 🚀 Production Checklist

- [ ] Set up Google Cloud Vision API
- [ ] Get OpenAI API key
- [ ] Run Supabase migration
- [ ] Configure environment variables
- [ ] Test file upload flow
- [ ] Set up error monitoring (Sentry)
- [ ] Configure rate limiting
- [ ] Add usage analytics
- [ ] Set up automated backups

---

## 📚 Additional Resources

- [Google Vision API Docs](https://cloud.google.com/vision/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)

---

**Created**: February 28, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
