"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EnhancedProgressTracker } from "@/components/progress/enhanced-progress-tracker"
import { Button } from "@/components/ui/button"
import { BookOpen, Play, FileText, ClipboardList, HelpCircle, Clock, ExternalLink } from "lucide-react"
import { extractVideoId } from "@/lib/youtube/youtube-parser"
import { usePictureInPicture } from "@/hooks/use-picture-in-picture"
import { useState, useEffect } from "react"

interface CourseItemDetailProps {
  courseItem: {
    id: string
    title: string
    description?: string
    item_type: string
    content_url?: string
    duration_minutes?: number
    metadata?: any
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
}

export function CourseItemDetail({ courseItem }: CourseItemDetailProps) {
  const [currentStatus, setCurrentStatus] = useState(courseItem.user_progress?.[0]?.status || "not_started")
  const [currentProgress, setCurrentProgress] = useState(courseItem.user_progress?.[0]?.progress_percentage || 0)
  
  const { isSupported: isPiPSupported, openPiP } = usePictureInPicture()

  const isYouTubeUrl = (url: string): boolean => {
    return extractVideoId(url) !== null
  }

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoId = extractVideoId(url)
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  const handleProgressUpdate = (status: string, progress: number) => {
    setCurrentStatus(status)
    setCurrentProgress(progress)
  }

  const handleOpenContent = async (url: string) => {
    // If user is in progress and PiP is supported, open PiP before navigating
    if (currentStatus === "in_progress" && isPiPSupported) {
      try {
        await openPiP({
          id: courseItem.id,
          title: courseItem.title,
          courseTitle: courseItem.courses?.title,
          status: currentStatus as any,
          progress: currentProgress,
          courseId: courseItem.courses?.id || "",
          itemId: courseItem.id
        })
        
        // Small delay to ensure PiP opens before navigation
        setTimeout(() => {
          window.open(url, '_blank', 'noopener,noreferrer')
        }, 100)
      } catch (error) {
        console.error('Failed to open PiP:', error)
        // Fallback to normal navigation
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } else {
      // Normal navigation for non-in-progress items or unsupported browsers
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Handle page unload/navigation for PiP trigger
  useEffect(() => {
    if (currentStatus === "in_progress" && isPiPSupported) {
      const handleBeforeUnload = () => {
        // Only trigger PiP if we're navigating away from this page
        if (document.visibilityState === 'visible') {
          openPiP({
            id: courseItem.id,
            title: courseItem.title,
            courseTitle: courseItem.courses?.title,
            status: currentStatus as any,
            progress: currentProgress,
            courseId: courseItem.courses?.id || "",
            itemId: courseItem.id
          }).catch(console.error)
        }
      }

      const handleVisibilityChange = () => {
        // Trigger PiP when page becomes hidden (e.g., switching tabs)
        if (document.visibilityState === 'hidden' && currentStatus === "in_progress") {
          openPiP({
            id: courseItem.id,
            title: courseItem.title,
            courseTitle: courseItem.courses?.title,
            status: currentStatus as any,
            progress: currentProgress,
            courseId: courseItem.courses?.id || "",
            itemId: courseItem.id
          }).catch(console.error)
        }
      }

      window.addEventListener('beforeunload', handleBeforeUnload)
      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [currentStatus, currentProgress, isPiPSupported, courseItem, openPiP])

  const getItemIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-6 h-6 text-red-600" />
      case "reading":
        return <BookOpen className="w-6 h-6 text-blue-600" />
      case "assignment":
        return <ClipboardList className="w-6 h-6 text-green-600" />
      case "quiz":
        return <HelpCircle className="w-6 h-6 text-purple-600" />
      default:
        return <FileText className="w-6 h-6 text-gray-600" />
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



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="mt-1">{getItemIcon(courseItem.item_type)}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-2xl font-bold text-gray-900">{courseItem.title}</CardTitle>
                <Badge className={getItemTypeColor(courseItem.item_type)}>{courseItem.item_type}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">Course: {courseItem.courses?.title}</p>
              {courseItem.description && <p className="text-gray-700 mb-4">{courseItem.description}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* YouTube Video Embed */}
          {courseItem.item_type === "video" && courseItem.content_url && isYouTubeUrl(courseItem.content_url) && (
            <div className="mb-6">
              <div className="aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden bg-black">
                <iframe
                  src={getYouTubeEmbedUrl(courseItem.content_url)!}
                  title={courseItem.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {courseItem.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {courseItem.duration_minutes} min
                </span>
              )}
              {courseItem.content_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenContent(courseItem.content_url!)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 h-auto p-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Content
                </Button>
              )}
            </div>

            <EnhancedProgressTracker
              courseItemId={courseItem.id}
              courseItemTitle={courseItem.title}
              courseTitle={courseItem.courses?.title}
              courseId={courseItem.courses?.id || ""}
              initialStatus={currentStatus as any}
              initialProgress={currentProgress}
              onProgressUpdate={handleProgressUpdate}
            />
          </div>
        </CardContent>
      </Card>

      {courseItem.metadata && Object.keys(courseItem.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(courseItem.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
