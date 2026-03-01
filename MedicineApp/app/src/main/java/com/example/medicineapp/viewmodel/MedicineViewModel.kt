package com.example.medicineapp.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.viewModelScope
import com.example.medicineapp.data.database.MedicineDatabase
import com.example.medicineapp.data.model.Medicine
import com.example.medicineapp.data.repository.MedicineRepository
import kotlinx.coroutines.launch

class MedicineViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository: MedicineRepository
    val allMedicines: LiveData<List<Medicine>>
    val medicineCount: LiveData<Int>
    
    init {
        val medicineDao = MedicineDatabase.getDatabase(application).medicineDao()
        repository = MedicineRepository(medicineDao)
        allMedicines = repository.allMedicines
        medicineCount = repository.medicineCount
    }
    
    fun insert(medicine: Medicine, onSuccess: () -> Unit) = viewModelScope.launch {
        repository.insert(medicine)
        onSuccess()
    }
    
    fun update(medicine: Medicine, onSuccess: () -> Unit) = viewModelScope.launch {
        repository.update(medicine)
        onSuccess()
    }
    
    fun delete(medicine: Medicine, onSuccess: () -> Unit) = viewModelScope.launch {
        repository.delete(medicine)
        onSuccess()
    }
    
    fun getMedicineById(id: Int, onResult: (Medicine?) -> Unit) = viewModelScope.launch {
        val medicine = repository.getMedicineById(id)
        onResult(medicine)
    }
}
