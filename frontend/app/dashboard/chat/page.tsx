"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Mic, Bot, User, Volume2, Square } from "lucide-react"
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
}

const initialMessages: Message[] = [
  {
    id: "1",
    type: "ai",
    content: "Hello! I'm your AI Pharmacist assistant. How can I help you today? You can ask me about medications, dosages, drug interactions, or order refills.",
    timestamp: new Date()
  }
]

export default function ChatPage() {
  const { language } = useLanguage()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Voice hooks
  const { isListening, startListening, stopListening } = useVoiceInput({
    language: language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-US",
    onTranscript: (transcript) => {
      setInput(transcript)
    },
    onError: (error) => {
      console.error('Voice error:', error)
    }
  })

  const { isSpeaking, speak, stop } = useTextToSpeech({
    language: language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-US",
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

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput("")
    setIsTyping(true)

    try {
      // Call real API
      const response = await sendChatMessage(userInput, userId || undefined)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: response.response,
        timestamp: new Date(),
        intent: response.intent,
        confidence: response.confidence,
        suggestions: response.suggestions
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    
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
          <div className="max-w-4xl mx-auto flex gap-4">
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
                placeholder={t('chatPlaceholder', language)}
                className="flex-1 h-12"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
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
