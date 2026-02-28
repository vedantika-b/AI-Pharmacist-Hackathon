package com.example.medicineapp

import android.app.Application

class MedicineApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        instance = this
    }
    
    companion object {
        private lateinit var instance: MedicineApplication
        
        fun getInstance(): MedicineApplication {
            return instance
        }
    }
}
