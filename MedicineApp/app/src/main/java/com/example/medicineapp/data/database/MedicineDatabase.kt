package com.example.medicineapp.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.medicineapp.data.dao.MedicineDao
import com.example.medicineapp.data.model.Medicine

@Database(entities = [Medicine::class], version = 1, exportSchema = false)
abstract class MedicineDatabase : RoomDatabase() {
    
    abstract fun medicineDao(): MedicineDao
    
    companion object {
        @Volatile
        private var INSTANCE: MedicineDatabase? = null
        
        fun getDatabase(context: Context): MedicineDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    MedicineDatabase::class.java,
                    "medicine_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
