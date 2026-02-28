"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Send, CheckCircle, AlertTriangle, Activity, HelpCircle, Lightbulb, Heart } from "lucide-react"
import { submitFeedback } from "@/lib/api"
import { getCurrentUser } from "@/lib/supabase"

interface FeedbackAnalysis {
  health_status: string
  relief_status: string
  side_effects: string
  emergency_risk: string
  patient_doubts: string
  app_suggestions: string
  ai_response: string
  raw_feedback: string
  analyzed_at: string
}

export default function FeedbackPage() {
  const [patientName, setPatientName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [feedbackText, setFeedbackText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [analysis, setAnalysis] = useState<FeedbackAnalysis | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (feedbackText.trim().length < 10) {
      setError("Please provide detailed feedback (at least 10 characters)")
      return
    }

    setIsSubmitting(true)
    setError("")
    setAnalysis(null)

    try {
      // Get current user if logged in
      const { user } = await getCurrentUser()
      
      const response = await submitFeedback({
        user_id: user?.id,
        patient_name: patientName || undefined,
        phone_number: phoneNumber || undefined,
        feedback_text: feedbackText
      })

      setAnalysis(response as FeedbackAnalysis)
      
      // Clear form
      setFeedbackText("")
      setPatientName("")
      setPhoneNumber("")
      
    } catch (err: any) {
      setError(err.message || "Failed to analyze feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getEmergencyBadge = (emergencyRisk: string) => {
    const isEmergency = emergencyRisk.toLowerCase().includes("yes") || 
                       emergencyRisk.toLowerCase().includes("detected") ||
                       emergencyRisk.toLowerCase().includes("immediate")
    
    if (isEmergency) {
      return (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-100">⚠️ Emergency Detected</p>
            <p className="text-sm text-red-700 dark:text-red-300">{emergencyRisk}</p>
          </div>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        <p className="text-green-900 dark:text-green-100">{emergencyRisk}</p>
      </div>
    )
  }

  const getReliefBadge = (reliefStatus: string) => {
    const status = reliefStatus.toLowerCase()
    if (status.includes("yes") || status.includes("positive")) {
      return <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">✓ Relief Provided</span>
    } else if (status.includes("partial")) {
      return <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">⚡ Partial Relief</span>
    } else {
      return <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">✗ No Relief</span>
    }
  }

  const getHealthStatusIcon = (healthStatus: string) => {
    const status = healthStatus.toLowerCase()
    if (status.includes("improving") || status.includes("better")) {
      return <Activity className="h-5 w-5 text-green-500" />
    } else if (status.includes("worsening") || status.includes("worse")) {
      return <Activity className="h-5 w-5 text-red-500" />
    } else {
      return <Activity className="h-5 w-5 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          Patient Feedback Analysis
        </h1>
        <p className="text-muted-foreground">
          Share your experience with the medicine and get AI-powered health insights
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Feedback</CardTitle>
            <CardDescription>
              Please provide detailed information about your experience with the medicine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Your Name *</Label>
                <Input
                  id="patientName"
                  placeholder="Enter your name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback *</Label>
                <textarea
                  id="feedback"
                  className="w-full min-h-[200px] p-3 border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Please describe:&#10;• How are you feeling now?&#10;• Did the medicine help?&#10;• Any side effects you experienced?&#10;• Any questions or concerns?&#10;&#10;Example: I took the medicine 2 days ago for my headache. The headache has reduced but I'm experiencing mild nausea..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters required
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || feedbackText.trim().length < 10}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Analyze Feedback
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <div className="space-y-4">
          {analysis ? (
            <>
              {/* Emergency Alert */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getEmergencyBadge(analysis.emergency_risk)}
                </CardContent>
              </Card>

              {/* Health Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Health Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Health Status */}
                  <div className="flex items-start gap-3">
                    {getHealthStatusIcon(analysis.health_status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Health Status</p>
                      <p className="text-sm mt-1">{analysis.health_status}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Relief Status */}
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-pink-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Relief Status</p>
                      {getReliefBadge(analysis.relief_status)}
                    </div>
                  </div>

                  <Separator />

                  {/* Side Effects */}
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Side Effects</p>
                      <p className="text-sm mt-1">{analysis.side_effects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Patient Doubts */}
              {analysis.patient_doubts && analysis.patient_doubts.toLowerCase() !== "none" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-blue-500" />
                      Your Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysis.patient_doubts}</p>
                  </CardContent>
                </Card>
              )}

              {/* App Suggestions */}
              {analysis.app_suggestions && analysis.app_suggestions.toLowerCase() !== "none" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysis.app_suggestions}</p>
                  </CardContent>
                </Card>
              )}

              {/* AI Response */}
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    AI Healthcare Assistant Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{analysis.ai_response}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Analyzed at: {new Date(analysis.analyzed_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Submit your feedback to see AI-powered health analysis
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
