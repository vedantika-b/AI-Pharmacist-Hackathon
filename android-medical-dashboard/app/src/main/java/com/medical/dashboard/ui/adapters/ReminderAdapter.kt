package com.medical.dashboard.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.medical.dashboard.data.model.Medicine
import com.medical.dashboard.databinding.ItemReminderBinding

class ReminderAdapter : ListAdapter<Medicine, ReminderAdapter.ReminderViewHolder>(ReminderDiffCallback()) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReminderViewHolder {
        val binding = ItemReminderBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ReminderViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: ReminderViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    class ReminderViewHolder(
        private val binding: ItemReminderBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(medicine: Medicine) {
            binding.apply {
                tvMedicineName.text = medicine.name
                tvReminderTime.text = medicine.reminderTime
                tvDosage.text = medicine.dosage
            }
        }
    }
    
    private class ReminderDiffCallback : DiffUtil.ItemCallback<Medicine>() {
        override fun areItemsTheSame(oldItem: Medicine, newItem: Medicine): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: Medicine, newItem: Medicine): Boolean {
            return oldItem == newItem
        }
    }
}
