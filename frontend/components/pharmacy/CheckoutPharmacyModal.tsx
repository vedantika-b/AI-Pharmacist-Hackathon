"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, TrendingDown } from "lucide-react"
import type { Medicine } from "@/lib/types"

interface CartItem extends Medicine {
  quantity: number
}

interface CheckoutPharmacyModalProps {
  cartItems: CartItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PharmacyOption {
  name: string
  logo: string
  color: string
  getSearchUrl: (medicineName: string) => string
  estimatedDiscount: string
  estimatedDelivery: string
}

const pharmacies: PharmacyOption[] = [
  {
    name: "Apollo Pharmacy",
    logo: "🏥",
    color: "from-green-500 to-green-600",
    getSearchUrl: (name) => `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`,
    estimatedDiscount: "8-12% OFF",
    estimatedDelivery: "2-3 days"
  },
  {
    name: "PharmEasy",
    logo: "💊",
    color: "from-teal-500 to-teal-600",
    getSearchUrl: (name) => `https://pharmeasy.in/search/all?name=${encodeURIComponent(name)}`,
    estimatedDiscount: "10-15% OFF",
    estimatedDelivery: "1-2 days"
  },
  {
    name: "Netmeds",
    logo: "🩺",
    color: "from-blue-500 to-blue-600",
    getSearchUrl: (name) => `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(name)}/all`,
    estimatedDiscount: "5-10% OFF",
    estimatedDelivery: "2-4 days"
  },
  {
    name: "Tata 1mg",
    logo: "⚕️",
    color: "from-orange-500 to-orange-600",
    getSearchUrl: (name) => `https://www.1mg.com/search/all?name=${encodeURIComponent(name)}`,
    estimatedDiscount: "8-12% OFF",
    estimatedDelivery: "1-2 days"
  },
  {
    name: "MediBuddy",
    logo: "🏨",
    color: "from-purple-500 to-purple-600",
    getSearchUrl: (name) => `https://www.medibuddy.in/medicines/search?q=${encodeURIComponent(name)}`,
    estimatedDiscount: "5-8% OFF",
    estimatedDelivery: "3-5 days"
  }
]

export default function CheckoutPharmacyModal({
  cartItems,
  open,
  onOpenChange
}: CheckoutPharmacyModalProps) {
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handlePharmacyClick = (pharmacy: PharmacyOption) => {
    // Open search for each medicine (max 5 to avoid too many tabs)
    const medicinesToOpen = cartItems.slice(0, 5)
    
    medicinesToOpen.forEach((item, index) => {
      const searchUrl = pharmacy.getSearchUrl(item.name)
      
      // Small delay between opening tabs to avoid popup blocking
      setTimeout(() => {
        window.open(searchUrl, '_blank', 'noopener,noreferrer')
      }, index * 300) // 300ms delay between each tab
    })
    
    // If more than 5 medicines, show alert
    if (cartItems.length > 5) {
      setTimeout(() => {
        alert(`Note: Only first 5 medicines opened. Please search for remaining ${cartItems.length - 5} medicines manually.`)
      }, medicinesToOpen.length * 300 + 500)
    }
    
    console.log('Opening pharmacy:', pharmacy.name)
    console.log('Medicines:', cartItems.map(item => item.name).join(', '))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-primary" />
            Choose Pharmacy for Checkout
          </DialogTitle>
          <DialogDescription>
            Select a pharmacy - All {totalItems} medicines will open automatically with search results (₹{totalPrice.toFixed(2)} total)
          </DialogDescription>
        </DialogHeader>

        {/* Cart Summary - Medicines to Buy */}
        <div className="bg-primary/5 rounded-lg p-4 space-y-3 border-2 border-primary/20">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base">� Auto-Search Medicines:</h4>
            <Badge variant="secondary">{totalItems} items</Badge>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 rounded-md p-3">
            {cartItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm border-b pb-2 last:border-b-0">
                <div className="flex-1">
                  <div className="font-semibold text-base">{item.name}</div>
                  {item.strength && (
                    <div className="text-xs text-muted-foreground">{item.strength}</div>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">Qty: {item.quantity}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center font-bold text-base border-t pt-2">
            <span>Estimated Total:</span>
            <span className="text-primary text-lg">₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="text-2xl">�</div>
              <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
                <p className="font-bold">Quick Checkout Process:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Select a pharmacy below</li>
                  <li>Each medicine will open in a new tab with search results</li>
                  <li>Review and add to cart on pharmacy website</li>
                  <li>Complete purchase with your payment method</li>
                </ol>
                <p className="text-xs mt-2 text-blue-700 dark:text-blue-300 font-semibold">
                  ⚡ Automatic: All medicines will open automatically with search results!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pharmacy Options */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Select Pharmacy:</h4>
          <div className="grid grid-cols-1 gap-3">
            {pharmacies.map((pharmacy) => (
              <Button
                key={pharmacy.name}
                variant="outline"
                className="h-auto p-4 justify-start hover:shadow-lg transition-all"
                onClick={() => handlePharmacyClick(pharmacy)}
              >
                <div className="flex items-center gap-3 w-full">
                  {/* Pharmacy Logo */}
                  <div className={`h-14 w-14 rounded-lg bg-linear-to-br ${pharmacy.color} flex items-center justify-center text-2xl shrink-0`}>
                    {pharmacy.logo}
                  </div>

                  {/* Pharmacy Details */}
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-base mb-1">
                      {pharmacy.name}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>🚚 {pharmacy.estimatedDelivery}</span>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {pharmacy.estimatedDiscount}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Icon */}
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
          <p>
            <strong>💳 Payment:</strong> Complete payment directly on the pharmacy website.
          </p>
          <p>
            <strong>📦 Delivery:</strong> Actual delivery times and discounts may vary.
          </p>
          {cartItems.some(item => item.prescription_required) && (
            <p className="text-orange-600 dark:text-orange-400">
              <strong>⚠️ Prescription Required:</strong> Some items need a valid prescription.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
