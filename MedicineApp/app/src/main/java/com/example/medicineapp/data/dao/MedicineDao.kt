package com.example.medicineapp.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.example.medicineapp.data.model.Medicine

@Dao
interface MedicineDao {
    
    @Query("SELECT * FROM medicines ORDER BY createdAt DESC")
    fun getAllMedicines(): LiveData<List<Medicine>>
    
    @Query("SELECT COUNT(*) FROM medicines")
    fun getMedicineCount(): LiveData<Int>
    
    @Query("SELECT * FROM medicines WHERE id = :medicineId")
    suspend fun getMedicineById(medicineId: Int): Medicine?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMedicine(medicine: Medicine): Long
    
    @Update
    suspend fun updateMedicine(medicine: Medicine)
    
    @Delete
    suspend fun deleteMedicine(medicine: Medicine)
    
    @Query("DELETE FROM medicines")
    suspend fun deleteAllMedicines()
}
