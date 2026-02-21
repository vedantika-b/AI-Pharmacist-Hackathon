"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Mic, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

const initialMessages: Message[] = [
  {
    id: "1",
    type: "ai",
    content: "Hello! I'm your AI Pharmacist assistant. How can I help you today? You can ask me about medications, dosages, drug interactions, or any health-related questions.",
    timestamp: new Date()
  }
]

const mockAIResponses = [
  "Based on your query, I recommend consulting with a healthcare professional for personalized advice. However, I can provide general information about this medication.",
  "That's a great question! Let me help you understand this better. The typical dosage for this medication is...",
  "I understand your concern. Drug interactions can be serious, so it's important to check with your pharmacist or doctor.",
  "This medication is commonly used to treat that condition. Let me share some important information you should know.",
  "For best results, this medication should be taken as prescribed. Here are some helpful tips..."
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)],
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
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
        <h1 className="text-4xl font-bold mb-2">AI Pharmacist Chat</h1>
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
              variant="outline"
              size="icon"
              className="shrink-0 h-12 w-12"
              title="Voice input (UI only)"
            >
              <Mic className="h-5 w-5" />
            </Button>
            <div className="flex-1 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
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
