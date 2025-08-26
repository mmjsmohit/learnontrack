"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressTracker } from "@/components/progress/progress-tracker"
import { 
  BookOpen, 
  Play, 
  FileText, 
  ClipboardList, 
  HelpCircle, 
  Clock, 
  ArrowLeft,
  Timer,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CourseItemPiPProps {
  courseItem: {
    id: string
    title: string
    description?: string
    item_type: string
    duration_minutes?: number
    courses?: {
      id: string
      title: string
    }
    user_progress?: Array<{
      status: string
      progress_percentage: number
      time_spent_minutes: number
      completed_at?: string
    }>
  }
  onReturnToCourse?: () => void
  onClose?: () => void
}

export function CourseItemPiP({ courseItem, onReturnToCourse, onClose }: CourseItemPiPProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(true)

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning])

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  const getItemIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4 text-red-600" />
      case "reading":
        return <BookOpen className="w-4 h-4 text-blue-600" />
      case "assignment":
        return <ClipboardList className="w-4 h-4 text-green-600" />
      case "quiz":
        return <HelpCircle className="w-4 h-4 text-purple-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-100 text-red-800"
      case "reading":
        return "bg-blue-100 text-blue-800"
      case "assignment":
        return "bg-green-100 text-green-800"
      case "quiz":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const progress = courseItem.user_progress?.[0]
  const status = progress?.status || "not_started"
  const progressPercentage = progress?.progress_percentage || 0

  const handleProgressUpdate = (newStatus: string) => {
    if (newStatus === "completed") {
      setIsTimerRunning(false)
    }
  }

  return (
    <div className="pip-container w-full h-full bg-white">
      {/* Custom styles for PiP window */}
      <style jsx>{`
        .pip-container {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          line-height: 1.4;
        }
        
        @media (display-mode: picture-in-picture) {
          .pip-container {
            padding: 8px;
            height: 100vh;
            overflow-y: auto;
          }
        }
      `}</style>

      <div className="space-y-3">
        {/* Header with close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-600">Course in Progress</span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Course Info */}
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {getItemIcon(courseItem.item_type)}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium text-gray-900 line-clamp-2">
                    {courseItem.title}
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    {courseItem.courses?.title}
                  </p>
                </div>
              </div>
              <Badge className={cn("text-xs", getItemTypeColor(courseItem.item_type))}>
                {courseItem.item_type}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0 pb-3">
            {courseItem.description && (
              <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                {courseItem.description}
              </p>
            )}

            {/* Timer Section */}
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Time Spent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold text-orange-600">
                  {formatTime(elapsedTime)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="h-6 w-6 p-0"
                >
                  {isTimerRunning ? (
                    <div className="w-2 h-2 bg-orange-600 rounded-sm"></div>
                  ) : (
                    <Play className="w-3 h-3 text-orange-600" />
                  )}
                </Button>
              </div>
            </div>

            {/* Duration Info */}
            {courseItem.duration_minutes && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                <Clock className="w-3 h-3" />
                <span>Expected: {courseItem.duration_minutes} min</span>
              </div>
            )}

            {/* Progress Tracker */}
            <div className="mb-3">
              <ProgressTracker
                courseItemId={courseItem.id}
                initialStatus={status as any}
                initialProgress={progressPercentage}
                onProgressUpdate={handleProgressUpdate}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {onReturnToCourse && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReturnToCourse}
                  className="w-full text-xs h-8 pip-only-button"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Return to Course
                </Button>
              )}
              
              <div className="text-xs text-center text-gray-500 mt-2">
                Stay focused! 💪 Complete this item to unlock the next one.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
