# Medical Dashboard - Android Application

## Complete Setup Instructions

### Prerequisites
- **Android Studio**: Hedgehog (2023.1.1) or newer
- **JDK**: Version 17
- **Minimum SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)

---

## Step-by-Step Setup Guide

### 1. Create New Project in Android Studio

1. Open **Android Studio**
2. Click **File** → **New** → **Project**
3. Select **Empty Activity**
4. Click **Next**

**Project Configuration:**
- **Name**: Medical Dashboard
- **Package name**: com.medical.dashboard
- **Save location**: Choose your preferred location
- **Language**: Kotlin
- **Minimum SDK**: API 24 (Android 7.0)
- **Build configuration language**: Groovy DSL
5. Click **Finish**

---

### 2. Replace Project Files

#### **Option A: Manual File Replacement**

After Android Studio generates the project, replace all files with the provided code:

1. **Delete the default generated files:**
   - Delete `app/src/main/java/com/medical/dashboard/MainActivity.kt`
   - Delete `app/src/main/res/layout/activity_main.xml`

2. **Copy all provided files to your project** following the folder structure below.

#### **Option B: Use Provided Project Structure**

Copy the entire `android-medical-dashboard` folder to your workspace and open it in Android Studio.

---

## Complete Folder Structure

```
android-medical-dashboard/
│
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml
│   │   │   │
│   │   │   ├── java/com/medical/dashboard/
│   │   │   │   ├── MedicalApp.kt
│   │   │   │   │
│   │   │   │   ├── data/
│   │   │   │   │   ├── model/
│   │   │   │   │   │   ├── Medicine.kt
│   │   │   │   │   │   └── User.kt
│   │   │   │   │   │
│   │   │   │   │   ├── dao/
│   │   │   │   │   │   └── MedicineDao.kt
│   │   │   │   │   │
│   │   │   │   │   ├── database/
│   │   │   │   │   │   └── MedicalDatabase.kt
│   │   │   │   │   │
│   │   │   │   │   └── repository/
│   │   │   │   │       └── MedicineRepository.kt
│   │   │   │   │
│   │   │   │   ├── ui/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── LoginActivity.kt
│   │   │   │   │   │
│   │   │   │   │   ├── main/
│   │   │   │   │   │   └── MainActivity.kt
│   │   │   │   │   │
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── DashboardFragment.kt
│   │   │   │   │   │
│   │   │   │   │   ├── medicines/
│   │   │   │   │   │   ├── MedicinesFragment.kt
│   │   │   │   │   │   └── AddEditMedicineFragment.kt
│   │   │   │   │   │
│   │   │   │   │   ├── profile/
│   │   │   │   │   │   └── ProfileFragment.kt
│   │   │   │   │   │
│   │   │   │   │   └── adapters/
│   │   │   │   │       ├── MedicineAdapter.kt
│   │   │   │   │       └── ReminderAdapter.kt
│   │   │   │   │
│   │   │   │   ├── viewmodel/
│   │   │   │   │   └── MedicineViewModel.kt
│   │   │   │   │
│   │   │   │   └── utils/
│   │   │   │       ├── PreferenceManager.kt
│   │   │   │       ├── AlarmScheduler.kt
│   │   │   │       ├── AlarmReceiver.kt
│   │   │   │       ├── BootReceiver.kt
│   │   │   │       └── Validator.kt
│   │   │   │
│   │   │   └── res/
│   │   │       ├── layout/
│   │   │       │   ├── activity_login.xml
│   │   │       │   ├── activity_main.xml
│   │   │       │   ├── fragment_dashboard.xml
│   │   │       │   ├── fragment_medicines.xml
│   │   │       │   ├── fragment_add_edit_medicine.xml
│   │   │       │   ├── fragment_profile.xml
│   │   │       │   ├── item_medicine.xml
│   │   │       │   └── item_reminder.xml
│   │   │       │
│   │   │       ├── navigation/
│   │   │       │   └── nav_graph.xml
│   │   │       │
│   │   │       ├── menu/
│   │   │       │   ├── bottom_nav_menu.xml
│   │   │       │   └── menu_main.xml
│   │   │       │
│   │   │       ├── drawable/
│   │   │       │   ├── ic_email.xml
│   │   │       │   ├── ic_password.xml
│   │   │       │   ├── ic_dashboard.xml
│   │   │       │   ├── ic_medicine.xml
│   │   │       │   ├── ic_profile.xml
│   │   │       │   ├── ic_reminder.xml
│   │   │       │   ├── ic_add.xml
│   │   │       │   ├── ic_edit.xml
│   │   │       │   ├── ic_delete.xml
│   │   │       │   ├── ic_medical_logo.xml
│   │   │       │   ├── ic_theme.xml
│   │   │       │   ├── ic_logout.xml
│   │   │       │   ├── ic_notification.xml
│   │   │       │   └── circle_background.xml
│   │   │       │
│   │   │       ├── values/
│   │   │       │   ├── strings.xml
│   │   │       │   ├── colors.xml
│   │   │       │   └── themes.xml
│   │   │       │
│   │   │       ├── values-night/
│   │   │       │   └── themes.xml
│   │   │       │
│   │   │       ├── xml/
│   │   │       │   ├── data_extraction_rules.xml
│   │   │       │   └── backup_rules.xml
│   │   │       │
│   │   │       └── mipmap/ (Auto-generated icons)
│   │   │
│   │   └── test/ (Auto-generated test folders)
│   │
│   ├── build.gradle (app-level)
│   └── proguard-rules.pro
│
├── build.gradle (project-level)
├── settings.gradle
└── gradle.properties
```

---

## 3. Gradle Sync

After copying all files:

1. Click **File** → **Sync Project with Gradle Files**
2. Wait for the sync to complete (may take a few minutes)
3. If prompted to update Gradle or plugins, click **Update**

---

## 4. Enable ViewBinding (Verify)

ViewBinding should already be enabled in `app/build.gradle`:

```gradle
android {
    ...
    buildFeatures {
        viewBinding true
    }
}
```

---

## 5. Build and Run

1. **Connect a device** or **start an emulator**
   - Recommended: API 24 or higher

2. **Build the project:**
   - Click **Build** → **Make Project**
   - Or press `Ctrl+F9` (Windows) / `Cmd+F9` (Mac)

3. **Run the app:**
   - Click the green **Run** button
   - Or press `Shift+F10` (Windows) / `Ctrl+R` (Mac)

---

## Features Implementation Details

### 1. **Login Screen** ✅
- **Location**: `LoginActivity.kt` + `activity_login.xml`
- **Features**: 
  - Email validation
  - Password validation (min 6 characters)
  - Error handling with TextInputLayout
  - Auto-login if already logged in

### 2. **Dashboard** ✅
- **Location**: `DashboardFragment.kt` + `fragment_dashboard.xml`
- **Features**:
  - Welcome message with user name
  - Total medicines count card
  - Upcoming reminders count card
  - List of next 5 upcoming reminders
  - Material Design cards with icons

### 3. **Medicine Management** ✅
- **Location**: `MedicinesFragment.kt`, `AddEditMedicineFragment.kt`
- **Features**:
  - View all medicines in RecyclerView
  - Add new medicine with FAB
  - Edit existing medicine
  - Delete medicine with confirmation
  - Empty state when no medicines

### 4. **Reminder System** ✅
- **Location**: `AlarmScheduler.kt`, `AlarmReceiver.kt`
- **Features**:
  - Set date and time pickers
  - Schedule exact alarms using AlarmManager
  - Show notifications at scheduled time
  - Enable/disable reminders per medicine
  - Re-schedule on device reboot

### 5. **Navigation** ✅
- **Location**: `nav_graph.xml`, `MainActivity.kt`
- **Features**:
  - Bottom Navigation (Dashboard, Medicines, Profile)
  - Safe Args for passing data
  - Proper back stack handling

### 6. **MVVM Architecture** ✅
- **ViewModel**: `MedicineViewModel.kt`
- **LiveData**: For observing data changes
- **Repository**: `MedicineRepository.kt`
- **Clean separation of concerns**

### 7. **Room Database** ✅
- **Entity**: `Medicine.kt`
- **DAO**: `MedicineDao.kt`
- **Database**: `MedicalDatabase.kt`
- **Singleton pattern**

### 8. **Theme Support** ✅
- **Light Theme**: `values/themes.xml`
- **Dark Theme**: `values-night/themes.xml`
- **Toggle**: Menu option in MainActivity
- **Persists**: Saved in SharedPreferences

### 9. **Error Handling** ✅
- Input validation on all forms
- Try-catch blocks for critical operations
- User-friendly error messages
- Toast notifications for feedback

### 10. **Material Design** ✅
- MaterialCardView for cards
- Material buttons and inputs
- Proper elevation and shadows
- Color scheme following Material Design

---

## Testing the Application

### Login Testing
1. Open the app
2. Enter any valid email (e.g., test@example.com)
3. Enter password (min 6 characters)
4. Click Login

### Adding Medicine
1. Navigate to **Medicines** tab
2. Click the **+** FAB button
3. Fill in all fields:
   - Medicine name: "Aspirin"
   - Dosage: "100mg"
   - Frequency: "2x daily"
   - Select start date
   - Select end date
   - Select reminder time
4. Click **Save**

### Testing Notifications
**For Android 13+ (API 33+):**
1. The app will request notification permission
2. Grant the permission
3. Add a medicine with a reminder time
4. Wait for the scheduled time
5. You should receive a notification

### Testing Dark Theme
1. Click the **3-dot menu** (top right)
2. Select **Toggle Theme**
3. The app switches between light and dark mode

---

## Permissions Required

The app requests these permissions (already added in AndroidManifest.xml):

- `POST_NOTIFICATIONS` - For showing reminders (Android 13+)
- `SCHEDULE_EXACT_ALARM` - For exact time reminders
- `USE_EXACT_ALARM` - Alternative for exact alarms
- `RECEIVE_BOOT_COMPLETED` - To reschedule alarms after reboot

---

## Troubleshooting

### Build Errors

**Problem**: "Unresolved reference" errors
- **Solution**: Sync Gradle files again (File → Sync Project with Gradle Files)

**Problem**: ViewBinding not found
- **Solution**: Rebuild project (Build → Rebuild Project)

**Problem**: Navigation SafeArgs errors
- **Solution**: Clean and rebuild (Build → Clean Project, then Build → Rebuild)

### Runtime Errors

**Problem**: App crashes on launch
- **Solution**: Check Logcat for stack trace
- **Common fix**: Invalidate caches (File → Invalidate Caches → Invalidate and Restart)

**Problem**: Notifications not showing
- **Solution**: 
  1. Check notification permissions (Android 13+)
  2. Ensure "Exact alarm" permission is granted
  3. Check device battery optimization settings

**Problem**: Database errors
- **Solution**: Uninstall and reinstall the app to reset database

---

## Production Checklist

Before releasing:

✅ Test on multiple devices (different screen sizes)
✅ Test on different Android versions (API 24 - 34)
✅ Add proper app icon (replace default launcher icons)
✅ Test notifications on Android 13+
✅ Verify all permissions are properly requested
✅ Test dark theme on all screens
✅ Add proper error logging (Firebase Crashlytics recommended)
✅ Implement proper backend authentication (currently demo mode)
✅ Add data backup/restore functionality
✅ Test with large data sets (100+ medicines)
✅ Perform UI testing on different orientations

---

## Architecture Overview

```
UI Layer (Activities/Fragments)
        ↓
    ViewModel
        ↓
    Repository
        ↓
   DAO (Room)
        ↓
  Local Database
```

---

## Dependencies Used

- **AndroidX Core KTX**: Modern Android API
- **Material Components**: Material Design UI
- **Navigation Component**: Fragment navigation
- **Room Database**: Local data persistence
- **Lifecycle Components**: ViewModel & LiveData
- **Coroutines**: Asynchronous programming
- **ViewBinding**: Type-safe view access

---

## Notes

1. **Demo Login**: Currently accepts any valid email/password. Integrate with a real backend for production.

2. **Data Persistence**: All data is stored locally in Room database. Consider cloud sync for production.

3. **Notification Scheduling**: Uses AlarmManager for precise scheduling. Tested on Android 7.0 - 14.

4. **Theme Switching**: Requires app restart on some devices (handled automatically).

5. **MVVM Pattern**: Ensures clean, testable, and maintainable code.

---

## Future Enhancements (Optional)

- 📊 Add charts for medication adherence
- 🔔 Multiple reminders per medicine
- 📸 Medicine photo/barcode scanning
- 🌐 Cloud sync with Firebase
- 👥 Multiple user profiles
- 📧 Email/SMS reminders
- 🏥 Doctor contact integration
- 📅 Calendar integration
- 🔒 Biometric authentication
- 📱 Widget support

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Android Studio Logcat for error messages
3. Verify all files are in correct locations
4. Ensure Gradle sync completed successfully

---

## License

This is a demonstration project for educational purposes.

---

**Project Created**: 2026-02-28  
**Android Studio Version**: Hedgehog 2023.1.1+  
**Minimum SDK**: 24 (Android 7.0)  
**Target SDK**: 34 (Android 14)  
**Language**: Kotlin  
**Architecture**: MVVM  

---

## Quick Start Summary

1. ✅ Open Android Studio
2. ✅ Create new Empty Activity project
3. ✅ Copy all provided files to project
4. ✅ Sync Gradle
5. ✅ Build and Run
6. ✅ Test all features

**Congratulations! Your Medical Dashboard app is ready! 🎉**
