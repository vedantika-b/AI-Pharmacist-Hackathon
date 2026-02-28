package com.medical.dashboard.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "medicines")
data class Medicine(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val name: String,
    val dosage: String,
    val frequency: String,
    val startDate: String,
    val endDate: String,
    val reminderTime: String,
    val notes: String = "",
    val isActive: Boolean = true,
    val reminderEnabled: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)
