package com.medical.dashboard.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.viewModelScope
import com.medical.dashboard.data.database.MedicalDatabase
import com.medical.dashboard.data.model.Medicine
import com.medical.dashboard.data.repository.MedicineRepository
import kotlinx.coroutines.launch

class MedicineViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository: MedicineRepository
    val allMedicines: LiveData<List<Medicine>>
    val medicineCount: LiveData<Int>
    val upcomingReminders: LiveData<List<Medicine>>
    
    init {
        val medicineDao = MedicalDatabase.getDatabase(application).medicineDao()
        repository = MedicineRepository(medicineDao)
        allMedicines = repository.allMedicines
        medicineCount = repository.medicineCount
        upcomingReminders = repository.upcomingReminders
    }
    
    fun insert(medicine: Medicine, onResult: (Long) -> Unit) = viewModelScope.launch {
        val id = repository.insert(medicine)
        onResult(id)
    }
    
    fun update(medicine: Medicine, onResult: () -> Unit) = viewModelScope.launch {
        repository.update(medicine)
        onResult()
    }
    
    fun delete(medicine: Medicine, onResult: () -> Unit) = viewModelScope.launch {
        repository.delete(medicine)
        onResult()
    }
    
    fun getMedicineById(id: Int, onResult: (Medicine?) -> Unit) = viewModelScope.launch {
        val medicine = repository.getMedicineById(id)
        onResult(medicine)
    }
}
