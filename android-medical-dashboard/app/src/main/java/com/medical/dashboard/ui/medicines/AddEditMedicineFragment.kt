package com.medical.dashboard.ui.medicines

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.medical.dashboard.data.model.Medicine
import com.medical.dashboard.databinding.FragmentAddEditMedicineBinding
import com.medical.dashboard.utils.AlarmScheduler
import com.medical.dashboard.viewmodel.MedicineViewModel
import java.text.SimpleDateFormat
import java.util.*

class AddEditMedicineFragment : Fragment() {
    
    private var _binding: FragmentAddEditMedicineBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var viewModel: MedicineViewModel
    private val args: AddEditMedicineFragmentArgs by navArgs()
    
    private var selectedStartDate = ""
    private var selectedEndDate = ""
    private var selectedTime = ""
    private var isEditMode = false
    private var currentMedicine: Medicine? = null
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAddEditMedicineBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        viewModel = ViewModelProvider(this)[MedicineViewModel::class.java]
        
        isEditMode = args.medicineId != -1
        
        if (isEditMode) {
            loadMedicineData()
        }
        
        setupClickListeners()
    }
    
    private fun loadMedicineData() {
        viewModel.getMedicineById(args.medicineId) { medicine ->
            currentMedicine = medicine
            medicine?.let {
                binding.etMedicineName.setText(it.name)
                binding.etDosage.setText(it.dosage)
                binding.etFrequency.setText(it.frequency)
                binding.tvStartDate.text = it.startDate
                binding.tvEndDate.text = it.endDate
                binding.tvReminderTime.text = it.reminderTime
                binding.etNotes.setText(it.notes)
                binding.switchReminder.isChecked = it.reminderEnabled
                
                selectedStartDate = it.startDate
                selectedEndDate = it.endDate
                selectedTime = it.reminderTime
            }
        }
    }
    
    private fun setupClickListeners() {
        binding.btnStartDate.setOnClickListener {
            showDatePicker { date ->
                selectedStartDate = date
                binding.tvStartDate.text = date
            }
        }
        
        binding.btnEndDate.setOnClickListener {
            showDatePicker { date ->
                selectedEndDate = date
                binding.tvEndDate.text = date
            }
        }
        
        binding.btnReminderTime.setOnClickListener {
            showTimePicker { time ->
                selectedTime = time
                binding.tvReminderTime.text = time
            }
        }
        
        binding.btnSave.setOnClickListener {
            saveMedicine()
        }
    }
    
    private fun showDatePicker(onDateSelected: (String) -> Unit) {
        val calendar = Calendar.getInstance()
        DatePickerDialog(
            requireContext(),
            { _, year, month, dayOfMonth ->
                calendar.set(year, month, dayOfMonth)
                val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
                onDateSelected(dateFormat.format(calendar.time))
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        ).show()
    }
    
    private fun showTimePicker(onTimeSelected: (String) -> Unit) {
        val calendar = Calendar.getInstance()
        TimePickerDialog(
            requireContext(),
            { _, hourOfDay, minute ->
                val time = String.format("%02d:%02d", hourOfDay, minute)
                onTimeSelected(time)
            },
            calendar.get(Calendar.HOUR_OF_DAY),
            calendar.get(Calendar.MINUTE),
            true
        ).show()
    }
    
    private fun saveMedicine() {
        val name = binding.etMedicineName.text.toString().trim()
        val dosage = binding.etDosage.text.toString().trim()
        val frequency = binding.etFrequency.text.toString().trim()
        val notes = binding.etNotes.text.toString().trim()
        val reminderEnabled = binding.switchReminder.isChecked
        
        // Validation
        if (name.isEmpty()) {
            binding.tilMedicineName.error = "Medicine name is required"
            return
        }
        
        if (dosage.isEmpty()) {
            binding.tilDosage.error = "Dosage is required"
            return
        }
        
        if (frequency.isEmpty()) {
            binding.tilFrequency.error = "Frequency is required"
            return
        }
        
        if (selectedStartDate.isEmpty()) {
            Toast.makeText(requireContext(), "Please select start date", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (selectedEndDate.isEmpty()) {
            Toast.makeText(requireContext(), "Please select end date", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (selectedTime.isEmpty()) {
            Toast.makeText(requireContext(), "Please select reminder time", Toast.LENGTH_SHORT).show()
            return
        }
        
        val medicine = Medicine(
            id = if (isEditMode) currentMedicine?.id ?: 0 else 0,
            name = name,
            dosage = dosage,
            frequency = frequency,
            startDate = selectedStartDate,
            endDate = selectedEndDate,
            reminderTime = selectedTime,
            notes = notes,
            reminderEnabled = reminderEnabled
        )
        
        if (isEditMode) {
            viewModel.update(medicine) {
                if (reminderEnabled) {
                    AlarmScheduler.scheduleAlarm(requireContext(), medicine.id, medicine.name, medicine.reminderTime)
                } else {
                    AlarmScheduler.cancelAlarm(requireContext(), medicine.id)
                }
                Toast.makeText(requireContext(), "Medicine updated successfully", Toast.LENGTH_SHORT).show()
                findNavController().navigateUp()
            }
        } else {
            viewModel.insert(medicine) { id ->
                if (reminderEnabled) {
                    AlarmScheduler.scheduleAlarm(requireContext(), id.toInt(), medicine.name, medicine.reminderTime)
                }
                Toast.makeText(requireContext(), "Medicine added successfully", Toast.LENGTH_SHORT).show()
                findNavController().navigateUp()
            }
        }
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
