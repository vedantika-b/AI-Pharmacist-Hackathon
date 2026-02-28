package com.medical.dashboard.utils

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.medical.dashboard.MedicalApp
import com.medical.dashboard.R
import com.medical.dashboard.ui.main.MainActivity

class AlarmReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        val medicineId = intent.getIntExtra("medicine_id", 0)
        val medicineName = intent.getStringExtra("medicine_name") ?: "Medicine"
        
        showNotification(context, medicineId, medicineName)
    }
    
    private fun showNotification(context: Context, medicineId: Int, medicineName: String) {
        val notificationIntent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context,
            medicineId,
            notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(context, MedicalApp.CHANNEL_ID)
            .setContentTitle("Medicine Reminder")
            .setContentText("Time to take your medicine: $medicineName")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(medicineId, notification)
    }
}
