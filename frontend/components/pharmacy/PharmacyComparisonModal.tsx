"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, Pill, TrendingDown, CheckCircle2, IndianRupee } from "lucide-react"
import type { Medicine } from "@/lib/types"
import { useCart } from "@/contexts/CartContext"

interface PharmacyComparisonModalProps {
  medicine: Medicine | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PharmacyOption {
  name: string
  logo: string
  color: string
  getSearchUrl: (medicineName: string) => string
  priceVariance: number // -10 means 10% cheaper, +15 means 15% more expensive
  estimatedDelivery: string
}

const getPharmacies = (basePrice: number): PharmacyOption[] => [
  {
    name: "Apollo Pharmacy",
    logo: "🏥",
    color: "from-green-500 to-green-600",
    getSearchUrl: (name: string) => 
      `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`,
    priceVariance: -8, // Usually 8% cheaper
    estimatedDelivery: "2-3 days"
  },
  {
    name: "PharmEasy",
    logo: "💊",
    color: "from-teal-500 to-teal-600",
    getSearchUrl: (name: string) => 
      `https://pharmeasy.in/search/all?name=${encodeURIComponent(name)}`,
    priceVariance: -12, // Usually 12% cheaper (good discounts)
    estimatedDelivery: "1-2 days"
  },
  {
    name: "Netmeds",
    logo: "🩺",
    color: "from-blue-500 to-blue-600",
    getSearchUrl: (name: string) => 
      `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(name)}/all`,
    priceVariance: -5, // Usually 5% cheaper
    estimatedDelivery: "2-4 days"
  },
  {
    name: "Tata 1mg",
    logo: "⚕️",
    color: "from-orange-500 to-orange-600",
    getSearchUrl: (name: string) => 
      `https://www.1mg.com/search/all?name=${encodeURIComponent(name)}`,
    priceVariance: -10, // Usually 10% cheaper
    estimatedDelivery: "1-2 days"
  },
  {
    name: "MediBuddy",
    logo: "🏨",
    color: "from-purple-500 to-purple-600",
    getSearchUrl: (name: string) => 
      `https://www.medibuddy.in/medicines/search?q=${encodeURIComponent(name)}`,
    priceVariance: 5, // Usually 5% more expensive
    estimatedDelivery: "3-5 days"
  }
]

export default function PharmacyComparisonModal({
  medicine,
  open,
  onOpenChange
}: PharmacyComparisonModalProps) {
  const { addToCart } = useCart()
  const [clickedPharmacy, setClickedPharmacy] = useState<string | null>(null)

  if (!medicine) return null

  const pharmacies = getPharmacies(medicine.price)
  
  // Find cheapest pharmacy
  const cheapestPharmacy = pharmacies.reduce((prev, current) => 
    (prev.priceVariance < current.priceVariance) ? prev : current
  )

  const calculatePrice = (basePrice: number, variance: number) => {
    const price = basePrice * (1 + variance / 100)
    return Math.round(price * 100) / 100
  }

  const handlePharmacyClick = (pharmacy: PharmacyOption) => {
    setClickedPharmacy(pharmacy.name)
    const searchUrl = pharmacy.getSearchUrl(medicine.name)
    window.open(searchUrl, '_blank', 'noopener,noreferrer')
    
    setTimeout(() => setClickedPharmacy(null), 1000)
  }

  const handleAddToLocalCart = () => {
    addToCart(medicine)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-primary" />
            Compare Prices & Buy
          </DialogTitle>
          <DialogDescription>
            Find the best price for {medicine.name} across top Indian pharmacies
          </DialogDescription>
        </DialogHeader>

        {/* Medicine Details Card */}
        <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                <Pill className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{medicine.name}</h3>
                {medicine.generic_name && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Generic: {medicine.generic_name}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {medicine.strength && (
                    <Badge variant="outline">{medicine.strength}</Badge>
                  )}
                  {medicine.category && (
                    <Badge variant="secondary">{medicine.category}</Badge>
                  )}
                  {medicine.prescription_required && (
                    <Badge variant="destructive" className="text-xs">
                      Rx Required
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Our Price</div>
                <div className="text-2xl font-bold text-primary">
                  ₹{medicine.price.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Estimated prices shown below.</strong> Click on any pharmacy to check actual prices and buy on their website.
            </div>
          </div>
        </div>

        {/* Pharmacy Options Grid */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Choose a Pharmacy:</h4>
          <div className="grid grid-cols-1 gap-3">
            {pharmacies.map((pharmacy) => {
              const estimatedPrice = calculatePrice(medicine.price, pharmacy.priceVariance)
              const isCheapest = pharmacy.name === cheapestPharmacy.name
              
              return (
                <Button
                  key={pharmacy.name}
                  variant="outline"
                  className={`h-auto p-4 justify-start hover:shadow-lg transition-all ${
                    clickedPharmacy === pharmacy.name ? 'scale-95 bg-primary/10' : ''
                  } ${isCheapest ? 'ring-2 ring-green-500' : ''}`}
                  onClick={() => handlePharmacyClick(pharmacy)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`h-14 w-14 rounded-lg bg-linear-to-br ${pharmacy.color} flex items-center justify-center text-2xl shrink-0`}>
                      {pharmacy.logo}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base">{pharmacy.name}</span>
                        {isCheapest && (
                          <Badge className="bg-green-500 text-white text-xs">Best Price</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>🚚 {pharmacy.estimatedDelivery}</span>
                        <span>•</span>
                        <span>Click to check availability</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Est. Price</div>
                        <div className={`text-xl font-bold ${isCheapest ? 'text-green-600' : 'text-primary'}`}>
                          ₹{estimatedPrice.toFixed(2)}
                        </div>
                        {pharmacy.priceVariance < 0 && (
                          <div className="text-xs text-green-600">
                            Save ₹{(medicine.price - estimatedPrice).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Local Cart Option */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Or add to your local cart for reference
            </div>
            <Button onClick={handleAddToLocalCart} variant="default">
              <TrendingDown className="mr-2 h-4 w-4" />
              Add to Local Cart
            </Button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <strong>Note:</strong> Prices shown are estimates based on typical discounts. 
          Actual prices and availability may vary on the pharmacy websites.
          {medicine.prescription_required && (
            <span className="text-orange-600 dark:text-orange-400 block mt-1">
              ⚠️ This medicine requires a valid prescription. Please have it ready when ordering.
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
