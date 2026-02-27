"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-10 h-10 border-2 transition-all duration-300"
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full w-10 h-10 border-2 hover:scale-110 transition-all duration-300 hover:shadow-lg"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform duration-500" />
      ) : (
        <Moon className="h-5 w-5 rotate-0 scale-100 transition-transform duration-500" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
