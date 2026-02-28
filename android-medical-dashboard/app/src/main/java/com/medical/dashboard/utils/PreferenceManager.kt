package com.medical.dashboard.utils

import android.content.Context
import android.content.SharedPreferences

class PreferenceManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    fun saveUserInfo(email: String, name: String) {
        prefs.edit().apply {
            putString(KEY_EMAIL, email)
            putString(KEY_NAME, name)
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
    }
    
    fun getUserName(): String {
        return prefs.getString(KEY_NAME, "User") ?: "User"
    }
    
    fun getUserEmail(): String {
        return prefs.getString(KEY_EMAIL, "") ?: ""
    }
    
    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false)
    }
    
    fun logout() {
        prefs.edit().clear().apply()
    }
    
    fun setThemeMode(isDarkMode: Boolean) {
        prefs.edit().putBoolean(KEY_THEME_MODE, isDarkMode).apply()
    }
    
    fun isDarkMode(): Boolean {
        return prefs.getBoolean(KEY_THEME_MODE, false)
    }
    
    companion object {
        private const val PREFS_NAME = "medical_dashboard_prefs"
        private const val KEY_EMAIL = "email"
        private const val KEY_NAME = "name"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val KEY_THEME_MODE = "theme_mode"
    }
}
