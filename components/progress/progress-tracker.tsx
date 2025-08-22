"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressTrackerProps {
  courseItemId: string
  initialStatus: "not_started" | "in_progress" | "completed"
  initialProgress?: number
  onProgressUpdate?: (status: string, progress: number) => void
}

export function ProgressTracker({
  courseItemId,
  initialStatus,
  initialProgress = 0,
  onProgressUpdate,
}: ProgressTrackerProps) {
  const [status, setStatus] = useState(initialStatus)
  const [progress, setProgress] = useState(initialProgress)
  const [isLoading, setIsLoading] = useState(false)

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
        setStatus(newStatus as any)
        if (newProgress !== undefined) {
          setProgress(newProgress)
        }
        onProgressUpdate?.(newStatus, newProgress || progress)
      }
    } catch (error) {
      console.error("Error updating progress:", error)
    } finally {
      setIsLoading(false)
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

  return (
    <div className="flex items-center gap-3">
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

      {status === "in_progress" && (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => updateProgress("in_progress", 50)} disabled={isLoading}>
            50%
          </Button>
          <Button size="sm" variant="outline" onClick={() => updateProgress("in_progress", 75)} disabled={isLoading}>
            75%
          </Button>
          <Button size="sm" variant="outline" onClick={() => updateProgress("completed", 100)} disabled={isLoading}>
            Complete
          </Button>
        </div>
      )}
    </div>
  )
}
