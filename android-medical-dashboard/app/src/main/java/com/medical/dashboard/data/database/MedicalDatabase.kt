package com.medical.dashboard.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.medical.dashboard.data.dao.MedicineDao
import com.medical.dashboard.data.model.Medicine

@Database(entities = [Medicine::class], version = 1, exportSchema = false)
abstract class MedicalDatabase : RoomDatabase() {
    
    abstract fun medicineDao(): MedicineDao
    
    companion object {
        @Volatile
        private var INSTANCE: MedicalDatabase? = null
        
        fun getDatabase(context: Context): MedicalDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    MedicalDatabase::class.java,
                    "medical_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
