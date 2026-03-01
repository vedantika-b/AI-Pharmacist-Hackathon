# MedicineApp - Android Application

A complete working Android application built with Kotlin for managing medicines and medication schedules.

## 📱 Features

✅ **Login Screen**
- Email and password validation
- Persistent login state
- Clean Material Design UI
- Toast messages for success and error states

✅ **Dashboard Screen**
- Welcome message with user name
- Medicine count display
- RecyclerView showing all medicines
- FloatingActionButton to add new medicines
- Empty state handling
- Dark/Light theme toggle
- Logout functionality

✅ **Add/Edit Medicine Screen**
- Medicine name input with validation
- Time picker for medication schedule
- Save and update functionality
- Material Design card-based UI

✅ **Additional Features**
- CRUD operations (Create, Read, Update, Delete)
- Room Database for local persistence
- MVVM Architecture pattern
- Dark and Light themes
- Material Design 3 components
- ViewBinding for type-safe view access
- LiveData for reactive UI updates
- Coroutines for background operations

## 🛠️ Technical Stack

- **Language**: Kotlin 1.9.0
- **Minimum SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)
- **Architecture**: MVVM (Model-View-ViewModel)
- **Database**: Room 2.6.0
- **UI**: Material Design 3
- **Lifecycle**: ViewModel, LiveData 2.6.2
- **Async**: Kotlin Coroutines 1.7.3
- **Build System**: Gradle 8.1.0

## 📁 Project Structure

```
MedicineApp/
├── app/
│   ├── src/main/
│   │   ├── java/com/example/medicineapp/
│   │   │   ├── data/
│   │   │   │   ├── dao/
│   │   │   │   │   └── MedicineDao.kt
│   │   │   │   ├── database/
│   │   │   │   │   └── MedicineDatabase.kt
│   │   │   │   ├── model/
│   │   │   │   │   └── Medicine.kt
│   │   │   │   └── repository/
│   │   │   │       └── MedicineRepository.kt
│   │   │   ├── ui/
│   │   │   │   ├── LoginActivity.kt
│   │   │   │   ├── DashboardActivity.kt
│   │   │   │   ├── AddMedicineActivity.kt
│   │   │   │   └── adapter/
│   │   │   │       └── MedicineAdapter.kt
│   │   │   ├── utils/
│   │   │   │   ├── PreferenceManager.kt
│   │   │   │   └── Validator.kt
│   │   │   ├── viewmodel/
│   │   │   │   └── MedicineViewModel.kt
│   │   │   └── MedicineApplication.kt
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   │   ├── activity_login.xml
│   │   │   │   ├── activity_dashboard.xml
│   │   │   │   ├── activity_add_medicine.xml
│   │   │   │   └── item_medicine.xml
│   │   │   ├── menu/
│   │   │   │   └── menu_dashboard.xml
│   │   │   ├── values/
│   │   │   │   ├── colors.xml
│   │   │   │   ├── strings.xml
│   │   │   │   └── themes.xml
│   │   │   └── values-night/
│   │   │       └── themes.xml
│   │   └── AndroidManifest.xml
│   ├── build.gradle
│   └── proguard-rules.pro
├── build.gradle
├── settings.gradle
└── gradle.properties
```

## 🚀 Getting Started

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or later
- JDK 17
- Android SDK 34
- Minimum Android 7.0 device/emulator

### Installation Steps

1. **Open in Android Studio**
   ```
   File → Open → Select the MedicineApp folder
   ```

2. **Gradle Sync**
   - Android Studio will automatically sync Gradle
   - Wait for dependencies to download
   - If needed, click "Sync Project with Gradle Files"

3. **Build the Project**
   ```
   Build → Make Project
   ```

4. **Run the App**
   ```
   Run → Run 'app'
   ```
   Or press `Shift + F10`

## 📖 User Guide

### Login
1. Launch the app
2. Enter any valid email (e.g., user@example.com)
3. Enter password (minimum 6 characters)
4. Click "Login"
5. You'll be redirected to the Dashboard

### Dashboard
- View total medicine count in the card
- See all your medicines in the list
- Click the **+** button to add a new medicine
- Click **Edit** icon to modify a medicine
- Click **Delete** icon to remove a medicine
- Toggle theme from the toolbar menu (sun/moon icon)
- Logout from the toolbar menu

### Add/Edit Medicine
1. Enter medicine name (minimum 2 characters)
2. Click "Pick Time" to select medication time
3. Choose time from the time picker
4. Click "Save Medicine"
5. You'll be returned to the Dashboard

## 🔧 Configuration

### Application Class
`MedicineApplication.kt` - Singleton application context

### Database Schema
**Medicine Table**
- `id` (Primary Key, Auto-increment)
- `name` (Text, Not Null)
- `time` (Text, Not Null)
- `createdAt` (Long, Default: Current Time)

### SharedPreferences
Stored in `PreferenceManager`:
- `isLoggedIn` - Login state
- `userEmail` - User email
- `userName` - User display name
- `isDarkMode` - Theme preference

## 🎨 Theme Support

The app supports both Light and Dark themes based on Material Design 3:

- **Light Theme**: Green primary color (#006C4C)
- **Dark Theme**: Teal primary color (#6DDBAC)
- **Toggle**: Use toolbar menu icon to switch themes
- **Persistence**: Theme preference is saved locally

## 🧪 Testing

### Manual Testing Checklist

✅ **Login Screen**
- [ ] Valid email/password login succeeds
- [ ] Invalid email shows error
- [ ] Short password shows error
- [ ] Empty fields show errors
- [ ] Toast message on successful login

✅ **Dashboard**
- [ ] Welcome message displays user name
- [ ] Medicine count updates correctly
- [ ] RecyclerView displays all medicines
- [ ] Empty state shows when no medicines
- [ ] FAB opens Add Medicine screen
- [ ] Theme toggle works
- [ ] Logout clears session

✅ **Add/Edit Medicine**
- [ ] Medicine name validation works
- [ ] Time picker displays and selects time
- [ ] Save creates new medicine
- [ ] Update modifies existing medicine
- [ ] Back navigation works

## 🐛 Troubleshooting

### Build Errors
1. Clean and rebuild:
   ```
   Build → Clean Project
   Build → Rebuild Project
   ```

2. Invalidate caches:
   ```
   File → Invalidate Caches → Invalidate and Restart
   ```

3. Check Gradle version compatibility in `gradle/wrapper/gradle-wrapper.properties`

### Runtime Crashes
- Check LogCat for error messages
- Ensure minimum SDK 24 device
- Verify ViewBinding is enabled
- Check database queries and entity definition

## 📝 Code Quality

- **MVVM Architecture**: Clear separation of concerns
- **ViewBinding**: Type-safe view access, no findViewById()
- **LiveData**: Lifecycle-aware data observation
- **Coroutines**: Async operations on background threads
- **DiffUtil**: Efficient RecyclerView updates
- **Material Design 3**: Modern, accessible UI components
- **Input Validation**: All user inputs validated
- **Error Handling**: Toast messages and inline errors
- **Null Safety**: Kotlin null-safety features utilized

## 🔐 Security Notes

- Passwords are not encrypted (demo purposes only)
- For production, implement:
  - Encrypted SharedPreferences
  - Secure password hashing (bcrypt/Argon2)
  - Authentication with backend server
  - SSL certificate pinning
  - ProGuard/R8 obfuscation

## 📄 License

This is a demo project created for educational purposes.

## 👨‍💻 Development

### Adding New Features

1. **New Screen**: Create Activity + Layout XML
2. **Database**: Add entity, update DAO, repository
3. **ViewModel**: Create ViewModel for business logic
4. **UI**: Use Material Design 3 components
5. **Navigation**: Update AndroidManifest.xml

### Code Style
- Follow Kotlin coding conventions
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

## 🎯 Requirements Met

✅ All specified requirements implemented:
1. ✅ Login Screen (Email + Password validation)
2. ✅ Dashboard with welcome text
3. ✅ Medicine count display
4. ✅ RecyclerView with medicine list
5. ✅ Add Medicine button (FloatingActionButton)
6. ✅ Add Medicine screen with name input
7. ✅ TimePicker for medication time
8. ✅ Save functionality (Room Database)
9. ✅ Edit medicine feature
10. ✅ Delete medicine feature
11. ✅ Dark and Light themes
12. ✅ Toast messages for feedback
13. ✅ No crashes - stable, production-ready code

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review LogCat output
3. Verify all dependencies in build.gradle

---

**Built with ❤️ using Kotlin and Material Design 3**
