'use client'

import { useState } from 'react'
import { useInventory } from '@/stores/inventory'
import { useAuth } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  AlertTriangle, 
  Package, 
  TrendingDown,
  TrendingUp,
  MoreHorizontal,
  Eye
} from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import { Product } from '@/types'

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Metformin 500mg',
    generic_name: 'Metformin HCl',
    brand_name: 'Glucophage',
    dosage: '500mg',
    form: 'Tablet',
    category: 'Diabetes',
    manufacturer: 'Bristol Myers Squibb',
    ndc: '0003-0087-50',
    current_stock: 45,
    minimum_stock: 50,
    maximum_stock: 500,
    unit_cost: 0.25,
    retail_price: 12.99,
    expiry_date: '2025-08-15',
    lot_number: 'ABC123',
    requires_prescription: true,
    controlled_substance: false,
    storage_temperature: 'Room temperature',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Lisinopril 10mg',
    generic_name: 'Lisinopril',
    brand_name: 'Prinivil',
    dosage: '10mg',
    form: 'Tablet',
    category: 'Cardiovascular',
    manufacturer: 'Merck',
    ndc: '0006-0207-68',
    current_stock: 180,
    minimum_stock: 100,
    maximum_stock: 1000,
    unit_cost: 0.15,
    retail_price: 8.99,
    expiry_date: '2025-12-30',
    lot_number: 'XYZ789',
    requires_prescription: true,
    controlled_substance: false,
    storage_temperature: 'Room temperature',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '3',
    name: 'Ibuprofen 200mg',
    generic_name: 'Ibuprofen',
    brand_name: 'Advil',
    dosage: '200mg',
    form: 'Tablet',
    category: 'Pain Relief',
    manufacturer: 'Pfizer',
    ndc: '0573-0164-40',
    current_stock: 25,
    minimum_stock: 50,
    maximum_stock: 300,
    unit_cost: 0.08,
    retail_price: 6.99,
    expiry_date: '2024-06-15',
    lot_number: 'DEF456',
    requires_prescription: false,
    controlled_substance: false,
    storage_temperature: 'Room temperature',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
]

export function InventoryManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { user } = useAuth()

  // Mock inventory state - in real app, this would come from useInventory store
  const { products = mockProducts, isLoading = false } = useInventory()

  const isAdmin = user?.role === 'admin'
  const isPharmacist = user?.role === 'pharmacist' || user?.role === 'admin'

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && product.current_stock <= product.minimum_stock) ||
                        (stockFilter === 'out' && product.current_stock === 0) ||
                        (stockFilter === 'expiring' && new Date(product.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

    return matchesSearch && matchesCategory && matchesStock
  })

  const getStockStatus = (product: Product) => {
    if (product.current_stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
    if (product.current_stock <= product.minimum_stock) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    return expiry < thirtyDaysFromNow
  }

  const categories = [...new Set(products.map(p => p.category))]

  if (!isPharmacist) {
    return (
      <Card className="p-8 text-center">
        <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Access Restricted
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          You need pharmacist or admin privileges to access inventory management.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Inventory Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Manage medication inventory and stock levels
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{products.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {products.filter(p => p.current_stock <= p.minimum_stock).length}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {products.filter(p => p.current_stock === 0).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-600">
                {products.filter(p => isExpiringSoon(p.expiry_date)).length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name, generic name, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Package className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No products found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
                  const expiring = isExpiringSoon(product.expiry_date)
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.generic_name} | {product.dosage}
                          </div>
                          {product.brand_name && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Brand: {product.brand_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.current_stock}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">units</div>
                      </TableCell>
                      <TableCell>{product.minimum_stock}</TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          expiring && "text-orange-600 dark:text-orange-400 font-medium"
                        )}>
                          {new Date(product.expiry_date).toLocaleDateString()}
                          {expiring && (
                            <div className="text-xs">⚠️ Expiring soon</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${product.retail_price.toFixed(2)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Cost: ${product.unit_cost.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Product Details Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct?.name} - Product Details
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label className="text-sm font-medium">Generic Name</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProduct.generic_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Brand Name</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProduct.brand_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">NDC Number</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProduct.ndc}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Lot Number</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProduct.lot_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Manufacturer</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProduct.manufacturer}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Storage</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProduct.storage_temperature}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Requires Prescription</Label>
                <Badge variant={selectedProduct.requires_prescription ? "default" : "secondary"}>
                  {selectedProduct.requires_prescription ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Controlled Substance</Label>
                <Badge variant={selectedProduct.controlled_substance ? "destructive" : "secondary"}>
                  {selectedProduct.controlled_substance ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}