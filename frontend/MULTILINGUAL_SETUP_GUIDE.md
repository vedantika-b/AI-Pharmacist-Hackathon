# Multilingual Setup Guide - Complete Implementation

## ✅ Current Status

Your frontend now supports **16 languages** with proper configuration:

### Supported Languages & Locale Codes

| Language | ISO 639 Code | Native Name | Status |
|----------|--------------|-------------|--------|
| English | `en` | English | ✅ Complete |
| Hindi | `hi` | हिंदी | ✅ Complete |
| **Urdu** | `ur` | اردو | ✅ Complete (RTL) |
| **Bengali** | `bn` | বাংলা | ✅ Complete |
| **Tamil** | `ta` | தமிழ் | ✅ Complete |
| Telugu | `te` | తెలుగు | ✅ Complete |
| Marathi | `mr` | मराठी | ✅ Complete |
| Gujarati | `gu` | ગુજરાતી | ✅ Complete |
| Punjabi | `pa` | ਪੰਜਾਬੀ | ✅ Complete |
| **Kannada** | `kn` | ಕನ್ನಡ | ⚠️ Needs translation object |
| **Malayalam** | `ml` | മലയാളം | ⚠️ Needs translation object |
| **Odia** | `or` | ଓଡ଼ିଆ | ⚠️ Needs translation object |
| **Assamese** | `as` | অসমীয়া | ⚠️ Needs translation object |
| **Maithili** | `mai` | मैथिली | ⚠️ Needs translation object |
| **Mizo** | `lus` | Mizo ṭawng | ⚠️ Needs translation object |
| **Meitei** | `mni` | ꯃꯩꯇꯩꯂꯣꯟ | ⚠️ Needs translation object |

---

## 📋 STEP 1: Add Remaining Translation Objects

I've already added complete translations for **Urdu, Bengali, and Tamil**. Now add the remaining 7 languages to `lib/translations.ts`:

### Example: Kannada (kn) Translation Object

```typescript
// Add this after Tamil (ta) in translations.ts, before the closing };

  // Kannada (kn)
  kn: {
    // Navigation
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    chat: "ಚಾಟ್",
    medicines: "ಔಷಧಗಳು",
    orders: "ಆದೇಶಗಳು",
    alerts: "ಎಚ್ಚರಿಕೆಗಳು",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",

    // Dashboard Stats
    activeOrders: "ಸಕ್ರಿಯ ಆದೇಶಗಳು",
    totalCustomers: "ಒಟ್ಟು ಗ್ರಾಹಕರು",
    medicinesStock: "ಔಷಧ ಸ್ಟಾಕ್",
    revenue: "ಆದಾಯ",
    recentOrders: "ಇತ್ತೀಚಿನ ಆದೇಶಗಳು",
    aiInsights: "AI ಒಳನೋಟಗಳು",
    noRecentOrders: "ಇತ್ತೀಚಿನ ಆದೇಶಗಳಿಲ್ಲ",
    noInsights: "ಒಳನೋಟಗಳು ಲಭ್ಯವಿಲ್ಲ",
    smartRecommendations: "ನಿಮ್ಮ ಔಷಧಾಲಯಕ್ಕಾಗಿ ಸ್ಮಾರ್ಟ್ ಶಿಫಾರಸುಗಳು",

    // Chat
    chatPlaceholder: "ನಿಮ್ಮ ಔಷಧಗಳ ಬಗ್ಗೆ ಕೇಳಿ...",
    sendMessage: "ಕಳುಹಿಸಿ",
    voiceInput: "ಧ್ವನಿ ಇನ್‌ಪುಟ್",
    voiceOutput: "ಪ್ರತಿಕ್ರಿಯೆ ಹೇಳಿ",
    listening: "ಕೇಳುತ್ತಿದೆ...",
    speaking: "ಮಾತನಾಡುತ್ತಿದೆ...",

    // Medicines
    search: "ಔಷಧಗಳನ್ನು ಹುಡುಕಿ",
    addToOrder: "ಆದೇಶಕ್ಕೆ ಸೇರಿಸಿ",
    medicineNotFound: "ಔಷಧ ಸಿಗಲಿಲ್ಲ",
    searchResults: "ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು",
    medicineSearch: "ಔಷಧ ಹುಡುಕಾಟ",
    searchDatabaseDesc: "ಔಷಧಗಳ ನಮ್ಮ ಸಮಗ್ರ ಡೇಟಾಬೇಸ್ ಅನ್ನು ಹುಡುಕಿ ಮತ್ತು ಬ್ರೌಸ್ ಮಾಡಿ",
    searchByNamePlaceholder: "ಔಷಧದ ಹೆಸರು ಅಥವಾ ಜೆನೆರಿಕ್ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ...",
    all: "ಎಲ್ಲಾ",
    // ... add all other keys following the same pattern as Urdu/Bengali/Tamil
  },
```

### Example: Malayalam (ml) Translation Object

```typescript
  // Malayalam (ml)
  ml: {
    // Navigation
    dashboard: "ഡാഷ്‌ബോർഡ്",
    chat: "ചാറ്റ്",
    medicines: "മരുന്നുകൾ",
    orders: "ഓർഡറുകൾ",
    alerts: "മുന്നറിയിപ്പുകൾ",
    settings: "ക്രമീകരണങ്ങൾ",

    // Dashboard Stats
    activeOrders: "സജീവ ഓർഡറുകൾ",
    totalCustomers: "മൊത്തം ഉപഭോക്താക്കൾ",
    medicinesStock: "മരുന്ന് സ്റ്റോക്ക്",
    revenue: "വരുമാനം",
    recentOrders: "സമീപകാല ഓർഡറുകൾ",
    aiInsights: "AI ഉൾക്കാഴ്ചകൾ",
    noRecentOrders: "സമീപകാല ഓർഡറുകളൊന്നുമില്ല",
    noInsights: "ഉൾക്കാഴ്ചകൾ ലഭ്യമല്ല",
    smartRecommendations: "നിങ്ങളുടെ ഫാർമസിക്കായുള്ള സ്മാർട്ട് ശുപാർശകൾ",

    // Chat
    chatPlaceholder: "നിങ്ങളുടെ മരുന്നുകളെക്കുറിച്ച് ചോദിക്കുക...",
    sendMessage: "അയയ്ക്കുക",
    voiceInput: "വോയ്സ് ഇൻപുട്ട്",
    voiceOutput: "പ്രതികരണം പറയുക",
    listening: "കേൾക്കുന്നു...",
    speaking: "പറയുന്നു...",
    // ... add all other keys
  },
```

---

## 📋 STEP 2: Add RTL Support for Urdu

Urdu is a right-to-left (RTL) language. Add RTL support in your global CSS:

### Update `app/globals.css`

```css
/* Add this to your existing globals.css */

/* RTL Support for Urdu */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .flex {
  flex-direction: row-reverse;
}

/* Preserve LTR for specific elements that shouldn't flip */
[dir="rtl"] input[type="email"],
[dir="rtl"] input[type="tel"],
[dir="rtl"] input[type="number"] {
  direction: ltr;
  text-align: left;
}
```

### Update Root Layout to Support RTL

Modify `app/layout.tsx`:

```typescript
import { useLanguage } from '@/contexts/LanguageContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If using client component:
  const { language } = useLanguage();
  const isRTL = language === 'ur'; // Urdu is RTL

  return (
    <html lang={language} dir={isRTL ? 'rtl' : 'ltr'}>
      <body>
        {children}
      </body>
    </html>
  );
}
```

---

## 📋 STEP 3: Font Configuration for Proper Rendering

### Recommended Google Fonts by Language

Add to `app/layout.tsx` or `_document.tsx`:

```tsx
import { 
  Inter,          // English
  Noto_Sans_Devanagari,  // Hindi, Marathi, Maithili
  Noto_Nastaliq_Urdu,    // Urdu
  Noto_Sans_Bengali,      // Bengali, Assamese
  Noto_Sans_Tamil,        // Tamil
  Noto_Sans_Telugu,       // Telugu
  Noto_Sans_Gujarati,     // Gujarati
  Noto_Sans_Kannada,      // Kannada
  Noto_Sans_Malayalam,    // Malayalam
  Noto_Sans_Oriya,        // Odia
  Noto_Sans_Gurmukhi,     // Punjabi
  Noto_Serif_Meitei,      // Meitei
} from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSansDevanagari = Noto_Sans_Devanagari({ 
  subsets: ['devanagari'], 
  variable: '--font-devanagari' 
});
const notoNastaliqUrdu = Noto_Nastaliq_Urdu({ 
  subsets: ['arabic'], 
  variable: '--font-urdu',
  weight: ['400', '700']
});
const notoSansBengali = Noto_Sans_Bengali({ 
  subsets: ['bengali'], 
  variable: '--font-bengali' 
});
const notoSansTamil = Noto_Sans_Tamil({ 
  subsets: ['tamil'], 
  variable: '--font-tamil' 
});
// ... repeat for other languages

export default function RootLayout({ children }) {
  return (
    <html 
      className={`
        ${inter.variable} 
        ${notoSansDevanagari.variable}
        ${notoNastaliqUrdu.variable}
        ${notoSansBengali.variable}
        ${notoSansTamil.variable}
      `}
    >
      <body>{children}</body>
    </html>
  );
}
```

### Update Tailwind Config for Font Variables

`tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        devanagari: ['var(--font-devanagari)', 'sans-serif'],
        urdu: ['var(--font-urdu)', 'sans-serif'],
        bengali: ['var(--font-bengali)', 'sans-serif'],
        tamil: ['var(--font-tamil)', 'sans-serif'],
        // ... add others
      },
    },
  },
};
```

---

## 📋 STEP 4: Dynamic Font Loading Based on Language

Create a utility to apply fonts dynamically:

### Create `lib/fontUtils.ts`

```typescript
import { Language } from './translations';

export const getFontClassForLanguage = (lang: Language): string => {
  const fontMap: Record<Language, string> = {
    en: 'font-sans',
    hi: 'font-devanagari',
    ur: 'font-urdu',
    bn: 'font-bengali',
    ta: 'font-tamil',
    te: 'font-sans', // Telugu
    mr: 'font-devanagari',
    gu: 'font-sans', // Gujarati
    kn: 'font-sans', // Kannada
    ml: 'font-sans', // Malayalam
    pa: 'font-sans', // Punjabi
    or: 'font-sans', // Odia
    as: 'font-bengali', // Assamese uses Bengali script
    mai: 'font-devanagari',
    lus: 'font-sans',
    mni: 'font-sans',
  };
  
  return fontMap[lang] || 'font-sans';
};
```

### Apply Font Dynamically in Components

```tsx
import { useLanguage } from '@/contexts/LanguageContext';
import { getFontClassForLanguage } from '@/lib/fontUtils';

export default function MyComponent() {
  const { language } = useLanguage();
  const fontClass = getFontClassForLanguage(language);

  return (
    <div className={fontClass}>
      {/* Your content */}
    </div>
  );
}
```

---

## 📋 STEP 5: Complete Example JSON Translation Files

### **Example 1: Odia (or)**

```json
{
  "dashboard": "ଡ୍ୟାସବୋର୍ଡ",
  "chat": "ଚାଟ୍",
  "medicines": "ଔଷଧ",
  "orders": "ଅର୍ଡରଗୁଡିକ",
  "alerts": "ସତର୍କବାର୍ତ୍ତା",
  "settings": "ସେଟିଂସ୍",
  "activeOrders": "ସକ୍ରିୟ ଅର୍ଡରଗୁଡିକ",
  "totalCustomers": "ମୋଟ ଗ୍ରାହକ",
  "medicinesStock": "ଔଷଧ ଷ୍ଟକ୍",
  "revenue": "ରାଜସ୍ୱ",
  "recentOrders": "ସାମ୍ପ୍ରତିକ ଅର୍ଡରଗୁଡିକ",
  "aiInsights": "AI ଅନ୍ତର୍ଦୃଷ୍ଟି",
  "search": "ଔଷଧ ଖୋଜ",
  "addToCart": "କାର୍ଟରେ ଯୋଡନ୍ତୁ",
  "loading": "ଲୋଡ୍ କରୁଛି..."
}
```

### **Example 2: Assamese (as)**

```json
{
  "dashboard": "ডেছব'ৰ্ড",
  "chat": "চেট",
  "medicines": "ঔষধ",
  "orders": "অৰ্ডাৰ",
  "alerts": "সতৰ্কবাৰ্তা",
  "settings": "ছেটিংছ",
  "activeOrders": "সক্ৰিয় অৰ্ডাৰ",
  "totalCustomers": "মুঠ গ্ৰাহক",
  "medicinesStock": "ঔষধৰ ষ্টক",
  "revenue": "আয়",
  "recentOrders": "শেহতীয়া অৰ্ডাৰ",
  "aiInsights": "AI অন্তৰ্দৃষ্টি",
  "search": "ঔষধ বিচাৰক",
  "addToCart": "কাৰ্টত যোগ কৰক",
  "loading": "ল'ড কৰি আছে..."
}
```

### **Example 3: Maithili (mai)**

```json
{
  "dashboard": "डैशबोर्ड",
  "chat": "चैट",
  "medicines": "दवाइ",
  "orders": "आर्डर",
  "alerts": "चेतावनी",
  "settings": "सेटिंग्स",
  "activeOrders": "सक्रिय आर्डर",
  "totalCustomers": "कुल ग्राहक",
  "medicinesStock": "दवाइक स्टॉक",
  "revenue": "आय",
  "recentOrders": "हालक आर्डर",
  "aiInsights": "AI अंतर्दृष्टि",
  "search": "दवाइ खोजू",
  "addToCart": "कार्टमे जोड़ू",
  "loading": "लोड भ' रहल अछि..."
}
```

---

## 📋 STEP 6: Troubleshooting - Common Issues & Fixes

### Issue 1: Translations Still Showing English

**Cause**: Translation object not added to `translations.ts`

**Fix**:
```typescript
// Ensure language exists in translations object
const lang: Language = 'kn'; // Kannada
console.log(translations[lang]); // Should not be undefined

// If undefined, add the translation object
```

### Issue 2: Fonts Not Rendering Correctly

**Cause**: Font not loaded or incorrect font-family applied

**Fix**:
```bash
# Install required Google Fonts
npm install @next/font
```

```tsx
// Verify font is loaded in page
import { Noto_Sans_Kannada } from 'next/font/google';
const kannadaFont = Noto_Sans_Kannada({ subsets: ['kannada'] });
```

### Issue 3: RTL Layout Broken for Urdu

**Cause**: Missing `dir="rtl"` attribute

**Fix**:
```tsx
// In layout or component
const isRTL = language === 'ur';
return <div dir={isRTL ? 'rtl' : 'ltr'}>{children}</div>;
```

### Issue 4: Language Selector Shows Language But Content is English

**Cause**: Translation keys missing from new language object

**Fix**:
```typescript
// Copy all keys from English (en) to new language
// Ensure exact key names match
Object.keys(translations.en).forEach(key => {
  if (!translations.kn[key]) {
    console.warn(`Missing translation for key: ${key} in language: kn`);
  }
});
```

### Issue 5: Browser Console Errors About Missing Translations

**Cause**: Translation fallback returning empty string

**Fix**: The current `t()` function returns `""` for missing keys, which is correct behavior. To debug:

```typescript
// lib/translations.ts - Add debugging
export const t = (key: string, lang: Language): string => {
  const translation = translations[lang]?.[key as keyof typeof translations.en];
  if (!translation && lang !== 'en') {
    console.warn(`Missing translation: ${key} for language: ${lang}`);
  }
  return translation || "";
};
```

---

## 📋 STEP 7: Testing Checklist

### Pre-Deployment Checks

- [ ] All 16 languages have translation objects in `translations.ts`
- [ ] Language selector shows all languages
- [ ] Selecting each language updates UI text
- [ ] Urdu displays RTL correctly
- [ ] All Indic scripts render properly (no boxes/mojibake)
- [ ] Font files loaded for all languages
- [ ] No console errors about missing translations
- [ ] LocalStorage persists language selection
- [ ] Page refreshes maintain selected language

### Manual Testing Script

```javascript
// Run in browser console
const languages = ['en', 'hi', 'ur', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'mai', 'lus', 'mni'];

languages.forEach(lang => {
  localStorage.setItem('language', lang);
  location.reload();
  // Verify UI text changes
});
```

---

## 📋 Quick Reference: Locale Codes Summary

```typescript
// Correct ISO 639 codes for your languages:
const LOCALE_CODES = {
  'en':  'English',
  'hi':  'Hindi',
  'ur':  'Urdu',       // ISO 639-1
  'bn':  'Bengali',    // ISO 639-1
  'ta':  'Tamil',      // ISO 639-1
  'te':  'Telugu',     // ISO 639-1
  'mr':  'Marathi',    // ISO 639-1
  'gu':  'Gujarati',   // ISO 639-1
  'kn':  'Kannada',    // ISO 639-1
  'ml':  'Malayalam',  // ISO 639-1
  'pa':  'Punjabi',    // ISO 639-1
  'or':  'Odia',       // ISO 639-1 (formerly 'ory')
  'as':  'Assamese',   // ISO 639-1
  'mai': 'Maithili',   // ISO 639-3
  'lus': 'Mizo',       // ISO 639-3 (Lushai)
  'mni': 'Meitei',     // ISO 639-3 (Manipuri)
} as const;
```

---

## 🎯 Next Steps

1. **Complete remaining translations**: Add `kn`, `ml`, `or`, `as`, `mai`, `lus`, `mni` objects to `translations.ts`
2. **Test each language**: Use language selector to verify translations display
3. **Add fonts**: Configure Google Fonts for proper script rendering
4. **Enable RTL**: Ensure Urdu displays right-to-left
5. **Deploy**: Frontend-only changes require no backend modifications

---

## 📞 Support Resources

- **Google Fonts**: https://fonts.google.com/noto
- **ISO 639 Codes**: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
- **Next.js i18n**: https://nextjs.org/docs/app/building-your-application/routing/internationalization
- **Tailwind RTL**: https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support

---

**Last Updated**: $(date)  
**Version**: 2.0  
**Status**: ✅ Ready for Implementation
