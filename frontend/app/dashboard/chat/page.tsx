"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Mic, Bot, User, Volume2, Square, ImagePlus, X, FileImage } from "lucide-react"
import { cn } from "@/lib/utils"
import { sendChatMessage } from "@/lib/api"
import { getCurrentUser } from "@/lib/supabase"
import { useVoiceInput } from "@/hooks/useVoiceInput"
import { useTextToSpeech } from "@/hooks/useTextToSpeech"
import { useLanguage } from "@/contexts/LanguageContext"
import { t } from "@/lib/translations"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
  suggestions?: string[]
  imagePreview?: string  // For displaying uploaded images
  ocrData?: {
    status: string
    confidence?: number
    medication_count?: number
  }
}

const initialMessages: Message[] = [
  {
    id: "1",
    type: "ai",
    content: "Hello! I'm your AI Pharmacist assistant. How can I help you today?\n\nYou can:\n• Ask about medications, dosages, or drug interactions\n• **Upload a prescription image** using the 📷 button to get it analyzed\n• Order refills or check medicine availability\n• Use voice input by clicking the microphone",
    timestamp: new Date()
  }
]

export default function ChatPage() {
  const { language } = useLanguage()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionId] = useState<string>(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Voice hooks
  const { isListening, startListening, stopListening } = useVoiceInput({
    language: language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN",
    onTranscript: (transcript) => {
      setInput(transcript)
    },
    onError: (error) => {
      console.error('Voice error:', error)
    }
  })

  const { isSpeaking, speak, stop } = useTextToSpeech({
    language: language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN",
    rate: 1,
    pitch: 1,
    volume: 1,
  })

  // Get current user on mount
  useEffect(() => {
    getCurrentUser().then(({ user }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        // Remove data URL prefix for API
        const base64Data = base64.split(',')[1]
        setSelectedImage(base64Data)
        setImagePreview(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearSelectedImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input || (selectedImage ? "📷 Prescription image uploaded" : ""),
      timestamp: new Date(),
      imagePreview: imagePreview || undefined
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input || "Please analyze this prescription image"
    const imageToSend = selectedImage
    setInput("")
    clearSelectedImage()
    setIsTyping(true)

    try {
      // Call real API with image if provided and session ID for context
      const response = await sendChatMessage(userInput, userId || undefined, imageToSend || undefined, sessionId) as {
        response: string
        intent?: string
        confidence?: number
        suggestions?: string[]
        ocr_data?: {
          status: string
          confidence?: number
          medication_count?: number
        }
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: response.response,
        timestamp: new Date(),
        intent: response.intent,
        confidence: response.confidence,
        suggestions: response.suggestions,
        ocrData: response.ocr_data
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "I apologize, but I'm having trouble processing your request right now. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const handleSpeakMessage = (messageId: string, content: string) => {
    if (speakingMessageId === messageId) {
      stop()
      setSpeakingMessageId(null)
    } else {
      setSpeakingMessageId(messageId)
      speak(content)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatMessageHtml = (text: string) => {
    if (!text) return ""
    // Escape HTML to avoid XSS
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

    // Convert **bold** to <strong>
    const withBold = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")

    // Preserve newlines
    return withBold.replace(/\n/g, "<br />")
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">{t('chat', language)} - AI Pharmacist</h1>
        <p className="text-muted-foreground">
          Ask me anything about medications, dosages, interactions, and health advice
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6 max-w-4xl mx-auto">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex gap-4",
                    message.type === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.type === "ai" && (
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                        <Bot className="h-5 w-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-6 py-4 max-w-[80%]",
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {/* Show uploaded image for user messages */}
                    {message.type === "user" && message.imagePreview && (
                      <div className="mb-3">
                        <img 
                          src={message.imagePreview} 
                          alt="Uploaded prescription" 
                          className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-primary-foreground/20"
                        />
                      </div>
                    )}
                    
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.type === "ai" ? (
                        <span dangerouslySetInnerHTML={{ __html: formatMessageHtml(message.content) }} />
                      ) : (
                        message.content
                      )}
                    </p>
                    
                    {/* Show OCR processing badge for AI messages with OCR data */}
                    {message.type === "ai" && message.ocrData && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          <FileImage className="h-3 w-3 mr-1" />
                          OCR: {message.ocrData.status}
                        </Badge>
                        {message.ocrData.medication_count !== undefined && message.ocrData.medication_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {message.ocrData.medication_count} medication(s) found
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Speak button for AI messages */}
                    {message.type === "ai" && (
                      <div className="flex gap-2 mt-3 items-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => handleSpeakMessage(message.id, message.content)}
                          title={speakingMessageId === message.id ? t('speaking', language) : t('voiceOutput', language)}
                        >
                          {speakingMessageId === message.id ? (
                            <Square className="h-4 w-4" fill="currentColor" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Show intent and confidence for AI messages */}
                    {message.type === "ai" && message.intent && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {message.intent.replace('_', ' ')}
                        </Badge>
                        {message.confidence && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(message.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Show suggestions */}
                    {message.type === "ai" && message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-muted-foreground">Quick actions:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className={cn(
                      "text-xs mt-2",
                      message.type === "user" 
                        ? "text-primary-foreground/70" 
                        : "text-muted-foreground"
                    )}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>

                  {message.type === "user" && (
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500">
                        <User className="h-5 w-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                    <Bot className="h-5 w-5 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-6 py-4">
                  <div className="flex gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                      className="w-2 h-2 bg-muted-foreground rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="w-2 h-2 bg-muted-foreground rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="w-2 h-2 bg-muted-foreground rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-6 bg-background">
          {/* Image Preview */}
          {imagePreview && (
            <div className="max-w-4xl mx-auto mb-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <img 
                  src={imagePreview} 
                  alt="Selected prescription" 
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Prescription Image</p>
                  <p className="text-xs text-muted-foreground">Ready to analyze</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSelectedImage}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto flex gap-4">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            
            {/* Image upload button */}
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-12 w-12"
              onClick={() => fileInputRef.current?.click()}
              title="Upload prescription image"
            >
              <ImagePlus className="h-5 w-5" />
            </Button>
            
            <Button
              variant={isListening ? "default" : "outline"}
              size="icon"
              className="shrink-0 h-12 w-12"
              onClick={isListening ? stopListening : startListening}
              title={isListening ? t('listening', language) : t('voiceInput', language)}
            >
              <Mic className={cn("h-5 w-5", isListening && "animate-pulse")} />
            </Button>
            <div className="flex-1 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={imagePreview ? "Ask a question about the prescription..." : t('chatPlaceholder', language)}
                className="flex-1 h-12"
              />
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || isTyping}
                className="h-12 px-6"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4 max-w-4xl mx-auto">
            AI responses are for informational purposes only. Always consult with a healthcare professional for medical advice.
          </p>
        </div>
      </Card>
    </div>
  )
}
