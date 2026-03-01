package com.medical.dashboard.ui.dashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.medical.dashboard.databinding.FragmentDashboardBinding
import com.medical.dashboard.ui.adapters.ReminderAdapter
import com.medical.dashboard.utils.PreferenceManager
import com.medical.dashboard.viewmodel.MedicineViewModel

class DashboardFragment : Fragment() {
    
    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var viewModel: MedicineViewModel
    private lateinit var preferenceManager: PreferenceManager
    private lateinit var reminderAdapter: ReminderAdapter
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        viewModel = ViewModelProvider(this)[MedicineViewModel::class.java]
        preferenceManager = PreferenceManager(requireContext())
        
        setupUI()
        observeData()
    }
    
    private fun setupUI() {
        // Set user name
        val userName = preferenceManager.getUserName()
        binding.tvWelcome.text = "Welcome, $userName!"
        
        // Setup RecyclerView
        reminderAdapter = ReminderAdapter()
        binding.rvUpcomingReminders.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = reminderAdapter
        }
    }
    
    private fun observeData() {
        // Observe medicine count
        viewModel.medicineCount.observe(viewLifecycleOwner) { count ->
            binding.tvMedicineCount.text = count?.toString() ?: "0"
        }
        
        // Observe upcoming reminders
        viewModel.upcomingReminders.observe(viewLifecycleOwner) { reminders ->
            reminderAdapter.submitList(reminders)
            binding.tvReminderCount.text = reminders?.size?.toString() ?: "0"
        }
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
