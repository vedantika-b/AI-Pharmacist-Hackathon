package com.example.medicineapp.ui

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.medicineapp.R
import com.example.medicineapp.databinding.ActivityDashboardBinding
import com.example.medicineapp.ui.adapter.MedicineAdapter
import com.example.medicineapp.utils.PreferenceManager
import com.example.medicineapp.viewmodel.MedicineViewModel

class DashboardActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityDashboardBinding
    private lateinit var viewModel: MedicineViewModel
    private lateinit var preferenceManager: PreferenceManager
    private lateinit var medicineAdapter: MedicineAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        preferenceManager = PreferenceManager(this)
        viewModel = ViewModelProvider(this)[MedicineViewModel::class.java]
        
        // Apply saved theme
        applyTheme()
        
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Medicine Dashboard"
        
        setupUI()
        observeData()
        setupClickListeners()
    }
    
    private fun setupUI() {
        // Set welcome message
        val userName = preferenceManager.getUserName()
        binding.tvWelcome.text = "Welcome, $userName!"
        
        // Setup RecyclerView
        medicineAdapter = MedicineAdapter(
            onEditClick = { medicine ->
                val intent = Intent(this, AddMedicineActivity::class.java)
                intent.putExtra("MEDICINE_ID", medicine.id)
                startActivity(intent)
            },
            onDeleteClick = { medicine ->
                viewModel.delete(medicine) {
                    Toast.makeText(this, "Medicine deleted", Toast.LENGTH_SHORT).show()
                }
            }
        )
        
        binding.rvMedicines.apply {
            layoutManager = LinearLayoutManager(this@DashboardActivity)
            adapter = medicineAdapter
        }
    }
    
    private fun observeData() {
        // Observe medicine count
        viewModel.medicineCount.observe(this) { count ->
            binding.tvMedicineCount.text = count?.toString() ?: "0"
        }
        
        // Observe medicines list
        viewModel.allMedicines.observe(this) { medicines ->
            medicineAdapter.submitList(medicines)
            
            // Show/hide empty state
            if (medicines.isEmpty()) {
                binding.rvMedicines.visibility = View.GONE
                binding.tvEmptyState.visibility = View.VISIBLE
            } else {
                binding.rvMedicines.visibility = View.VISIBLE
                binding.tvEmptyState.visibility = View.GONE
            }
        }
    }
    
    private fun setupClickListeners() {
        binding.btnAddMedicine.setOnClickListener {
            val intent = Intent(this, AddMedicineActivity::class.java)
            startActivity(intent)
        }
    }
    
    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu_dashboard, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_theme -> {
                toggleTheme()
                true
            }
            R.id.action_logout -> {
                logout()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun toggleTheme() {
        val isDarkMode = !preferenceManager.isDarkMode()
        preferenceManager.setDarkMode(isDarkMode)
        applyTheme()
    }
    
    private fun applyTheme() {
        val mode = if (preferenceManager.isDarkMode()) {
            AppCompatDelegate.MODE_NIGHT_YES
        } else {
            AppCompatDelegate.MODE_NIGHT_NO
        }
        AppCompatDelegate.setDefaultNightMode(mode)
    }
    
    private fun logout() {
        preferenceManager.logout()
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
