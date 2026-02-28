"use client"

import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MaskedTextProps {
  /**
   * The sensitive text to display/mask
   */
  text: string
  /**
   * Number of characters to show unmasked at the start (default: 0)
   */
  showStart?: number
  /**
   * Number of characters to show unmasked at the end (default: 0)
   */
  showEnd?: number
  /**
   * Character to use for masking (default: '•')
   */
  maskChar?: string
  /**
   * Optional className for styling
   */
  className?: string
  /**
   * Show the toggle button (default: true)
   */
  showToggle?: boolean
  /**
   * Initial visibility state (default: false - masked)
   */
  initiallyVisible?: boolean
  /**
   * Type of data being masked (for accessibility)
   */
  ariaLabel?: string
}

/**
 * MaskedText Component
 * 
 * A reusable component for displaying sensitive information with masking.
 * Shows dots (•••) instead of actual text with a toggle button to reveal/hide.
 * 
 * @example
 * // Basic usage - completely masked
 * <MaskedText text="john@example.com" />
 * 
 * @example
 * // Show first 2 and last 4 characters
 * <MaskedText text="john@example.com" showStart={2} showEnd={4} />
 * 
 * @example
 * // Initially visible
 * <MaskedText text="John Doe" initiallyVisible={true} />
 */
export function MaskedText({
  text,
  showStart = 0,
  showEnd = 0,
  maskChar = "•",
  className,
  showToggle = true,
  initiallyVisible = false,
  ariaLabel = "Sensitive information"
}: MaskedTextProps) {
  const [isVisible, setIsVisible] = useState(initiallyVisible)

  if (!text) {
    return <span className={cn("text-muted-foreground", className)}>Not set</span>
  }

  const getMaskedText = () => {
    if (isVisible) {
      return text
    }

    const length = text.length
    
    // If the text is very short, just mask it completely
    if (length <= showStart + showEnd) {
      return maskChar.repeat(Math.max(length, 8))
    }

    const start = showStart > 0 ? text.substring(0, showStart) : ""
    const end = showEnd > 0 ? text.substring(length - showEnd) : ""
    const middleLength = Math.max(length - showStart - showEnd, 4)
    const middle = maskChar.repeat(middleLength)

    return start + middle + end
  }

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span 
        className="font-mono tracking-wider select-none"
        aria-label={ariaLabel}
        role="text"
        aria-live="polite"
      >
        {getMaskedText()}
      </span>
      
      {showToggle && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleVisibility}
          className="h-6 w-6 p-0 hover:bg-accent"
          aria-label={isVisible ? "Hide sensitive information" : "Show sensitive information"}
        >
          {isVisible ? (
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      )}
    </div>
  )
}

/**
 * MaskedInput Component
 * 
 * An input field that displays masked text but allows editing.
 * Useful for forms where you want to show existing data as masked but allow users to edit.
 */
interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Current value
   */
  value: string
  /**
   * Change handler
   */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /**
   * Show the toggle button (default: true)
   */
  showToggle?: boolean
  /**
   * Initial visibility state (default: false - masked)
   */
  initiallyVisible?: boolean
  /**
   * Additional className
   */
  className?: string
}

export function MaskedInput({
  value,
  onChange,
  showToggle = true,
  initiallyVisible = false,
  className,
  ...props
}: MaskedInputProps) {
  const [isVisible, setIsVisible] = useState(initiallyVisible)

  return (
    <div className="relative">
      <input
        {...props}
        type={isVisible ? "text" : "password"}
        value={value}
        onChange={onChange}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          showToggle && "pr-10",
          className
        )}
      />
      
      {showToggle && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(!isVisible)}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-accent"
          aria-label={isVisible ? "Hide" : "Show"}
          tabIndex={-1}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      )}
    </div>
  )
}
