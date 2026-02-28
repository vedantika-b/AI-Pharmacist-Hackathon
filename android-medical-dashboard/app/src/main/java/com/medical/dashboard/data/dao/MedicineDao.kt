package com.medical.dashboard.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.medical.dashboard.data.model.Medicine

@Dao
interface MedicineDao {
    
    @Query("SELECT * FROM medicines WHERE isActive = 1 ORDER BY createdAt DESC")
    fun getAllMedicines(): LiveData<List<Medicine>>
    
    @Query("SELECT * FROM medicines WHERE id = :medicineId")
    suspend fun getMedicineById(medicineId: Int): Medicine?
    
    @Query("SELECT COUNT(*) FROM medicines WHERE isActive = 1")
    fun getMedicineCount(): LiveData<Int>
    
    @Query("SELECT * FROM medicines WHERE isActive = 1 AND reminderEnabled = 1 ORDER BY reminderTime ASC LIMIT 5")
    fun getUpcomingReminders(): LiveData<List<Medicine>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMedicine(medicine: Medicine): Long
    
    @Update
    suspend fun updateMedicine(medicine: Medicine)
    
    @Delete
    suspend fun deleteMedicine(medicine: Medicine)
    
    @Query("UPDATE medicines SET isActive = 0 WHERE id = :medicineId")
    suspend fun deactivateMedicine(medicineId: Int)
    
    @Query("DELETE FROM medicines")
    suspend fun deleteAllMedicines()
}
