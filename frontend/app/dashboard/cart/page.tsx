"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { t } from "@/lib/translations"
import Link from "next/link"
import CheckoutPharmacyModal from "@/components/pharmacy/CheckoutPharmacyModal"

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCart()
  const { language } = useLanguage()
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price)
  }

  if (cart.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t('cart', language)}</h1>
          <p className="text-muted-foreground">
            View and manage your cart items
          </p>
        </div>

        <Card className="p-12">
          <div className="text-center space-y-4">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-2xl font-semibold">Your cart is empty</p>
              <p className="text-muted-foreground">
                Add medicines to your cart to continue shopping
              </p>
            </div>
            <Link href="/dashboard/medicines">
              <Button size="lg" className="mt-4">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Browse Medicines
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t('cart', language)}</h1>
          <p className="text-muted-foreground">
            {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <Button variant="outline" onClick={clearCart}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Cart
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Medicine Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          {item.generic_name && (
                            <p className="text-sm text-muted-foreground">{item.generic_name}</p>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.category && (
                          <Badge variant="outline">{item.category}</Badge>
                        )}
                        {item.strength && (
                          <Badge variant="secondary">{item.strength}</Badge>
                        )}
                        {item.prescription_required && (
                          <Badge variant="destructive" className="text-xs">
                            Prescription Required
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock_quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(item.price)} × {item.quantity}
                          </div>
                          <div className="text-xl font-bold text-primary">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (GST 18%)</span>
                  <span className="font-medium">{formatCurrency(getTotalPrice() * 0.18)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(getTotalPrice() * 1.18)}
                  </span>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setCheckoutModalOpen(true)}
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>✓ Secure checkout</p>
                <p>✓ Free shipping on all orders</p>
                <p>✓ Easy returns within 7 days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-center">
        <Link href="/dashboard/medicines">
          <Button variant="outline" size="lg">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Checkout Pharmacy Modal */}
      <CheckoutPharmacyModal 
        cartItems={cart}
        open={checkoutModalOpen}
        onOpenChange={setCheckoutModalOpen}
      />
    </div>
  )
}
