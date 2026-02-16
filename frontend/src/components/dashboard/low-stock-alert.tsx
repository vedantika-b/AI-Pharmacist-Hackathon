'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package, TrendingDown, RefreshCw, ShoppingCart } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { InventoryItem } from '@/types'

interface LowStockAlertProps {
  items?: InventoryItem[]
  className?: string
}

export function LowStockAlert({ items = [], className }: LowStockAlertProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Mock data if no items provided
  const mockLowStockItems: InventoryItem[] = [
    {
      id: '1',
      product_id: 'prod1',
      product_name: 'Acetaminophen 325mg',
      quantity: 15,
      reorder_threshold: 20,
      location: 'A1-01',
      status: 'low_stock' as const,
      updated_at: '2024-02-16T10:30:00Z'
    },
    {
      id: '2',
      product_id: 'prod2',
      product_name: 'Ibuprofen 200mg',
      quantity: 0,
      reorder_threshold: 25,
      location: 'B2-05',
      status: 'out_of_stock' as const,
      updated_at: '2024-02-16T09:15:00Z'
    },
    {
      id: '3',
      product_id: 'prod3',
      product_name: 'Amoxicillin 500mg',
      quantity: 8,
      reorder_threshold: 15,
      location: 'C1-12',
      status: 'low_stock' as const,
      updated_at: '2024-02-16T08:45:00Z'
    },
    {
      id: '4',
      product_id: 'prod4',
      product_name: 'Metformin 850mg',
      quantity: 3,
      reorder_threshold: 10,
      location: 'D3-07',
      status: 'low_stock' as const,
      updated_at: '2024-02-16T07:20:00Z'
    }
  ]

  const displayItems = items.length > 0 ? items : mockLowStockItems

  const getStatusBadge = (status: string, quantity: number) => {
    switch (status) {
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>
      case 'low_stock':
        return quantity <= 5 ? 
          <Badge className="bg-red-500">Critical</Badge> : 
          <Badge className="bg-yellow-500">Low Stock</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getUrgencyOrder = (item: InventoryItem) => {
    if (item.status === 'out_of_stock') return 1
    if (item.quantity <= 5) return 2
    return 3
  }

  const sortedItems = [...displayItems].sort((a, b) => getUrgencyOrder(a) - getUrgencyOrder(b))

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Updated just now'
    if (diffHours === 1) return 'Updated 1 hour ago'
    return `Updated ${diffHours} hours ago`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>
              Items requiring immediate attention
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
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>All items are well stocked</p>
            <p className="text-sm">No low stock alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.slice(0, 8).map((item) => (
              <div key={item.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.product_name}</span>
                      {getStatusBadge(item.status, item.quantity)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        <span className={`font-medium ${item.quantity === 0 ? 'text-red-500' : item.quantity <= 5 ? 'text-yellow-500' : ''}`}>
                          {item.quantity}
                        </span> units remaining
                      </span>
                      <span>Reorder at: {item.reorder_threshold}</span>
                      {item.location && (
                        <span>Location: {item.location}</span>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {formatLastUpdated(item.updated_at)}
                    </div>

                    {/* Stock level bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              item.quantity === 0 ? 'bg-red-500' :
                              item.quantity <= 5 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.max(5, Math.min(100, (item.quantity / item.reorder_threshold) * 100))}%` 
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground w-12">
                        {item.reorder_threshold ? Math.round((item.quantity / item.reorder_threshold) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="ml-4">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Reorder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortedItems.length > 8 && (
          <div className="text-center pt-4">
            <Button variant="outline" size="sm">
              View All Alerts ({sortedItems.length})
            </Button>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-500">
                {sortedItems.filter(item => item.status === 'out_of_stock').length}
              </p>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">
                {sortedItems.filter(item => item.status === 'low_stock' && item.quantity <= 5).length}
              </p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">
                {sortedItems.filter(item => item.status === 'low_stock' && item.quantity > 5).length}
              </p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}