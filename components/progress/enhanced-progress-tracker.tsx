"use client"

import { useState, useEffect } from "react"
import { SwipeButton } from "@/components/ui/swipe-button"
import { useConfetti } from "@/hooks/use-confetti"
import { usePictureInPicture } from "@/hooks/use-picture-in-picture"
import { PiPPermissionHandler } from "./pip-permission-handler"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, Clock, PictureInPicture, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedProgressTrackerProps {
  courseItemId: string
  courseItemTitle: string
  courseTitle?: string
  courseId: string
  initialStatus: "not_started" | "in_progress" | "completed"
  initialProgress?: number
  onProgressUpdate?: (status: string, progress: number) => void
}

export function EnhancedProgressTracker({
  courseItemId,
  courseItemTitle,
  courseTitle,
  courseId,
  initialStatus,
  initialProgress = 0,
  onProgressUpdate,
}: EnhancedProgressTrackerProps) {
  const [status, setStatus] = useState(initialStatus)
  const [progress, setProgress] = useState(initialProgress)
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    isSupported: isPiPSupported,
    isOpen: isPiPOpen,
    currentItem,
    openPiP,
    closePiP,
    updateProgress: updatePiPProgress,
    returnToMain,
    pipWindow
  } = usePictureInPicture()

  // Set up PiP event listeners
  useEffect(() => {
    if (pipWindow && currentItem?.id === courseItemId) {
      const handleReturnToMain = () => {
        returnToMain()
      }

      const handleCompleteProgress = () => {
        updateProgress("completed", 100)
      }

      pipWindow.addEventListener('returnToMain', handleReturnToMain)
      pipWindow.addEventListener('completeProgress', handleCompleteProgress)

      return () => {
        pipWindow.removeEventListener('returnToMain', handleReturnToMain)
        pipWindow.removeEventListener('completeProgress', handleCompleteProgress)
      }
    }
  }, [pipWindow, currentItem, courseItemId, returnToMain])

  // Sync PiP progress when local progress updates
  useEffect(() => {
    if (isPiPOpen && currentItem?.id === courseItemId) {
      updatePiPProgress(status, progress)
    }
  }, [status, progress, isPiPOpen, currentItem?.id, courseItemId]) // Removed updatePiPProgress from deps to avoid circular dependency

  const updateProgress = async (newStatus: string, newProgress?: number) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseItemId,
          status: newStatus,
          progressPercentage: newProgress || (newStatus === "completed" ? 100 : progress),
        }),
      })

      if (response.ok) {
        const finalProgress = newProgress !== undefined ? newProgress : (newStatus === "completed" ? 100 : progress)
        setStatus(newStatus as any)
        setProgress(finalProgress)
        onProgressUpdate?.(newStatus, finalProgress)

        // Trigger confetti for completion
        if (newStatus === "completed") {
          useConfetti(100, 70, { y: 0.6 })
        }
      }
    } catch (error) {
      console.error("Error updating progress:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePiPToggle = async () => {
    if (isPiPOpen && currentItem?.id === courseItemId) {
      closePiP()
    } else if (status === "in_progress") {
      try {
        await openPiP({
          id: courseItemId,
          title: courseItemTitle,
          courseTitle,
          status,
          progress,
          courseId,
          itemId: courseItemId
        })
      } catch (error) {
        console.error('Failed to open Picture-in-Picture:', error)
        // You could show a user-friendly error message here
        alert('Picture-in-Picture requires user permission. Please click the button when you want to enable it.')
      }
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "in_progress":
        return <Clock className="w-5 h-5 text-orange-600" />
      default:
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const showPiPControls = isPiPSupported && status === "in_progress"
  const isCurrentPiPItem = isPiPOpen && currentItem?.id === courseItemId

  return (
    <div className="space-y-3">
      {/* Main Progress Controls */}
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <button
          onClick={() => {
            if (status === "completed") {
              updateProgress("not_started", 0)
            } else if (status === "in_progress") {
              updateProgress("completed", 100)
            } else {
              updateProgress("in_progress", 25)
            }
          }}
          disabled={isLoading}
          className="flex items-center gap-2 hover:opacity-75 transition-opacity"
        >
          {getStatusIcon()}
        </button>

        <Badge variant="secondary" className={cn("capitalize", getStatusColor())}>
          {status.replace("_", " ")}
        </Badge>
      </div>

      {/* Progress Bar for In Progress Items */}
      {status === "in_progress" && (
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{progress}% complete</span>
            
          </div>

          {/* Swipe to Complete */}
          <div className="flex items-center gap-2 flex-wrap">
            <SwipeButton
              onSwipeComplete={() => {
                if (!isLoading) {
                  updateProgress("completed", 100)
                }
              }}
              className="h-9 w-[200px] md:w-[220px]"
            >
              Swipe to complete
            </SwipeButton>
          </div>
        </div>
      )}

      {/* PiP Status Indicator */}
      {isCurrentPiPItem && (
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-md">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <span className="text-sm text-purple-700 font-medium">
            Picture-in-Picture active
          </span>
          <span className="text-xs text-purple-600">
            Your progress is being tracked in the floating window
          </span>
        </div>
      )}

      {/* PiP Permission Handler */}
      {status === "in_progress" && (
        <PiPPermissionHandler
          onPermissionGranted={() => {
            // Permission granted, PiP is now available
            console.log('Picture-in-Picture permission granted')
          }}
        >
          <div></div> {/* Empty div when permission is granted */}
        </PiPPermissionHandler>
      )}
    </div>
  )
}
