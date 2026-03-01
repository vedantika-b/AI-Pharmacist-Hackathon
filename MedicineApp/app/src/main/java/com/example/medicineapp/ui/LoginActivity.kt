package com.example.medicineapp.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.medicineapp.databinding.ActivityLoginBinding
import com.example.medicineapp.utils.PreferenceManager
import com.example.medicineapp.utils.Validator

class LoginActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLoginBinding
    private lateinit var preferenceManager: PreferenceManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        preferenceManager = PreferenceManager(this)
        
        // Check if already logged in
        if (preferenceManager.isLoggedIn()) {
            navigateToDashboard()
            return
        }
        
        setupClickListeners()
    }
    
    private fun setupClickListeners() {
        binding.btnLogin.setOnClickListener {
            validateAndLogin()
        }
    }
    
    private fun validateAndLogin() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString()
        
        // Reset errors
        binding.tilEmail.error = null
        binding.tilPassword.error = null
        
        var isValid = true
        
        if (email.isEmpty()) {
            binding.tilEmail.error = "Email is required"
            isValid = false
        } else if (!Validator.isValidEmail(email)) {
            binding.tilEmail.error = "Invalid email format"
            isValid = false
        }
        
        if (password.isEmpty()) {
            binding.tilPassword.error = "Password is required"
            isValid = false
        } else if (!Validator.isValidPassword(password)) {
            binding.tilPassword.error = "Password must be at least 6 characters"
            isValid = false
        }
        
        if (isValid) {
            performLogin(email, password)
        }
    }
    
    private fun performLogin(email: String, password: String) {
        // For demo purposes - accept any valid email/password
        val name = email.substringBefore("@").replaceFirstChar { it.uppercase() }
        
        preferenceManager.saveLoginInfo(email, name)
        Toast.makeText(this, "Login successful!", Toast.LENGTH_SHORT).show()
        navigateToDashboard()
    }
    
    private fun navigateToDashboard() {
        val intent = Intent(this, DashboardActivity::class.java)
        startActivity(intent)
        finish()
    }
}
