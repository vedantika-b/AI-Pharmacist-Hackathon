# Medical Dashboard - Android Application

A comprehensive medical dashboard Android app built with Kotlin, following MVVM architecture and Material Design principles.

## 📱 Features

✅ **Login System** with validation  
✅ **Interactive Dashboard** with medicine count and upcoming reminders  
✅ **Medicine Management** (CRUD operations)  
✅ **Reminder Notifications** using AlarmManager  
✅ **Navigation Component** for seamless navigation  
✅ **Room Database** for local data storage  
✅ **MVVM Architecture** for clean code  
✅ **Dark Theme Support**  
✅ **Material Design UI**  
✅ **ViewBinding** for type-safe view access  
✅ **LiveData & ViewModel** for reactive UI  

---

## 🔧 Tech Stack

- **Language**: Kotlin
- **UI**: Material Design Components
- **Architecture**: MVVM (Model-View-ViewModel)
- **Database**: Room Database
- **Navigation**: Navigation Component
- **Async**: Kotlin Coroutines
- **Notifications**: AlarmManager & NotificationCompat
- **Minimum SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)

---

## 📂 Project Structure

```
app/src/main/
├── java/com/medical/dashboard/
│   ├── MedicalApp.kt                 # Application class
│   ├── data/
│   │   ├── model/                    # Data models
│   │   ├── dao/                      # Room DAO
│   │   ├── database/                 # Room Database
│   │   └── repository/               # Repository pattern
│   ├── ui/
│   │   ├── login/                    # Login screen
│   │   ├── main/                     # Main activity
│   │   ├── dashboard/                # Dashboard fragment
│   │   ├── medicines/                # Medicine management
│   │   ├── profile/                  # User profile
│   │   └── adapters/                 # RecyclerView adapters
│   ├── viewmodel/                    # ViewModels
│   └── utils/                        # Utility classes
└── res/
    ├── layout/                       # XML layouts
    ├── navigation/                   # Navigation graph
    ├── menu/                         # Menu resources
    ├── drawable/                     # Vector icons
    └── values/                       # Strings, colors, themes
```

---

## 🚀 Setup & Installation

See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for detailed setup guide.

### Quick Start

1. Clone/download the project
2. Open in Android Studio Hedgehog or newer
3. Sync Gradle
4. Run on device/emulator (API 24+)

---

## 📸 Screenshots

### Login Screen
- Email and password validation
- Material Design input fields
- Error handling

### Dashboard
- Welcome message with user name
- Total medicines count
- Upcoming reminders count
- List of next 5 reminders

### Medicine Management
- RecyclerView list of medicines
- Add/Edit/Delete operations
- Date and time pickers
- Enable/disable reminders

### Profile
- User information display
- App information
- Logout option

---

## 🔐 Permissions

- `POST_NOTIFICATIONS` - Show reminder notifications
- `SCHEDULE_EXACT_ALARM` - Schedule exact alarms
- `RECEIVE_BOOT_COMPLETED` - Reschedule after reboot

---

## 🎨 Features Breakdown

### 1. Login System
- Email validation (regex pattern)
- Password validation (min 6 chars)
- Auto-login with SharedPreferences
- Material TextInputLayouts with error handling

### 2. Dashboard
- Real-time medicine count (LiveData)
- Upcoming reminders display
- Material Cards with proper elevation
- Welcome message personalization

### 3. Medicine Management
- Add new medicines with form validation
- Edit existing medicines
- Delete medicines with confirmation
- RecyclerView with DiffUtil
- FloatingActionButton for adding

### 4. Reminders
- Date picker for start/end dates
- Time picker for reminder time
- AlarmManager for scheduling
- Notification with custom sound
- Enable/disable per medicine

### 5. Database
- Room Database with DAO
- LiveData queries for reactive UI
- Singleton pattern
- Migration support

### 6. Navigation
- Navigation Component
- Bottom Navigation View
- Safe Args for type-safe navigation
- Proper back stack management

### 7. Theme Support
- Light and Dark themes
- Material Design 3
- Smooth theme transitions
- Persistent theme preference

---

## 📝 Code Quality

✅ **MVVM Architecture** - Separation of concerns  
✅ **Repository Pattern** - Single source of truth  
✅ **LiveData** - Lifecycle-aware observables  
✅ **ViewBinding** - Type-safe view access  
✅ **Coroutines** - Structured concurrency  
✅ **DiffUtil** - Efficient RecyclerView updates  
✅ **Null Safety** - Kotlin null safety features  
✅ **Error Handling** - Try-catch blocks and validation  

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login with valid/invalid credentials
- [ ] Add medicine with all fields
- [ ] Edit medicine details
- [ ] Delete medicine
- [ ] View dashboard stats
- [ ] Receive notification at scheduled time
- [ ] Toggle dark/light theme
- [ ] Logout and re-login
- [ ] Test on different screen sizes
- [ ] Test on Android 7.0 - 14

---

## 📦 Dependencies

```gradle
// Core
implementation 'androidx.core:core-ktx:1.12.0'
implementation 'androidx.appcompat:appcompat:1.6.1'

// Material Design
implementation 'com.google.android.material:material:1.10.0'

// Navigation
implementation 'androidx.navigation:navigation-fragment-ktx:2.7.5'
implementation 'androidx.navigation:navigation-ui-ktx:2.7.5'

// Room Database
implementation 'androidx.room:room-runtime:2.6.0'
implementation 'androidx.room:room-ktx:2.6.0'
kapt 'androidx.room:room-compiler:2.6.0'

// ViewModel & LiveData
implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2'
implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.6.2'

// Coroutines
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
```

---

## 🐛 Known Issues

- None currently reported

---

## 🔄 Version History

- **v1.0** - Initial release
  - Login system
  - Dashboard
  - Medicine management
  - Reminder notifications
  - Dark theme support

---

## 👨‍💻 Development

### Building from Source

```bash
# Clone the repository
git clone <repository-url>

# Open in Android Studio
# File → Open → Select project folder

# Sync Gradle
# Build → Make Project

# Run
# Select device/emulator → Run 'app'
```

---

## 🤝 Contributing

This is a demonstration project. Feel free to:
- Fork the project
- Make improvements
- Submit pull requests

---

## 📄 License

Educational/Demo Project - Free to use and modify

---

## 📧 Contact

For questions or support, refer to SETUP_INSTRUCTIONS.md

---

## 🎯 Learning Outcomes

This project demonstrates:
- Modern Android development with Kotlin
- MVVM architecture implementation
- Room Database integration
- Navigation Component usage
- Material Design guidelines
- Notification scheduling
- Theme switching
- ViewBinding usage
- LiveData & ViewModel
- Repository pattern
- Coroutines for async operations

---

**Made with ❤️ using Kotlin and Android Studio**
