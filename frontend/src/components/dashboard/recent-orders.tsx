'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, User, Calendar, DollarSign, RefreshCw, Eye } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { Order } from '@/types'

interface RecentOrdersProps {
  orders?: Order[]
  className?: string
}

export function RecentOrders({ orders = [], className }: RecentOrdersProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  // Mock data if no orders provided
  const mockOrders: Order[] = [
    {
      id: '1',
      order_number: 'ORD-2024-001',
      user_id: 'user1',
      status: 'completed',
      subtotal: 45.50,
      tax: 3.64,
      total: 49.14,
      created_at: '2024-02-16T14:30:00Z',
      updated_at: '2024-02-16T15:45:00Z',
      items: [
        {
          id: 'item1',
          order_id: '1',
          product_id: 'prod1',
          product_name: 'Acetaminophen 325mg',
          quantity: 2,
          unit_price: 12.99,
          total_price: 25.98
        }
      ]
    },
    {
      id: '2',
      order_number: 'ORD-2024-002',
      user_id: 'user2',
      status: 'processing',
      subtotal: 78.25,
      tax: 6.26,
      total: 84.51,
      created_at: '2024-02-16T13:15:00Z',
      updated_at: '2024-02-16T13:15:00Z',
      items: [
        {
          id: 'item2',
          order_id: '2',
          product_id: 'prod2',
          product_name: 'Metformin 850mg',
          quantity: 1,
          unit_price: 34.50,
          total_price: 34.50
        }
      ]
    },
    {
      id: '3',
      order_number: 'ORD-2024-003',
      user_id: 'user3',
      status: 'pending',
      subtotal: 156.75,
      tax: 12.54,
      total: 169.29,
      created_at: '2024-02-16T12:00:00Z',
      updated_at: '2024-02-16T12:00:00Z',
      items: [
        {
          id: 'item3',
          order_id: '3',
          product_id: 'prod3',
          product_name: 'Lisinopril 10mg',
          quantity: 3,
          unit_price: 28.50,
          total_price: 85.50
        }
      ]
    },
    {
      id: '4',
      order_number: 'ORD-2024-004',
      user_id: 'user4',
      status: 'ready',
      subtotal: 89.99,
      tax: 7.20,
      total: 97.19,
      created_at: '2024-02-16T11:30:00Z',
      updated_at: '2024-02-16T14:20:00Z',
      items: [
        {
          id: 'item4',
          order_id: '4',
          product_id: 'prod4',
          product_name: 'Atorvastatin 20mg',
          quantity: 2,
          unit_price: 44.99,
          total_price: 89.98
        }
      ]
    },
    {
      id: '5',
      order_number: 'ORD-2024-005',
      user_id: 'user5',
      status: 'cancelled',
      subtotal: 32.50,
      tax: 2.60,
      total: 35.10,
      created_at: '2024-02-16T10:15:00Z',
      updated_at: '2024-02-16T10:45:00Z',
      items: [
        {
          id: 'item5',
          order_id: '5',
          product_id: 'prod5',
          product_name: 'Vitamin D3 1000IU',
          quantity: 1,
          unit_price: 32.50,
          total_price: 32.50
        }
      ]
    }
  ]

  const displayOrders = orders.length > 0 ? orders : mockOrders

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>
      case 'ready':
        return <Badge className="bg-blue-500">Ready</Badge>
      case 'processing':
        return <Badge className="bg-yellow-500">Processing</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const sortedOrders = [...displayOrders].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              Recent Orders
            </CardTitle>
            <CardDescription>
              Latest customer orders and their status
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent orders</p>
            <p className="text-sm">Orders will appear here once customers start placing them</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOrders.slice(0, 6).map((order) => (
              <div key={order.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.order_number}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(order.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>

                {/* Order Items Preview */}
                <div className="space-y-1">
                  {order.items.slice(0, 2).map((item) => (
                    <div key={item.id} className="text-sm text-muted-foreground">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span className="ml-2">{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{order.items.length - 2} more items
                    </div>
                  )}
                </div>

                {/* Order Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Order Progress</span>
                    <span>
                      {order.status === 'completed' ? '100%' :
                       order.status === 'ready' ? '75%' :
                       order.status === 'processing' ? '50%' :
                       order.status === 'pending' ? '25%' : '0%'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        order.status === 'completed' ? 'bg-green-500' :
                        order.status === 'ready' ? 'bg-blue-500' :
                        order.status === 'processing' ? 'bg-yellow-500' :
                        order.status === 'pending' ? 'bg-gray-400' :
                        'bg-red-500'
                      }`}
                      style={{ 
                        width: order.status === 'completed' ? '100%' :
                               order.status === 'ready' ? '75%' :
                               order.status === 'processing' ? '50%' :
                               order.status === 'pending' ? '25%' : '0%'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortedOrders.length > 6 && (
          <div className="text-center pt-4">
            <Button variant="outline" size="sm">
              View All Orders ({sortedOrders.length})
            </Button>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-green-500">
                {sortedOrders.filter(o => o.status === 'completed').length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-500">
                {sortedOrders.filter(o => o.status === 'ready').length}
              </p>
              <p className="text-xs text-muted-foreground">Ready</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-500">
                {sortedOrders.filter(o => o.status === 'processing').length}
              </p>
              <p className="text-xs text-muted-foreground">Processing</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-400">
                {sortedOrders.filter(o => o.status === 'pending').length}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}