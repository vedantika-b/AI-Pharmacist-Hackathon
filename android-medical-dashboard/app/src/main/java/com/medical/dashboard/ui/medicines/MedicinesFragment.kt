package com.medical.dashboard.ui.medicines

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.medical.dashboard.R
import com.medical.dashboard.databinding.FragmentMedicinesBinding
import com.medical.dashboard.ui.adapters.MedicineAdapter
import com.medical.dashboard.viewmodel.MedicineViewModel

class MedicinesFragment : Fragment() {
    
    private var _binding: FragmentMedicinesBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var viewModel: MedicineViewModel
    private lateinit var medicineAdapter: MedicineAdapter
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMedicinesBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        viewModel = ViewModelProvider(this)[MedicineViewModel::class.java]
        
        setupUI()
        observeData()
    }
    
    private fun setupUI() {
        // Setup RecyclerView
        medicineAdapter = MedicineAdapter(
            onEditClick = { medicine ->
                val action = MedicinesFragmentDirections
                    .actionNavigationMedicinesToAddEditMedicineFragment(medicine.id)
                findNavController().navigate(action)
            },
            onDeleteClick = { medicine ->
                viewModel.delete(medicine) {
                    android.widget.Toast.makeText(
                        requireContext(),
                        "Medicine deleted successfully",
                        android.widget.Toast.LENGTH_SHORT
                    ).show()
                }
            }
        )
        
        binding.rvMedicines.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = medicineAdapter
        }
        
        // FAB click listener
        binding.fabAddMedicine.setOnClickListener {
            findNavController().navigate(R.id.action_navigation_medicines_to_addEditMedicineFragment)
        }
    }
    
    private fun observeData() {
        viewModel.allMedicines.observe(viewLifecycleOwner) { medicines ->
            medicineAdapter.submitList(medicines)
            
            // Show/hide empty state
            if (medicines.isEmpty()) {
                binding.rvMedicines.visibility = View.GONE
                binding.tvEmptyState.visibility = View.VISIBLE
            } else {
                binding.rvMedicines.visibility = View.VISIBLE
                binding.tvEmptyState.visibility = View.GONE
            }
        }
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
