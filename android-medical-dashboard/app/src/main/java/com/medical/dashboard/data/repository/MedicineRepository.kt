package com.medical.dashboard.data.repository

import androidx.lifecycle.LiveData
import com.medical.dashboard.data.dao.MedicineDao
import com.medical.dashboard.data.model.Medicine

class MedicineRepository(private val medicineDao: MedicineDao) {
    
    val allMedicines: LiveData<List<Medicine>> = medicineDao.getAllMedicines()
    val medicineCount: LiveData<Int> = medicineDao.getMedicineCount()
    val upcomingReminders: LiveData<List<Medicine>> = medicineDao.getUpcomingReminders()
    
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
    
    suspend fun deactivate(medicineId: Int) {
        medicineDao.deactivateMedicine(medicineId)
    }
}
