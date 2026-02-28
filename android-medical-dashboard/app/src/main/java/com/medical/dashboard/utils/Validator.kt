package com.medical.dashboard.utils

object Validator {
    
    fun isValidEmail(email: String): Boolean {
        val emailPattern = "[a-zA-Z0-9._-]+@[a-z]+\\.+[a-z]+"
        return email.matches(emailPattern.toRegex())
    }
    
    fun isValidPassword(password: String): Boolean {
        return password.length >= 6
    }
    
    fun isValidName(name: String): Boolean {
        return name.isNotBlank() && name.length >= 2
    }
}
