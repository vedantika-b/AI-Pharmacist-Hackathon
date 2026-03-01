package com.example.medicineapp.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.medicineapp.data.model.Medicine
import com.example.medicineapp.databinding.ItemMedicineBinding

class MedicineAdapter(
    private val onEditClick: (Medicine) -> Unit,
    private val onDeleteClick: (Medicine) -> Unit
) : ListAdapter<Medicine, MedicineAdapter.MedicineViewHolder>(MedicineDiffCallback()) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MedicineViewHolder {
        val binding = ItemMedicineBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return MedicineViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: MedicineViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    inner class MedicineViewHolder(
        private val binding: ItemMedicineBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(medicine: Medicine) {
            binding.apply {
                tvMedicineName.text = medicine.name
                tvMedicineTime.text = "Time: ${medicine.time}"
                
                btnEdit.setOnClickListener { onEditClick(medicine) }
                btnDelete.setOnClickListener { onDeleteClick(medicine) }
            }
        }
    }
    
    private class MedicineDiffCallback : DiffUtil.ItemCallback<Medicine>() {
        override fun areItemsTheSame(oldItem: Medicine, newItem: Medicine): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: Medicine, newItem: Medicine): Boolean {
            return oldItem == newItem
        }
    }
}
