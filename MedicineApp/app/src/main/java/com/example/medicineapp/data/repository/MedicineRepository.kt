package com.example.medicineapp.data.repository

import androidx.lifecycle.LiveData
import com.example.medicineapp.data.dao.MedicineDao
import com.example.medicineapp.data.model.Medicine

class MedicineRepository(private val medicineDao: MedicineDao) {
    
    val allMedicines: LiveData<List<Medicine>> = medicineDao.getAllMedicines()
    val medicineCount: LiveData<Int> = medicineDao.getMedicineCount()
    
    suspend fun getMedicineById(id: Int): Medicine? {
        return medicineDao.getMedicineById(id)
    }
    
    suspend fun insert(medicine: Medicine): Long {
        return medicineDao.insertMedicine(medicine)
    }
    
    suspend fun update(medicine: Medicine) {
        medicineDao.updateMedicine(medicine)
    }
    
    suspend fun delete(medicine: Medicine) {
        medicineDao.deleteMedicine(medicine)
    }
    
    suspend fun deleteAll() {
        medicineDao.deleteAllMedicines()
    }
}
