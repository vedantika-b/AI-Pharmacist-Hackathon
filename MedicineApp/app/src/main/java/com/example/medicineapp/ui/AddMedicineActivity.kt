package com.example.medicineapp.ui

import android.app.TimePickerDialog
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.example.medicineapp.data.model.Medicine
import com.example.medicineapp.databinding.ActivityAddMedicineBinding
import com.example.medicineapp.utils.Validator
import com.example.medicineapp.viewmodel.MedicineViewModel
import java.util.*

class AddMedicineActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityAddMedicineBinding
    private lateinit var viewModel: MedicineViewModel
    
    private var selectedTime = ""
    private var isEditMode = false
    private var medicineId = -1
    private var currentMedicine: Medicine? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddMedicineBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        viewModel = ViewModelProvider(this)[MedicineViewModel::class.java]
        
        // Check if editing existing medicine
        medicineId = intent.getIntExtra("MEDICINE_ID", -1)
        isEditMode = medicineId != -1
        
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = if (isEditMode) "Edit Medicine" else "Add Medicine"
        
        if (isEditMode) {
            loadMedicineData()
        }
        
        setupClickListeners()
    }
    
    private fun loadMedicineData() {
        viewModel.getMedicineById(medicineId) { medicine ->
            currentMedicine = medicine
            medicine?.let {
                binding.etMedicineName.setText(it.name)
                binding.tvSelectedTime.text = it.time
                selectedTime = it.time
                binding.btnSave.text = "Update Medicine"
            }
        }
    }
    
    private fun setupClickListeners() {
        binding.btnSelectTime.setOnClickListener {
            showTimePicker()
        }
        
        binding.btnSave.setOnClickListener {
            saveMedicine()
        }
    }
    
    private fun showTimePicker() {
        val calendar = Calendar.getInstance()
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val minute = calendar.get(Calendar.MINUTE)
        
        TimePickerDialog(
            this,
            { _, selectedHour, selectedMinute ->
                selectedTime = String.format("%02d:%02d", selectedHour, selectedMinute)
                binding.tvSelectedTime.text = selectedTime
            },
            hour,
            minute,
            true
        ).show()
    }
    
    private fun saveMedicine() {
        val name = binding.etMedicineName.text.toString().trim()
        
        // Validation
        binding.tilMedicineName.error = null
        
        if (!Validator.isValidMedicineName(name)) {
            binding.tilMedicineName.error = "Medicine name is required (min 2 characters)"
            return
        }
        
        if (selectedTime.isEmpty()) {
            Toast.makeText(this, "Please select time", Toast.LENGTH_SHORT).show()
            return
        }
        
        val medicine = Medicine(
            id = if (isEditMode) medicineId else 0,
            name = name,
            time = selectedTime
        )
        
        if (isEditMode) {
            viewModel.update(medicine) {
                Toast.makeText(this, "Medicine updated successfully", Toast.LENGTH_SHORT).show()
                finish()
            }
        } else {
            viewModel.insert(medicine) {
                Toast.makeText(this, "Medicine added successfully", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }
    
    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}
