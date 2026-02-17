// ============================================================================
// AI PHARMACIST - DATABASE TYPE DEFINITIONS
// ============================================================================
// Auto-generated TypeScript types matching PostgreSQL schema
// Use with Supabase client for type-safe database operations
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          role_id: string
          first_name: string
          last_name: string
          phone: string | null
          date_of_birth: string | null
          address: Json
          avatar_url: string | null
          license_number: string | null
          is_active: boolean
          last_login: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role_id: string
          first_name: string
          last_name: string
          phone?: string | null
          date_of_birth?: string | null
          address?: Json
          avatar_url?: string | null
          license_number?: string | null
          is_active?: boolean
          last_login?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          date_of_birth?: string | null
          address?: Json
          avatar_url?: string | null
          license_number?: string | null
          is_active?: boolean
          last_login?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      medicines: {
        Row: {
          id: string
          name: string
          generic_name: string | null
          brand_name: string | null
          description: string | null
          dosage: string | null
          form: string
          strength: string | null
          manufacturer: string | null
          ndc_code: string | null
          barcode: string | null
          sku: string | null
          price: number
          cost: number | null
          currency: string
          stock_quantity: number
          min_stock_level: number
          max_stock_level: number | null
          reorder_level: number | null
          prescription_required: boolean
          controlled_substance: boolean
          controlled_substance_schedule: string | null
          fda_approved: boolean | null
          expiry_date: string | null
          batch_number: string | null
          storage_conditions: string | null
          dosage_instructions: string | null
          side_effects: string | null
          contraindications: string | null
          drug_interactions: string | null
          warnings: string | null
          category: string | null
          therapeutic_class: string | null
          tags: string[] | null
          is_active: boolean
          discontinued: boolean
          search_vector: unknown | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          generic_name?: string | null
          brand_name?: string | null
          description?: string | null
          dosage?: string | null
          form: string
          strength?: string | null
          manufacturer?: string | null
          ndc_code?: string | null
          barcode?: string | null
          sku?: string | null
          price: number
          cost?: number | null
          currency?: string
          stock_quantity?: number
          min_stock_level?: number
          max_stock_level?: number | null
          reorder_level?: number | null
          prescription_required?: boolean
          controlled_substance?: boolean
          controlled_substance_schedule?: string | null
          fda_approved?: boolean | null
          expiry_date?: string | null
          batch_number?: string | null
          storage_conditions?: string | null
          dosage_instructions?: string | null
          side_effects?: string | null
          contraindications?: string | null
          drug_interactions?: string | null
          warnings?: string | null
          category?: string | null
          therapeutic_class?: string | null
          tags?: string[] | null
          is_active?: boolean
          discontinued?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          generic_name?: string | null
          brand_name?: string | null
          description?: string | null
          dosage?: string | null
          form?: string
          strength?: string | null
          manufacturer?: string | null
          ndc_code?: string | null
          barcode?: string | null
          sku?: string | null
          price?: number
          cost?: number | null
          currency?: string
          stock_quantity?: number
          min_stock_level?: number
          max_stock_level?: number | null
          reorder_level?: number | null
          prescription_required?: boolean
          controlled_substance?: boolean
          controlled_substance_schedule?: string | null
          fda_approved?: boolean | null
          expiry_date?: string | null
          batch_number?: string | null
          storage_conditions?: string | null
          dosage_instructions?: string | null
          side_effects?: string | null
          contraindications?: string | null
          drug_interactions?: string | null
          warnings?: string | null
          category?: string | null
          therapeutic_class?: string | null
          tags?: string[] | null
          is_active?: boolean
          discontinued?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          pharmacist_id: string | null
          processed_by: string | null
          status: string
          subtotal: number
          tax_amount: number
          discount_amount: number
          shipping_fee: number
          total_amount: number
          currency: string
          payment_method: string | null
          payment_status: string
          payment_transaction_id: string | null
          prescription_number: string | null
          prescription_image_url: string | null
          doctor_name: string | null
          doctor_license: string | null
          doctor_phone: string | null
          prescription_verified: boolean
          prescription_verified_by: string | null
          prescription_verified_at: string | null
          delivery_type: string
          delivery_address: Json | null
          delivery_instructions: string | null
          tracking_number: string | null
          order_date: string
          confirmed_at: string | null
          shipped_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          estimated_delivery_date: string | null
          notes: string | null
          customer_notes: string | null
          internal_notes: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_id: string
          pharmacist_id?: string | null
          processed_by?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          shipping_fee?: number
          total_amount: number
          currency?: string
          payment_method?: string | null
          payment_status?: string
          payment_transaction_id?: string | null
          prescription_number?: string | null
          prescription_image_url?: string | null
          doctor_name?: string | null
          doctor_license?: string | null
          doctor_phone?: string | null
          prescription_verified?: boolean
          prescription_verified_by?: string | null
          prescription_verified_at?: string | null
          delivery_type?: string
          delivery_address?: Json | null
          delivery_instructions?: string | null
          tracking_number?: string | null
          order_date?: string
          confirmed_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          estimated_delivery_date?: string | null
          notes?: string | null
          customer_notes?: string | null
          internal_notes?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          pharmacist_id?: string | null
          processed_by?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          shipping_fee?: number
          total_amount?: number
          currency?: string
          payment_method?: string | null
          payment_status?: string
          payment_transaction_id?: string | null
          prescription_number?: string | null
          prescription_image_url?: string | null
          doctor_name?: string | null
          doctor_license?: string | null
          doctor_phone?: string | null
          prescription_verified?: boolean
          prescription_verified_by?: string | null
          prescription_verified_at?: string | null
          delivery_type?: string
          delivery_address?: Json | null
          delivery_instructions?: string | null
          tracking_number?: string | null
          order_date?: string
          confirmed_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          estimated_delivery_date?: string | null
          notes?: string | null
          customer_notes?: string | null
          internal_notes?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          medicine_id: string
          quantity: number
          unit_price: number
          discount_amount: number
          tax_amount: number
          total_price: number
          dosage_instructions: string | null
          refills_allowed: number
          refills_remaining: number
          medicine_name: string | null
          medicine_form: string | null
          medicine_strength: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          medicine_id: string
          quantity: number
          unit_price: number
          discount_amount?: number
          tax_amount?: number
          dosage_instructions?: string | null
          refills_allowed?: number
          refills_remaining?: number
          medicine_name?: string | null
          medicine_form?: string | null
          medicine_strength?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          medicine_id?: string
          quantity?: number
          unit_price?: number
          discount_amount?: number
          tax_amount?: number
          dosage_instructions?: string | null
          refills_allowed?: number
          refills_remaining?: number
          medicine_name?: string | null
          medicine_form?: string | null
          medicine_strength?: string | null
          status?: string
          created_at?: string
        }
      }
      refill_predictions: {
        Row: {
          id: string
          customer_id: string
          medicine_id: string
          predicted_refill_date: string
          confidence_score: number | null
          probability_score: number | null
          last_order_date: string | null
          last_order_id: string | null
          average_consumption_days: number | null
          total_orders_analyzed: number
          order_frequency_days: number | null
          model_version: string | null
          model_name: string | null
          algorithm_used: string | null
          features_used: Json | null
          training_date: string | null
          prediction_range_start: string | null
          prediction_range_end: string | null
          seasonal_factor: number | null
          trend_factor: number | null
          is_active: boolean
          notification_sent: boolean
          notification_sent_at: string | null
          notification_type: string | null
          customer_responded: boolean
          customer_response_at: string | null
          converted_to_order: boolean
          converted_order_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          medicine_id: string
          predicted_refill_date: string
          confidence_score?: number | null
          probability_score?: number | null
          last_order_date?: string | null
          last_order_id?: string | null
          average_consumption_days?: number | null
          total_orders_analyzed?: number
          order_frequency_days?: number | null
          model_version?: string | null
          model_name?: string | null
          algorithm_used?: string | null
          features_used?: Json | null
          training_date?: string | null
          prediction_range_start?: string | null
          prediction_range_end?: string | null
          seasonal_factor?: number | null
          trend_factor?: number | null
          is_active?: boolean
          notification_sent?: boolean
          notification_sent_at?: string | null
          notification_type?: string | null
          customer_responded?: boolean
          customer_response_at?: string | null
          converted_to_order?: boolean
          converted_order_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          medicine_id?: string
          predicted_refill_date?: string
          confidence_score?: number | null
          probability_score?: number | null
          last_order_date?: string | null
          last_order_id?: string | null
          average_consumption_days?: number | null
          total_orders_analyzed?: number
          order_frequency_days?: number | null
          model_version?: string | null
          model_name?: string | null
          algorithm_used?: string | null
          features_used?: Json | null
          training_date?: string | null
          prediction_range_start?: string | null
          prediction_range_end?: string | null
          seasonal_factor?: number | null
          trend_factor?: number | null
          is_active?: boolean
          notification_sent?: boolean
          notification_sent_at?: string | null
          notification_type?: string | null
          customer_responded?: boolean
          customer_response_at?: string | null
          converted_to_order?: boolean
          converted_order_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_logs: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          request_id: string | null
          action_type: string
          action_category: string | null
          input_data: Json | null
          output_data: Json | null
          context_data: Json | null
          model_used: string | null
          model_version: string | null
          provider: string | null
          endpoint: string | null
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          execution_time_ms: number | null
          response_time_ms: number | null
          latency_ms: number | null
          success: boolean
          confidence_score: number | null
          user_feedback: number | null
          user_feedback_text: string | null
          feedback_timestamp: string | null
          error_code: string | null
          error_message: string | null
          error_stack: string | null
          retry_count: number
          estimated_cost: number | null
          currency: string
          ip_address: string | null
          user_agent: string | null
          referer: string | null
          tags: string[] | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          request_id?: string | null
          action_type: string
          action_category?: string | null
          input_data?: Json | null
          output_data?: Json | null
          context_data?: Json | null
          model_used?: string | null
          model_version?: string | null
          provider?: string | null
          endpoint?: string | null
          prompt_tokens?: number
          completion_tokens?: number
          execution_time_ms?: number | null
          response_time_ms?: number | null
          latency_ms?: number | null
          success?: boolean
          confidence_score?: number | null
          user_feedback?: number | null
          user_feedback_text?: string | null
          feedback_timestamp?: string | null
          error_code?: string | null
          error_message?: string | null
          error_stack?: string | null
          retry_count?: number
          estimated_cost?: number | null
          currency?: string
          ip_address?: string | null
          user_agent?: string | null
          referer?: string | null
          tags?: string[] | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          request_id?: string | null
          action_type?: string
          action_category?: string | null
          input_data?: Json | null
          output_data?: Json | null
          context_data?: Json | null
          model_used?: string | null
          model_version?: string | null
          provider?: string | null
          endpoint?: string | null
          prompt_tokens?: number
          completion_tokens?: number
          execution_time_ms?: number | null
          response_time_ms?: number | null
          latency_ms?: number | null
          success?: boolean
          confidence_score?: number | null
          user_feedback?: number | null
          user_feedback_text?: string | null
          feedback_timestamp?: string | null
          error_code?: string | null
          error_message?: string | null
          error_stack?: string | null
          retry_count?: number
          estimated_cost?: number | null
          currency?: string
          ip_address?: string | null
          user_agent?: string | null
          referer?: string | null
          tags?: string[] | null
          metadata?: Json
          created_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          medicine_id: string
          transaction_type: string
          quantity_change: number
          quantity_before: number
          quantity_after: number
          reference_type: string | null
          reference_id: string | null
          reason: string | null
          performed_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          medicine_id: string
          transaction_type: string
          quantity_change: number
          quantity_before: number
          quantity_after: number
          reference_type?: string | null
          reference_id?: string | null
          reason?: string | null
          performed_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          medicine_id?: string
          transaction_type?: string
          quantity_change?: number
          quantity_before?: number
          quantity_after?: number
          reference_type?: string | null
          reference_id?: string | null
          reason?: string | null
          performed_by?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      prescription_uploads: {
        Row: {
          id: string
          order_id: string | null
          customer_id: string
          file_url: string
          file_name: string | null
          file_size_bytes: number | null
          mime_type: string | null
          status: string
          verified_by: string | null
          verified_at: string | null
          rejection_reason: string | null
          extracted_data: Json | null
          extraction_confidence: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          customer_id: string
          file_url: string
          file_name?: string | null
          file_size_bytes?: number | null
          mime_type?: string | null
          status?: string
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          extracted_data?: Json | null
          extraction_confidence?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          customer_id?: string
          file_url?: string
          file_name?: string | null
          file_size_bytes?: number | null
          mime_type?: string | null
          status?: string
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          extracted_data?: Json | null
          extraction_confidence?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      order_summary: {
        Row: {
          id: string | null
          order_number: string | null
          status: string | null
          order_date: string | null
          total_amount: number | null
          payment_status: string | null
          customer_name: string | null
          customer_email: string | null
          total_items: number | null
          total_quantity: number | null
          pharmacist_name: string | null
        }
      }
      low_stock_medicines: {
        Row: {
          id: string | null
          name: string | null
          generic_name: string | null
          brand_name: string | null
          stock_quantity: number | null
          min_stock_level: number | null
          reorder_level: number | null
          shortage_amount: number | null
          shortage_percentage: number | null
        }
      }
      upcoming_refills: {
        Row: {
          id: string | null
          predicted_refill_date: string | null
          confidence_score: number | null
          notification_sent: boolean | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          medicine_name: string | null
          generic_name: string | null
          price: number | null
          stock_quantity: number | null
        }
      }
      daily_ai_usage_stats: {
        Row: {
          date: string | null
          action_type: string | null
          total_requests: number | null
          successful_requests: number | null
          avg_execution_time_ms: number | null
          total_tokens_used: number | null
          total_cost: number | null
        }
      }
    }
    Functions: {
      check_medicine_stock: {
        Args: {
          p_medicine_id: string
          p_quantity: number
        }
        Returns: boolean
      }
      get_user_role: {
        Args: {
          p_user_id: string
        }
        Returns: string
      }
      calculate_order_total: {
        Args: {
          p_order_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type Role = Database['public']['Tables']['roles']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Medicine = Database['public']['Tables']['medicines']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type RefillPrediction = Database['public']['Tables']['refill_predictions']['Row']
export type AILog = Database['public']['Tables']['ai_logs']['Row']
export type InventoryTransaction = Database['public']['Tables']['inventory_transactions']['Row']
export type PrescriptionUpload = Database['public']['Tables']['prescription_uploads']['Row']

// Insert types
export type RoleInsert = Database['public']['Tables']['roles']['Insert']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type MedicineInsert = Database['public']['Tables']['medicines']['Insert']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type RefillPredictionInsert = Database['public']['Tables']['refill_predictions']['Insert']
export type AILogInsert = Database['public']['Tables']['ai_logs']['Insert']
export type InventoryTransactionInsert = Database['public']['Tables']['inventory_transactions']['Insert']
export type PrescriptionUploadInsert = Database['public']['Tables']['prescription_uploads']['Insert']

// Update types
export type RoleUpdate = Database['public']['Tables']['roles']['Update']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type MedicineUpdate = Database['public']['Tables']['medicines']['Update']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']
export type RefillPredictionUpdate = Database['public']['Tables']['refill_predictions']['Update']
export type AILogUpdate = Database['public']['Tables']['ai_logs']['Update']
export type InventoryTransactionUpdate = Database['public']['Tables']['inventory_transactions']['Update']
export type PrescriptionUploadUpdate = Database['public']['Tables']['prescription_uploads']['Update']

// View types
export type OrderSummary = Database['public']['Views']['order_summary']['Row']
export type LowStockMedicine = Database['public']['Views']['low_stock_medicines']['Row']
export type UpcomingRefill = Database['public']['Views']['upcoming_refills']['Row']
export type DailyAIUsageStats = Database['public']['Views']['daily_ai_usage_stats']['Row']

// ============================================================================
// ENUM TYPES (from CHECK constraints)
// ============================================================================

export type MedicineForm = 
  | 'tablet' 
  | 'capsule' 
  | 'liquid' 
  | 'syrup' 
  | 'injection' 
  | 'cream' 
  | 'ointment' 
  | 'gel' 
  | 'drops' 
  | 'inhaler' 
  | 'patch' 
  | 'suppository' 
  | 'powder' 
  | 'other'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'preparing'
  | 'ready'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded'

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'

export type DeliveryType =
  | 'pickup'
  | 'standard'
  | 'express'
  | 'same_day'

export type OrderItemStatus =
  | 'pending'
  | 'prepared'
  | 'dispensed'
  | 'cancelled'

export type NotificationType =
  | 'email'
  | 'sms'
  | 'push'
  | 'in_app'

export type AIActionType =
  | 'chat'
  | 'recommendation'
  | 'prediction'
  | 'search'
  | 'classification'
  | 'analysis'
  | 'validation'
  | 'prescription_check'
  | 'drug_interaction'
  | 'inventory_optimization'
  | 'demand_forecast'
  | 'other'

export type InventoryTransactionType =
  | 'purchase'
  | 'sale'
  | 'return'
  | 'adjustment'
  | 'damaged'
  | 'expired'
  | 'transfer'
  | 'initial'

export type PrescriptionStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired'

// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

export type OrderWithItems = Order & {
  order_items: (OrderItem & {
    medicines: Medicine
  })[]
  user_profiles: UserProfile
}

export type RefillPredictionWithDetails = RefillPrediction & {
  user_profiles: UserProfile
  medicines: Medicine
}

export type MedicineWithStock = Medicine & {
  is_low_stock: boolean
  stock_percentage: number
}
