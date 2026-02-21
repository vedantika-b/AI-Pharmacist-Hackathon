"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, ShoppingCart, Pill, Info, Loader2 } from "lucide-react"
import { getProducts } from "@/lib/api"
import { debounce } from "@/lib/utils"
import type { Medicine } from "@/lib/types"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [cart, setCart] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])

  // Fetch medicines
  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async (search?: string, category?: string) => {
    try {
      setLoading(true)
      const params: any = {}
      if (search) params.search = search
      if (category && category !== "All") params.category = category
      
      const data = await getProducts(params) as any
      setMedicines(data)
      
      // Extract unique categories
      const uniqueCategories = ["All", ...new Set(data.map((m: Medicine) => m.category).filter(Boolean))]
      setCategories(uniqueCategories as string[])
    } catch (error) {
      console.error('Failed to fetch medicines:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  const handleSearch = debounce((query: string) => {
    fetchMedicines(query, selectedCategory !== "All" ? selectedCategory : undefined)
  }, 500)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    handleSearch(value)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    fetchMedicines(searchQuery || undefined, category !== "All" ? category : undefined)
  }

  const addToCart = (medicineId: string) => {
    setCart(prev => [...prev, medicineId])
    // Simulate temporary feedback
    setTimeout(() => {
      setCart(prev => prev.filter(id => id !== medicineId))
    }, 2000)
  }

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Medicine Search</h1>
        <p className="text-muted-foreground">
          Search and browse our comprehensive database of medications
        </p>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by medicine name or generic name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 h-12"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 w-full md:w-auto">
                  <Filter className="mr-2 h-5 w-5" />
                  {selectedCategory}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="h-12 w-full md:w-auto">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Cart ({cart.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreg round">Loading medicines...</span>
        </div>
      )}

      {/* Results Count */}
      {!loading && medicines.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Found {medicines.length} medicine{medicines.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Medicine Grid */}
      {!loading && medicines.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {medicines.map((medicine) => (
            <motion.div key={medicine.id} variants={item}>
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Pill className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant={medicine.stock_quantity > 0 ? "default" : "destructive"}>
                      {medicine.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{medicine.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {medicine.generic_name || medicine.brand_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2 mb-4">
                    {medicine.category && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="outline">{medicine.category}</Badge>
                      </div>
                    )}
                    {medicine.strength && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Strength:</span>
                        <span className="font-medium">{medicine.strength}</span>
                      </div>
                    )}
                    {medicine.prescription_required && (
                      <Badge variant="secondary" className="text-xs">
                        Prescription Required
                      </Badge>
                    )}
                    {medicine.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {medicine.description}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(medicine.price)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="More information"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={() => addToCart(medicine.id)}
                      disabled={medicine.stock_quantity <= 0 || cart.includes(medicine.id)}
                      className="w-full"
                    >
                      {cart.includes(medicine.id) ? (
                        "Added to Cart ✓"
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && medicines.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-2xl font-semibold">No medicines found</p>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
