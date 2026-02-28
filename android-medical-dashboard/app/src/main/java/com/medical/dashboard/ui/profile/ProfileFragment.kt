package com.medical.dashboard.ui.profile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.medical.dashboard.databinding.FragmentProfileBinding
import com.medical.dashboard.utils.PreferenceManager

class ProfileFragment : Fragment() {
    
    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var preferenceManager: PreferenceManager
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        preferenceManager = PreferenceManager(requireContext())
        
        setupUI()
    }
    
    private fun setupUI() {
        val userName = preferenceManager.getUserName()
        val userEmail = preferenceManager.getUserEmail()
        
        binding.tvUserName.text = userName
        binding.tvUserEmail.text = userEmail
        binding.tvProfileInitial.text = userName.firstOrNull()?.toString()?.uppercase() ?: "U"
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
