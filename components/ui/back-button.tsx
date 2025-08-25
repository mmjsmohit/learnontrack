"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

interface BackButtonProps {
  fallbackRoute?: string
  customLabel?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  showOnPaths?: string[]
  hideOnPaths?: string[]
}

export function BackButton({
  fallbackRoute = "/dashboard",
  customLabel,
  variant = "outline",
  size = "sm", 
  className = "",
  showOnPaths = [],
  hideOnPaths = ["/dashboard", "/", "/auth/login", "/auth/signup"]
}: BackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Determine if back button should be visible
  const shouldShow = () => {
    // If hideOnPaths is specified and current path matches, hide
    if (hideOnPaths.some(path => pathname === path || pathname.startsWith(path))) {
      return false
    }
    
    // If showOnPaths is specified, only show on those paths
    if (showOnPaths.length > 0) {
      return showOnPaths.some(path => pathname === path || pathname.startsWith(path))
    }
    
    // Default: show on all paths except the hideOnPaths
    return true
  }

  // Determine back destination based on current path
  const getBackDestination = () => {
    // Course detail pages go back to dashboard
    if (pathname.match(/^\/courses\/[^\/]+$/) && !pathname.includes('/items/')) {
      return "/dashboard"
    }
    
    // Course sub-pages (import, parse) go back to course detail
    if (pathname.match(/^\/courses\/[^\/]+\/(import|parse)/)) {
      const courseId = pathname.split('/')[2]
      return `/courses/${courseId}`
    }
    
    // Course item pages go back to course detail  
    if (pathname.match(/^\/courses\/[^\/]+\/items\/[^\/]+/)) {
      const courseId = pathname.split('/')[2]
      return `/courses/${courseId}`
    }
    
    // Profile and other pages go back to dashboard
    if (pathname === "/profile") {
      return "/dashboard"
    }
    
    // Default fallback
    return fallbackRoute
  }

  // Get appropriate label based on destination
  const getLabel = () => {
    if (customLabel) return customLabel
    
    const destination = getBackDestination()
    if (destination === "/dashboard") return "Back to Dashboard"
    if (destination.includes("/courses/")) return "Back to Course" 
    return "Back"
  }

  if (!shouldShow()) {
    return null
  }

  const destination = getBackDestination()
  const label = getLabel()

  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link href={destination}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {label}
      </Link>
    </Button>
  )
}
