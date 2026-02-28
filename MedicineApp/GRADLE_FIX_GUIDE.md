# Quick Fix for Gradle Errors

## Current Error
```
Unable to find method 'org.gradle.api.artifacts.Dependency 
org.gradle.api.artifacts.dsl.DependencyHandler.module(java.lang.Object)'
```

This error indicates a Gradle cache corruption or version mismatch issue.

---

## 🔧 Solution Steps

### Option 1: Clean Gradle Cache (Recommended - Fastest)

**Windows Users:**

1. **Close Android Studio completely**

2. **Run the cleanup script:**
   - Double-click `clean-gradle-cache.bat` in the MedicineApp folder
   - Wait for it to finish

3. **Reopen Android Studio:**
   - Open the MedicineApp project
   - Wait for automatic Gradle sync
   - This will download fresh dependencies

**Manual Steps (if script doesn't work):**

1. Close Android Studio

2. Delete these folders:
   ```
   MedicineApp\.gradle
   MedicineApp\build
   MedicineApp\app\build
   C:\Users\[YourUsername]\.gradle\caches
   ```

3. Reopen Android Studio and sync

---

### Option 2: From Android Studio

1. **Click:** `File → Invalidate Caches...`
2. **Check:** "Clear file system cache and Local History"
3. **Check:** "Clear downloaded shared indexes"
4. **Click:** "Invalidate and Restart"
5. **Wait** for Android Studio to restart
6. **Wait** for automatic Gradle sync

---

### Option 3: Re-download Dependencies

In Android Studio:

1. **Click:** The error notification
2. **Select:** "Re-download dependencies and sync project"
3. **Wait** for download to complete (requires internet)

---

## ✅ Verification

After cleaning, you should see:

1. ✅ "Gradle sync finished successfully"
2. ✅ No errors in the Build tab
3. ✅ Project structure shows all files
4. ✅ Green Run button (▶) is enabled

---

## 🚀 If Still Having Issues

### Step 1: Check Gradle Version
The project is configured for:
- **Gradle:** 8.2
- **Android Gradle Plugin:** 8.1.0
- **Kotlin:** 1.9.0

### Step 2: Verify Internet Connection
Gradle needs to download:
- Dependencies (~150 MB)
- Build tools
- SDK components

### Step 3: Check JDK Version
Required: **JDK 17**

In Android Studio:
1. `File → Project Structure → SDK Location`
2. Check "JDK location" shows JDK 17

---

## 📝 What Was Fixed

1. ✅ Updated `build.gradle` to use modern plugins syntax
2. ✅ Created `gradle-wrapper.properties` for Gradle 8.2
3. ✅ Changed repository mode to `PREFER_SETTINGS`
4. ✅ Fixed plugin IDs to use correct names

---

## 🎯 Next Steps After Fix

1. **Sync completes successfully**
2. **Click Run button** (▶)
3. **Select emulator** or device
4. **App launches**

---

## Common Errors Reference

### "Build was configured to prefer settings repositories"
**Fixed by:** Removing repositories from `build.gradle`

### "Unable to find method module()"
**Fixed by:** Cleaning Gradle cache + using correct Gradle version

### "Namespace not specified"
**Fixed by:** Adding `namespace` in `build.gradle`

### "ViewBinding cannot be resolved"
**Fixed by:** Successful Gradle sync after cache clear

---

## Contact & Support

If errors persist:

1. **Check Build Output:** View → Tool Windows → Build
2. **Check Gradle Console:** View → Tool Windows → Build → Gradle Console
3. **Copy full error message** for troubleshooting

---

**Last Updated:** February 28, 2026
**Project:** MedicineApp v1.0
**Gradle Version:** 8.2
