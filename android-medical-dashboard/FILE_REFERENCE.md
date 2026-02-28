# Medical Dashboard - File Reference Guide

## 📋 Complete File List with Descriptions

### 🔧 Configuration Files (Root Level)

| File | Location | Purpose |
|------|----------|---------|
| `build.gradle` | `/build.gradle` | Project-level Gradle configuration |
| `settings.gradle` | `/settings.gradle` | Project settings and module includes |
| `gradle.properties` | `/gradle.properties` | Gradle properties and configurations |

### 📱 App Configuration

| File | Location | Purpose |
|------|----------|---------|
| `build.gradle` | `/app/build.gradle` | App-level dependencies and plugins |
| `proguard-rules.pro` | `/app/proguard-rules.pro` | ProGuard rules for code obfuscation |
| `AndroidManifest.xml` | `/app/src/main/AndroidManifest.xml` | App permissions, activities, receivers |

---

## 🎯 Kotlin Files

### Application & Core

| File | Package | Purpose |
|------|---------|---------|
| `MedicalApp.kt` | `com.medical.dashboard` | Application class, notification channel setup |

### Data Layer

#### Models
| File | Package | Purpose |
|------|---------|---------|
| `Medicine.kt` | `data.model` | Medicine entity for Room database |
| `User.kt` | `data.model` | User data class |

#### DAO (Data Access Object)
| File | Package | Purpose |
|------|---------|---------|
| `MedicineDao.kt` | `data.dao` | Room DAO with database queries |

#### Database
| File | Package | Purpose |
|------|---------|---------|
| `MedicalDatabase.kt` | `data.database` | Room database configuration |

#### Repository
| File | Package | Purpose |
|------|---------|---------|
| `MedicineRepository.kt` | `data.repository` | Repository pattern implementation |

### UI Layer

#### Activities
| File | Package | Purpose |
|------|---------|---------|
| `LoginActivity.kt` | `ui.login` | Login screen with validation |
| `MainActivity.kt` | `ui.main` | Main container with navigation |

#### Fragments
| File | Package | Purpose |
|------|---------|---------|
| `DashboardFragment.kt` | `ui.dashboard` | Dashboard with stats and reminders |
| `MedicinesFragment.kt` | `ui.medicines` | Medicine list with RecyclerView |
| `AddEditMedicineFragment.kt` | `ui.medicines` | Add/Edit medicine form |
| `ProfileFragment.kt` | `ui.profile` | User profile screen |

#### Adapters
| File | Package | Purpose |
|------|---------|---------|
| `MedicineAdapter.kt` | `ui.adapters` | RecyclerView adapter for medicines |
| `ReminderAdapter.kt` | `ui.adapters` | RecyclerView adapter for reminders |

### ViewModel Layer

| File | Package | Purpose |
|------|---------|---------|
| `MedicineViewModel.kt` | `viewmodel` | ViewModel for medicine operations |

### Utility Classes

| File | Package | Purpose |
|------|---------|---------|
| `PreferenceManager.kt` | `utils` | SharedPreferences manager |
| `AlarmScheduler.kt` | `utils` | Alarm scheduling utility |
| `AlarmReceiver.kt` | `utils` | BroadcastReceiver for alarms |
| `BootReceiver.kt` | `utils` | Boot complete receiver |
| `Validator.kt` | `utils` | Input validation functions |

---

## 🎨 XML Resource Files

### Layouts

| File | Location | Purpose |
|------|----------|---------|
| `activity_login.xml` | `res/layout/` | Login screen layout |
| `activity_main.xml` | `res/layout/` | Main activity with toolbar & nav |
| `fragment_dashboard.xml` | `res/layout/` | Dashboard layout with cards |
| `fragment_medicines.xml` | `res/layout/` | Medicine list layout |
| `fragment_add_edit_medicine.xml` | `res/layout/` | Add/Edit form layout |
| `fragment_profile.xml` | `res/layout/` | Profile screen layout |
| `item_medicine.xml` | `res/layout/` | Medicine RecyclerView item |
| `item_reminder.xml` | `res/layout/` | Reminder RecyclerView item |

### Navigation

| File | Location | Purpose |
|------|----------|---------|
| `nav_graph.xml` | `res/navigation/` | Navigation graph with destinations |

### Menus

| File | Location | Purpose |
|------|----------|---------|
| `bottom_nav_menu.xml` | `res/menu/` | Bottom navigation menu items |
| `menu_main.xml` | `res/menu/` | Options menu (theme, logout) |

### Drawables (Vector Icons)

| File | Location | Purpose |
|------|----------|---------|
| `ic_email.xml` | `res/drawable/` | Email icon |
| `ic_password.xml` | `res/drawable/` | Password/lock icon |
| `ic_dashboard.xml` | `res/drawable/` | Dashboard icon |
| `ic_medicine.xml` | `res/drawable/` | Medicine/pill icon |
| `ic_profile.xml` | `res/drawable/` | Profile/user icon |
| `ic_reminder.xml` | `res/drawable/` | Clock/reminder icon |
| `ic_add.xml` | `res/drawable/` | Add/plus icon |
| `ic_edit.xml` | `res/drawable/` | Edit/pencil icon |
| `ic_delete.xml` | `res/drawable/` | Delete/trash icon |
| `ic_medical_logo.xml` | `res/drawable/` | App logo icon |
| `ic_theme.xml` | `res/drawable/` | Theme toggle icon |
| `ic_logout.xml` | `res/drawable/` | Logout icon |
| `ic_notification.xml` | `res/drawable/` | Notification bell icon |
| `circle_background.xml` | `res/drawable/` | Circle shape for profile |

### Values

| File | Location | Purpose |
|------|----------|---------|
| `strings.xml` | `res/values/` | All app strings |
| `colors.xml` | `res/values/` | Color definitions |
| `themes.xml` | `res/values/` | Light theme |
| `themes.xml` | `res/values-night/` | Dark theme |

### XML Configuration

| File | Location | Purpose |
|------|----------|---------|
| `data_extraction_rules.xml` | `res/xml/` | Data backup rules |
| `backup_rules.xml` | `res/xml/` | Backup configuration |

---

## 📖 Documentation Files

| File | Location | Purpose |
|------|----------|---------|
| `README.md` | `/` | Project overview and features |
| `SETUP_INSTRUCTIONS.md` | `/` | Detailed setup guide |
| `FILE_REFERENCE.md` | `/` | This file - complete file reference |

---

## 🗂️ Auto-Generated Files (Don't Modify)

These files are auto-generated by Android Studio:

- `/app/src/main/res/mipmap-*/` - App launcher icons
- `/app/src/main/res/values/themes.xml` - Base themes
- `/.gradle/` - Gradle cache
- `/.idea/` - Android Studio settings
- `/build/` - Build outputs
- `/app/build/` - App build outputs

---

## 📦 Total File Count

### Manual Files Created: **58 files**

**Breakdown:**
- Configuration: 3 files
- Kotlin files: 20 files
- Layout XML: 8 files
- Drawable XML: 14 files
- Menu XML: 2 files
- Navigation XML: 1 file
- Values XML: 4 files
- Other XML: 2 files
- Documentation: 3 files

---

## 🎯 Key Features by File

### Login Feature
- ✅ LoginActivity.kt
- ✅ activity_login.xml
- ✅ Validator.kt
- ✅ PreferenceManager.kt

### Dashboard Feature
- ✅ DashboardFragment.kt
- ✅ fragment_dashboard.xml
- ✅ ReminderAdapter.kt
- ✅ item_reminder.xml
- ✅ MedicineViewModel.kt

### Medicine Management
- ✅ MedicinesFragment.kt
- ✅ AddEditMedicineFragment.kt
- ✅ fragment_medicines.xml
- ✅ fragment_add_edit_medicine.xml
- ✅ MedicineAdapter.kt
- ✅ item_medicine.xml

### Database
- ✅ Medicine.kt (Entity)
- ✅ MedicineDao.kt (DAO)
- ✅ MedicalDatabase.kt (Database)
- ✅ MedicineRepository.kt (Repository)

### Reminders
- ✅ AlarmScheduler.kt
- ✅ AlarmReceiver.kt
- ✅ BootReceiver.kt
- ✅ MedicalApp.kt (Notification channel)

### Navigation
- ✅ MainActivity.kt
- ✅ nav_graph.xml
- ✅ bottom_nav_menu.xml
- ✅ activity_main.xml

### Theme
- ✅ themes.xml (Light)
- ✅ themes.xml (Dark)
- ✅ colors.xml
- ✅ PreferenceManager.kt (Theme persistence)

---

## 🔍 Where to Find Things

### Want to change...

**App Name?**
- `res/values/strings.xml` → `<string name="app_name">`

**Colors?**
- `res/values/colors.xml`
- `res/values/themes.xml`

**Login validation rules?**
- `utils/Validator.kt`

**Database schema?**
- `data/model/Medicine.kt`
- `data/dao/MedicineDao.kt`

**Notification appearance?**
- `utils/AlarmReceiver.kt` → `showNotification()`

**Navigation flow?**
- `res/navigation/nav_graph.xml`

**Bottom navigation items?**
- `res/menu/bottom_nav_menu.xml`

**Dashboard layout?**
- `res/layout/fragment_dashboard.xml`

---

## ✅ Verification Checklist

Use this to verify all files are in place:

### Gradle Files
- [ ] `/build.gradle`
- [ ] `/app/build.gradle`
- [ ] `/settings.gradle`
- [ ] `/gradle.properties`

### Manifest & App
- [ ] `/app/src/main/AndroidManifest.xml`
- [ ] `/app/src/main/java/.../MedicalApp.kt`

### Data Layer (6 files)
- [ ] Medicine.kt
- [ ] User.kt
- [ ] MedicineDao.kt
- [ ] MedicalDatabase.kt
- [ ] MedicineRepository.kt
- [ ] MedicineViewModel.kt

### UI Layer (11 files)
- [ ] LoginActivity.kt
- [ ] MainActivity.kt
- [ ] DashboardFragment.kt
- [ ] MedicinesFragment.kt
- [ ] AddEditMedicineFragment.kt
- [ ] ProfileFragment.kt
- [ ] MedicineAdapter.kt
- [ ] ReminderAdapter.kt

### Utils (5 files)
- [ ] PreferenceManager.kt
- [ ] AlarmScheduler.kt
- [ ] AlarmReceiver.kt
- [ ] BootReceiver.kt
- [ ] Validator.kt

### Layouts (8 files)
- [ ] activity_login.xml
- [ ] activity_main.xml
- [ ] fragment_dashboard.xml
- [ ] fragment_medicines.xml
- [ ] fragment_add_edit_medicine.xml
- [ ] fragment_profile.xml
- [ ] item_medicine.xml
- [ ] item_reminder.xml

### Resources (23 files)
- [ ] nav_graph.xml
- [ ] bottom_nav_menu.xml
- [ ] menu_main.xml
- [ ] 14 drawable icons
- [ ] strings.xml
- [ ] colors.xml
- [ ] themes.xml (2 files)
- [ ] data_extraction_rules.xml
- [ ] backup_rules.xml

### Documentation (3 files)
- [ ] README.md
- [ ] SETUP_INSTRUCTIONS.md
- [ ] FILE_REFERENCE.md

---

## 🚀 Quick Import Guide

### If copying into existing Android Studio project:

1. **Kotlin files** → Copy to `app/src/main/java/com/medical/dashboard/`
2. **Layout files** → Copy to `app/src/main/res/layout/`
3. **Drawable files** → Copy to `app/src/main/res/drawable/`
4. **Menu files** → Copy to `app/src/main/res/menu/`
5. **Navigation** → Copy to `app/src/main/res/navigation/`
6. **Values** → Copy to `app/src/main/res/values/` and `values-night/`
7. **XML config** → Copy to `app/src/main/res/xml/`
8. **Manifest** → Replace `app/src/main/AndroidManifest.xml`
9. **Gradle files** → Replace root and app-level `build.gradle`

---

## 📚 Learning Path

### Beginner Level
1. Start with `LoginActivity.kt` - Simple validation
2. Understand `activity_login.xml` - Basic layouts
3. Learn `Validator.kt` - Input validation
4. Study `PreferenceManager.kt` - Data persistence

### Intermediate Level
5. Explore `Medicine.kt` - Room entities
6. Study `MedicineDao.kt` - Database queries
7. Learn `MedicineRepository.kt` - Repository pattern
8. Understand `MedicineViewModel.kt` - MVVM architecture

### Advanced Level
9. Study `AlarmScheduler.kt` - Alarm management
10. Learn `nav_graph.xml` - Navigation Component
11. Explore `MainActivity.kt` - Navigation setup
12. Master theme switching system

---

**This guide covers all 58 files in the Medical Dashboard project!**
