export interface User {
  id: string
  email: string
  full_name: string
  role: 'customer' | 'pharmacist' | 'admin'
  phone?: string
  avatar_url?: string
}

export interface Product {
  id: string
  name: string
  generic_name?: string
  price: number
  rx_required: boolean
  category?: string
  strength?: string
  description?: string
  is_active: boolean
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  status: 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled'
  subtotal: number
  tax: number
  total: number
  created_at: string
  updated_at: string
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    intent?: string
    confidence?: number
    order_id?: string
  }
}

export interface InventoryItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  reorder_threshold: number
  location?: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  updated_at: string
}

export interface AILog {
  id: string
  order_id?: string
  user_id: string
  agent_type: string
  intent_detected?: string
  confidence_score?: number
  decision_made: string
  processing_time_ms?: number
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  user_email?: string
  action: string
  resource: string
  resource_type?: string
  resource_id?: string
  details: string | Record<string, any>
  metadata?: Record<string, any>
  severity: 'info' | 'warning' | 'error' | 'critical'
  created_at: string
}

export interface RefillPrediction {
  prescription_id: string
  medication_name: string
  predicted_refill_date: string
  confidence_score: number
  days_supply_remaining: number
  user_name: string
}

export interface OrderRequest {
  user_id: string
  items: {
    product_id: string
    quantity: number
    prescription_id?: string
  }[]
  delivery_method: 'pickup' | 'delivery'
  notes?: string
}

export interface OrderResponse {
  order_id: string
  order_number: string
  status: string
  total: number
  message: string
  intent_detected: string
  llm_confidence: number
  safety_check: {
    approved: boolean
    warnings: string[]
  }
  refill_predictions: RefillPrediction[]
  ai_log_id: string
}