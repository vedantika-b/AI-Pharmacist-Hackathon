"use client"

import { useState } from "react"
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
import { Search, Filter, ShoppingCart, Pill, Info } from "lucide-react"

interface Medicine {
  id: string
  name: string
  genericName: string
  category: string
  price: number
  inStock: boolean
  description: string
  dosage: string
}

const mockMedicines: Medicine[] = [
  {
    id: "1",
    name: "Amoxicillin",
    genericName: "Amoxicillin Trihydrate",
    category: "Antibiotic",
    price: 12.99,
    inStock: true,
    description: "Used to treat bacterial infections",
    dosage: "500mg"
  },
  {
    id: "2",
    name: "Lipitor",
    genericName: "Atorvastatin",
    category: "Statin",
    price: 24.99,
    inStock: true,
    description: "Used to lower cholesterol",
    dosage: "20mg"
  },
  {
    id: "3",
    name: "Metformin",
    genericName: "Metformin HCl",
    category: "Diabetes",
    price: 8.99,
    inStock: true,
    description: "Used to treat type 2 diabetes",
    dosage: "850mg"
  },
  {
    id: "4",
    name: "Omeprazole",
    genericName: "Omeprazole",
    category: "Proton Pump Inhibitor",
    price: 15.99,
    inStock: false,
    description: "Used to treat acid reflux",
    dosage: "20mg"
  },
  {
    id: "5",
    name: "Aspirin",
    genericName: "Acetylsalicylic Acid",
    category: "Pain Reliever",
    price: 5.99,
    inStock: true,
    description: "Pain relief and blood thinner",
    dosage: "81mg"
  },
  {
    id: "6",
    name: "Lisinopril",
    genericName: "Lisinopril",
    category: "ACE Inhibitor",
    price: 9.99,
    inStock: true,
    description: "Used to treat high blood pressure",
    dosage: "10mg"
  },
  {
    id: "7",
    name: "Levothyroxine",
    genericName: "Levothyroxine Sodium",
    category: "Thyroid",
    price: 11.99,
    inStock: true,
    description: "Used to treat thyroid deficiency",
    dosage: "50mcg"
  },
  {
    id: "8",
    name: "Amlodipine",
    genericName: "Amlodipine Besylate",
    category: "Calcium Channel Blocker",
    price: 13.99,
    inStock: true,
    description: "Used to treat high blood pressure",
    dosage: "5mg"
  }
]

const categories = ["All", "Antibiotic", "Statin", "Diabetes", "Pain Reliever", "ACE Inhibitor", "Thyroid"]

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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [cart, setCart] = useState<string[]>([])

  const filteredMedicines = mockMedicines.filter((medicine) => {
    const matchesSearch =
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.genericName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "All" || medicine.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (medicineId: string) => {
    setCart(prev => [...prev, medicineId])
    // Simulate temporary feedback
    setTimeout(() => {
      setCart(prev => prev.filter(id => id !== medicineId))
    }, 2000)
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                    onClick={() => setSelectedCategory(category)}
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

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {filteredMedicines.length} medicine{filteredMedicines.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Medicine Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {filteredMedicines.map((medicine) => (
          <motion.div key={medicine.id} variants={item}>
            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Pill className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant={medicine.inStock ? "default" : "destructive"}>
                    {medicine.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{medicine.name}</CardTitle>
                <CardDescription className="text-xs">
                  {medicine.genericName}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="outline">{medicine.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Dosage:</span>
                    <span className="font-medium">{medicine.dosage}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {medicine.description}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      ${medicine.price}
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
                    disabled={!medicine.inStock || cart.includes(medicine.id)}
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

      {filteredMedicines.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-2">
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
