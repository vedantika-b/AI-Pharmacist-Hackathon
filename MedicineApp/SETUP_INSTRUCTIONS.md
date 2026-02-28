# MedicineApp - Setup Instructions

## Quick Start Guide

Follow these steps to set up and run the MedicineApp on your local machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
1. **Android Studio** - Hedgehog (2023.1.1) or later
   - Download from: https://developer.android.com/studio

2. **Java Development Kit (JDK)** - Version 17
   - Included with Android Studio or download from: https://www.oracle.com/java/technologies/downloads/

3. **Android SDK** - Version 34
   - Installed via Android Studio SDK Manager

### System Requirements
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: At least 4GB free space
- **OS**: Windows 10/11, macOS 10.14+, or Linux

---

## Installation Steps

### Step 1: Clone or Download the Project

If you have the project as a ZIP file:
1. Extract the ZIP to a location of your choice
2. Remember the path to the `MedicineApp` folder

### Step 2: Open Project in Android Studio

1. Launch **Android Studio**
2. Click **"Open"** on the welcome screen
   - Or go to `File → Open...` if Android Studio is already open
3. Navigate to the `MedicineApp` folder
4. Click **"OK"**

### Step 3: Gradle Sync

1. Android Studio will automatically start syncing Gradle
2. Wait for the process to complete (may take 2-5 minutes on first run)
3. You'll see "Gradle build finished" in the bottom status bar

**If Gradle sync fails:**
```
File → Invalidate Caches → Invalidate and Restart
```

### Step 4: Install Android SDK Components

1. Go to `Tools → SDK Manager`
2. In the **SDK Platforms** tab, ensure these are installed:
   - ✅ Android 14.0 (API 34)
   - ✅ Android 7.0 (API 24)

3. In the **SDK Tools** tab, ensure these are installed:
   - ✅ Android SDK Build-Tools 34.0.0
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools

4. Click **"Apply"** if any components need installation

### Step 5: Set Up an Emulator (Optional)

If you don't have a physical device:

1. Go to `Tools → Device Manager`
2. Click **"Create Device"**
3. Select a device definition (e.g., Pixel 6)
4. Click **"Next"**
5. Select a system image:
   - **Recommended**: Android 14 (API 34)
   - Download if not already available
6. Click **"Next"** → **"Finish"**

### Step 6: Build the Project

1. Go to `Build → Make Project`
2. Or press `Ctrl+F9` (Windows/Linux) or `Cmd+F9` (Mac)
3. Wait for the build to complete
4. Check the **Build** tab for any errors

### Step 7: Run the Application

**Option A: Using Emulator**
1. Click the green **"Run"** button (▶) in the toolbar
2. Or press `Shift+F10` (Windows/Linux) or `Ctrl+R` (Mac)
3. Select the emulator from the device list
4. Click **"OK"**
5. Wait for the emulator to boot and app to install

**Option B: Using Physical Device**
1. Enable **Developer Options** on your Android device:
   - Go to `Settings → About Phone`
   - Tap **"Build Number"** 7 times
   - Go back to `Settings → Developer Options`
   - Enable **"USB Debugging"**

2. Connect your device via USB
3. Accept the debugging prompt on your device
4. Click the **"Run"** button in Android Studio
5. Select your device from the list
6. The app will install and launch

---

## Project Configuration

### Gradle Files Overview

**1. settings.gradle**
```gradle
rootProject.name = "MedicineApp"
include ':app'
```

**2. build.gradle (Project level)**
- Kotlin version: 1.9.0
- Android Gradle Plugin: 8.1.0

**3. build.gradle (App level)**
Key dependencies:
- Room Database: 2.6.0
- Lifecycle (ViewModel, LiveData): 2.6.2
- Coroutines: 1.7.3
- Material Design 3: 1.10.0
- RecyclerView: 1.3.2

### Important Configuration Files

**AndroidManifest.xml**
- Declared Activities: LoginActivity, DashboardActivity, AddMedicineActivity
- Application class: MedicineApplication
- Permissions: None required (offline app)

**build.gradle (app)**
- `viewBinding { enabled = true }`
- `compileSdk = 34`
- `minSdk = 24`
- `targetSdk = 34`

---

## Verification Steps

After installation, verify everything works:

### 1. Check Project Structure
Ensure these folders exist:
```
MedicineApp/app/src/main/
├── java/com/example/medicineapp/
├── res/
└── AndroidManifest.xml
```

### 2. Verify Dependencies
1. Open `build.gradle (Module: app)`
2. Check that all dependencies are resolved (no red underlines)
3. If issues exist, click **"Sync Now"**

### 3. Test Build
1. Run `Build → Make Project`
2. Ensure **"BUILD SUCCESSFUL"** appears in the Build tab

### 4. Test Run
1. Run the app on emulator/device
2. You should see the **Login Screen**
3. Enter test credentials:
   - Email: `test@example.com`
   - Password: `123456`
4. Click **"Login"**
5. You should see the **Dashboard Screen**

---

## Troubleshooting

### Issue 1: Gradle Sync Failed

**Solution:**
```
1. Check internet connection
2. File → Invalidate Caches → Invalidate and Restart
3. Delete .gradle folder in project root
4. Click "Sync Project with Gradle Files"
```

### Issue 2: SDK Not Found

**Solution:**
```
1. File → Project Structure → SDK Location
2. Set Android SDK location (usually C:\Users\[Username]\AppData\Local\Android\Sdk)
3. Click OK
4. Sync Gradle again
```

### Issue 3: Build Tools Version Not Found

**Solution:**
```
1. Tools → SDK Manager → SDK Tools tab
2. Install "Android SDK Build-Tools 34.0.0"
3. Click Apply
4. Restart Android Studio
```

### Issue 4: Emulator Won't Start

**Solution:**
```
1. Tools → Device Manager
2. Click ⋮ (three dots) next to device → "Cold Boot Now"
3. Or delete and create a new virtual device
4. Ensure "Intel x86 Emulator Accelerator (HAXM)" is installed in SDK Manager
```

### Issue 5: App Crashes on Run

**Solution:**
```
1. Check LogCat for error messages
2. Verify minSdk matches device Android version (API 24+)
3. Clean and rebuild:
   Build → Clean Project
   Build → Rebuild Project
4. Uninstall app from device/emulator and re-run
```

### Issue 6: ViewBinding Not Recognized

**Solution:**
```
1. Ensure viewBinding is enabled in build.gradle (app):
   android {
       buildFeatures {
           viewBinding true
       }
   }
2. File → Invalidate Caches → Invalidate and Restart
3. Rebuild Project
```

---

## File Structure Checklist

Ensure all these files exist:

### Kotlin Files (24 files)
- ✅ MedicineApplication.kt
- ✅ Medicine.kt
- ✅ MedicineDao.kt
- ✅ MedicineDatabase.kt
- ✅ MedicineRepository.kt
- ✅ LoginActivity.kt
- ✅ DashboardActivity.kt
- ✅ AddMedicineActivity.kt
- ✅ MedicineAdapter.kt
- ✅ MedicineViewModel.kt
- ✅ PreferenceManager.kt
- ✅ Validator.kt

### XML Files (9 files)
- ✅ activity_login.xml
- ✅ activity_dashboard.xml
- ✅ activity_add_medicine.xml
- ✅ item_medicine.xml
- ✅ menu_dashboard.xml
- ✅ strings.xml
- ✅ colors.xml
- ✅ themes.xml (values)
- ✅ themes.xml (values-night)

### Gradle Files (4 files)
- ✅ build.gradle (project)
- ✅ build.gradle (app)
- ✅ settings.gradle
- ✅ gradle.properties

### Other Files
- ✅ AndroidManifest.xml
- ✅ proguard-rules.pro

---

## Next Steps

Once the app is running successfully:

1. **Explore the Code**
   - Review MVVM architecture implementation
   - Study Room Database setup
   - Understand ViewBinding usage
   - Examine LiveData and ViewModel lifecycle

2. **Test All Features**
   - Login with different credentials
   - Add medicines with various names and times
   - Edit existing medicines
   - Delete medicines
   - Toggle between light and dark themes
   - Test logout functionality

3. **Customize the App**
   - Change app name in `strings.xml`
   - Modify color scheme in `colors.xml`
   - Add new fields to Medicine entity
   - Implement additional features

4. **Deploy**
   - Generate signed APK: `Build → Generate Signed Bundle/APK`
   - Choose APK
   - Create or select keystore
   - Build release APK

---

## Additional Resources

- **Android Documentation**: https://developer.android.com/docs
- **Kotlin Documentation**: https://kotlinlang.org/docs
- **Material Design 3**: https://m3.material.io/
- **Room Database**: https://developer.android.com/training/data-storage/room
- **MVVM Architecture**: https://developer.android.com/topic/architecture

---

## Support

If you encounter issues not covered here:

1. Check **LogCat** output in Android Studio
2. Review **Build** tab messages
3. Ensure all prerequisites are met
4. Try the troubleshooting steps above
5. Verify file structure matches the checklist

---

**Setup Complete! You're ready to use MedicineApp** 🎉
