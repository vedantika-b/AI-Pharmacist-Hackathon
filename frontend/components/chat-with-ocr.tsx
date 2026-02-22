import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Upload, Loader2, AlertCircle, CheckCircle, Image as ImageIcon, X } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { useAuth } from "@/contexts/AuthContext"
import { t } from "@/lib/translations"

interface Message {
  type: "user" | "bot"
  text: string
  timestamp: Date
  medications?: Array<{ name: string; dosage?: string }>
  ocrData?: {
    status: string
    confidence: number
    metadata: any
  }
}

export default function ChatWithOCR() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { language } = useLanguage()
  const { user } = useAuth()

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file")
        return
      }

      setSelectedImage(file)
      setError(null)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const convertImageToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) {
      setError("Please enter a message or select an image")
      return
    }

    try {
      setLoading(true)
      setError(null)

      let imageBase64 = ""
      if (selectedImage) {
        imageBase64 = await convertImageToBase64(selectedImage)
        // Add user message about image upload
        setMessages((prev) => [
          ...prev,
          {
            type: "user",
            text: `📷 ${selectedImage.name}`,
            timestamp: new Date(),
          },
        ])
      }

      // Add user message
      if (inputText.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            type: "user",
            text: inputText,
            timestamp: new Date(),
          },
        ])
      }

      // Send to backend
      const response = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputText || "Please analyze this prescription",
          user_id: user?.id,
          image_base64: imageBase64,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()

      // Add bot response
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: data.response,
          timestamp: new Date(),
          medications: data.medications,
          ocrData: data.ocr_data,
        },
      ])

      // Clear inputs and image
      setInputText("")
      setSelectedImage(null)
      setImagePreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
      console.error("Chat error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💊 AI Chat with OCR
          </CardTitle>
          <CardDescription>
            Ask about medications or upload a prescription image for instant analysis
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-2">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-muted-foreground">
                    Start by uploading a prescription or typing your question
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                      msg.type === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>

                    {/* Display medications if OCR data exists */}
                    {msg.ocrData && msg.medications && msg.medications.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold opacity-75">
                          📋 Medications Found:
                        </p>
                        {msg.medications.map((med, i) => (
                          <div key={i} className="text-xs opacity-90">
                            <span className="font-medium">{med.name}</span>
                            {med.dosage && <span> • {med.dosage}</span>}
                          </div>
                        ))}
                        {msg.ocrData && (
                          <p className="text-xs opacity-75 mt-2">
                            OCR Confidence: {(msg.ocrData.confidence * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs opacity-60 mt-1">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-4 relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded-lg border border-muted"
              />
              <button
                onClick={() => {
                  setSelectedImage(null)
                  setImagePreview(null)
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Input Area */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Prescription
              </Button>
            </div>

            <div className="flex gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  language === "hi"
                    ? "अपना प्रश्न लिखें..."
                    : language === "mr"
                      ? "आपला प्रश्न लिहा..."
                      : "Ask about your medications..."
                }
                className="min-h-12 resize-none flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || (!inputText.trim() && !selectedImage)}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
