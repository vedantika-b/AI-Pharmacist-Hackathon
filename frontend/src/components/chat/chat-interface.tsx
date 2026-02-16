'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/stores/chat'
import { useAuth } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { cn, formatDateTime, getConfidenceBadgeColor } from '@/lib/utils'
import { OrderResponse } from '@/types'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, addMessage, isLoading, setLoading } = useChat()
  const { user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing || !user) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message
    addMessage({
      role: 'user',
      content: userMessage,
    })

    setIsProcessing(true)
    setLoading(true)

    try {
      // Mock order creation - in real app, this would parse the message first
      // For demo, we'll create a simple order structure
      const orderRequest = {
        user_id: user.id,
        items: [
          {
            product_id: '550e8400-e29b-41d4-a716-446655440001', // Mock product ID
            quantity: 30,
            prescription_id: '650e8400-e29b-41d4-a716-446655440002' // Mock prescription ID
          }
        ],
        delivery_method: 'pickup' as const,
        notes: userMessage
      }

      const response = await api.createOrder(orderRequest) as OrderResponse

      // Add AI response with order details
      const aiMessage = response.message + 
        `\n\n**Order Details:**\n` +
        `• Order Number: ${response.order_number}\n` +
        `• Status: ${response.status}\n` +
        `• Total: $${response.total.toFixed(2)}\n` +
        `• AI Confidence: ${(response.llm_confidence * 100).toFixed(1)}%`

      addMessage({
        role: 'assistant',
        content: aiMessage,
        metadata: {
          intent: response.intent_detected,
          confidence: response.llm_confidence,
          order_id: response.order_id
        }
      })

      // Show warnings if any
      if (response.warnings.length > 0) {
        addMessage({
          role: 'assistant',
          content: `⚠️ **Warnings:**\n${response.warnings.join('\n')}`
        })
      }

    } catch (error: any) {
      addMessage({
        role: 'assistant',
        content: `I apologize, but I encountered an error processing your request: ${error.message || 'Unknown error'}. Please try again or contact support if the issue persists.`
      })
    } finally {
      setIsProcessing(false)
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Pharmacist</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isProcessing ? 'Processing...' : 'Online'}
            </p>
          </div>
        </div>
        <Badge variant="secondary">Beta</Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Welcome to AI Pharmacist
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              I can help you order medications, check prescriptions, and answer health questions.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setInput("I need to refill my blood pressure medication")}
              >
                Refill prescription
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInput("What are the side effects of metformin?")}
              >
                Medication info
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInput("Check my order status")}
              >
                Order status
              </Button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 message-enter',
              message.role === 'user' && 'flex-row-reverse'
            )}
          >
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 dark:bg-gray-800'
            )}>
              {message.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            <div className={cn(
              'flex-1 max-w-xs sm:max-w-md lg:max-w-lg',
              message.role === 'user' && 'flex justify-end'
            )}>
              <Card className={cn(
                'p-3',
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-gray-50 dark:bg-gray-800'
              )}>
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>

                {/* Metadata for AI messages */}
                {message.role === 'assistant' && message.metadata && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-2 text-xs">
                    {message.metadata.intent && (
                      <Badge variant="outline" className="text-xs">
                        {message.metadata.intent}
                      </Badge>
                    )}
                    {message.metadata.confidence && (
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getConfidenceBadgeColor(message.metadata.confidence))}
                      >
                        {(message.metadata.confidence * 100).toFixed(1)}% confident
                      </Badge>
                    )}
                    {message.metadata.order_id && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Order created
                      </Badge>
                    )}
                  </div>
                )}

                <div className="mt-2 text-xs opacity-70">
                  {formatDateTime(message.timestamp)}
                </div>
              </Card>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <Card className="p-3 bg-gray-50 dark:bg-gray-800">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about medications, order refills, or get health information..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}