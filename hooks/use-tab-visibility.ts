"use client"

import { useState, useEffect, useCallback } from "react"

interface UseTabVisibilityOptions {
  onVisibilityChange?: (isVisible: boolean) => void
  onTabHidden?: () => void
  onTabVisible?: () => void
  enablePiPTrigger?: boolean
  pipTriggerDelay?: number // delay in ms before triggering PiP
}

export function useTabVisibility(options: UseTabVisibilityOptions = {}) {
  const [isVisible, setIsVisible] = useState(!document.hidden)
  const [timeHidden, setTimeHidden] = useState(0)
  const [pipTriggered, setPipTriggered] = useState(false)

  const {
    onVisibilityChange,
    onTabHidden,
    onTabVisible,
    enablePiPTrigger = false,
    pipTriggerDelay = 2000, // 2 seconds default
  } = options

  const handleVisibilityChange = useCallback(() => {
    const visible = !document.hidden
    setIsVisible(visible)

    if (visible) {
      setTimeHidden(0)
      setPipTriggered(false)
      onTabVisible?.()
    } else {
      onTabHidden?.()
    }

    onVisibilityChange?.(visible)
  }, [onVisibilityChange, onTabHidden, onTabVisible])

  // Handle PiP trigger with delay
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null

    if (!isVisible && enablePiPTrigger && !pipTriggered) {
      timeout = setTimeout(() => {
        setPipTriggered(true)
      }, pipTriggerDelay)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [isVisible, enablePiPTrigger, pipTriggered, pipTriggerDelay])

  // Track time hidden
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (!isVisible) {
      interval = setInterval(() => {
        setTimeHidden(prev => prev + 1000)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isVisible])

  // Add event listeners
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also listen for focus/blur events as backup
    window.addEventListener('focus', () => {
      if (document.hidden === false) {
        handleVisibilityChange()
      }
    })
    
    window.addEventListener('blur', () => {
      if (document.hidden === true) {
        handleVisibilityChange()
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
      window.removeEventListener('blur', handleVisibilityChange)
    }
  }, [handleVisibilityChange])

  const resetPipTrigger = useCallback(() => {
    setPipTriggered(false)
  }, [])

  return {
    isVisible,
    timeHidden,
    pipTriggered,
    resetPipTrigger,
  }
}
