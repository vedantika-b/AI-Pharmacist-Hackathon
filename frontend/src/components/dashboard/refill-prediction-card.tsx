'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, Clock, User, Pill, TrendingUp, Calendar } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { RefillPrediction } from '@/types'

interface RefillPredictionCardProps {
  predictions?: RefillPrediction[]
  className?: string
}

export function RefillPredictionCard({ predictions = [], className }: RefillPredictionCardProps) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Mock data if no predictions provided
  const mockPredictions: RefillPrediction[] = [
    {
      prescription_id: '1',
      medication_name: 'Metformin 500mg',
      predicted_refill_date: '2024-03-15',
      confidence_score: 0.87,
      days_supply_remaining: 5,
      user_name: 'John Smith'
    },
    {
      prescription_id: '2',
      medication_name: 'Lisinopril 10mg',
      predicted_refill_date: '2024-03-18',
      confidence_score: 0.92,
      days_supply_remaining: 8,
      user_name: 'Sarah Johnson'
    },
    {
      prescription_id: '3',
      medication_name: 'Atorvastatin 20mg',
      predicted_refill_date: '2024-03-20',
      confidence_score: 0.78,
      days_supply_remaining: 10,
      user_name: 'Michael Brown'
    }
  ]

  const displayPredictions = predictions.length > 0 ? predictions : mockPredictions

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-500">High</Badge>
    if (score >= 0.6) return <Badge variant="secondary">Medium</Badge>
    return <Badge variant="outline">Low</Badge>
  }

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining <= 3) return 'text-red-500'
    if (daysRemaining <= 7) return 'text-yellow-500'
    return 'text-green-500'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              AI Refill Predictions
            </CardTitle>
            <CardDescription>
              Machine learning predictions for upcoming prescription refills
            </CardDescription>
          </div>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayPredictions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No refill predictions available</p>
            <p className="text-sm">The AI is still learning your customers' patterns</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayPredictions.slice(0, 5).map((prediction, index) => (
              <div key={prediction.prescription_id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{prediction.medication_name}</span>
                      {getConfidenceBadge(prediction.confidence_score)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {prediction.user_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(prediction.predicted_refill_date)}
                      </div>
                      <div className={`flex items-center gap-1 ${getUrgencyColor(prediction.days_supply_remaining)}`}>
                        <Clock className="h-3 w-3" />
                        {prediction.days_supply_remaining} days left
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-medium">{(prediction.confidence_score * 100).toFixed(0)}%</span>
                      <div className="flex-1 mx-2">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${prediction.confidence_score * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="ml-4">
                    Prepare
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {displayPredictions.length > 5 && (
          <div className="text-center pt-4">
            <Button variant="outline" size="sm">
              View All Predictions ({displayPredictions.length})
            </Button>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">{displayPredictions.filter(p => p.confidence_score >= 0.8).length}</p>
              <p className="text-xs text-muted-foreground">High Confidence</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{displayPredictions.filter(p => p.days_supply_remaining <= 7).length}</p>
              <p className="text-xs text-muted-foreground">Due This Week</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{(displayPredictions.reduce((sum, p) => sum + p.confidence_score, 0) / displayPredictions.length * 100).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Avg Accuracy</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}