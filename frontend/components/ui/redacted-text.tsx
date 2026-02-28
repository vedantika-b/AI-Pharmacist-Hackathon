"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { redact, RedactionType } from "@/lib/privacy-utils"
import { Shield } from "lucide-react"

interface RedactedTextProps {
  /**
   * The sensitive text to display with partial redaction
   */
  text: string
  /**
   * Type of redaction to apply
   */
  type: RedactionType
  /**
   * Optional className for styling
   */
  className?: string
  /**
   * Show shield icon to indicate redacted content
   */
  showIcon?: boolean
  /**
   * Type of data being redacted (for accessibility)
   */
  ariaLabel?: string
}

/**
 * RedactedText Component
 * 
 * Displays sensitive information with VIP-style partial redaction.
 * Shows only first and last characters with asterisks in between.
 * 
 * @example
 * // Name redaction
 * <RedactedText text="John Doe" type="name" />
 * // Output: J*** D**
 * 
 * @example
 * // Email redaction
 * <RedactedText text="john@example.com" type="email" />
 * // Output: j***@example.com
 * 
 * @example
 * // Phone redaction
 * <RedactedText text="9876543210" type="phone" />
 * // Output: 98******10
 */
export function RedactedText({
  text,
  type,
  className,
  showIcon = false,
  ariaLabel = "Redacted information"
}: RedactedTextProps) {
  if (!text) {
    return <span className={cn("text-muted-foreground italic", className)}>Not set</span>
  }

  const redactedText = redact(text, type)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && (
        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span 
        className="font-mono tracking-wide text-foreground/90"
        aria-label={ariaLabel}
        role="text"
        title="Redacted for privacy"
      >
        {redactedText}
      </span>
    </div>
  )
}

/**
 * RedactedInput Component
 * 
 * An input field that displays redacted value but allows editing.
 * Shows partially masked preview of existing value.
 */
interface RedactedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Current value
   */
  value: string
  /**
   * Change handler
   */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /**
   * Type of redaction for display
   */
  redactionType: RedactionType
  /**
   * Additional className
   */
  className?: string
}

export function RedactedInput({
  value,
  onChange,
  redactionType,
  className,
  placeholder,
  ...props
}: RedactedInputProps) {
  const [isFocused, setIsFocused] = React.useState(false)

  // Show redacted version when not focused, actual value when focused
  const displayValue = isFocused ? value : (value ? redact(value, redactionType) : '')

  return (
    <div className="relative">
      <input
        {...props}
        type="text"
        value={isFocused ? value : displayValue}
        onChange={onChange}
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        placeholder={placeholder}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !isFocused && value && "font-mono tracking-wide",
          className
        )}
      />
      {!isFocused && value && (
        <Shield className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      )}
    </div>
  )
}

/**
 * RedactedList Component
 * 
 * Displays a list of redacted items (e.g., allergies, conditions)
 */
interface RedactedListProps {
  items: string[]
  type: RedactionType
  className?: string
  emptyMessage?: string
}

export function RedactedList({
  items,
  type,
  className,
  emptyMessage = "No items"
}: RedactedListProps) {
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground italic text-sm">{emptyMessage}</span>
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border"
        >
          <Shield className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-mono tracking-wide">
            {redact(item, type)}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * RedactionBadge Component
 * 
 * A small badge indicating content is redacted
 */
export function RedactionBadge({ className }: { className?: string }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 text-xs font-medium",
      className
    )}>
      <Shield className="h-3 w-3" />
      <span>Redacted</span>
    </div>
  )
}
