@echo off
echo Cleaning Gradle Cache for MedicineApp...
echo.

echo Step 1: Cleaning project build folders...
cd /d "%~dp0"
if exist "build" (
    echo Deleting build folder...
    rmdir /s /q "build"
)
if exist "app\build" (
    echo Deleting app\build folder...
    rmdir /s /q "app\build"
)
if exist ".gradle" (
    echo Deleting .gradle folder...
    rmdir /s /q ".gradle"
)

echo.
echo Step 2: Cleaning Gradle user cache...
if exist "%USERPROFILE%\.gradle\caches" (
    echo Deleting Gradle caches...
    rmdir /s /q "%USERPROFILE%\.gradle\caches"
)

echo.
echo ✓ Gradle cache cleaned successfully!
echo.
echo Next steps:
echo 1. Close Android Studio
echo 2. Open Android Studio again
echo 3. Open this project
echo 4. Let Gradle sync automatically
echo.
pause
