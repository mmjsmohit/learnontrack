"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProgressTracker } from "@/components/progress/progress-tracker"
import { BookOpen, Play, FileText, ClipboardList, HelpCircle, Clock, ExternalLink, Eye } from "lucide-react"
import Link from "next/link"

interface CourseItem {
  id: string
  title: string
  description?: string
  item_type: string
  content_url?: string
  duration_minutes?: number
  order_index: number
  user_progress?: Array<{
    status: string
    progress_percentage: number
    time_spent_minutes: number
    completed_at?: string
  }>
}

interface CourseItemsListProps {
  courseItems: CourseItem[]
}

export function CourseItemsList({ courseItems }: CourseItemsListProps) {
  const getItemIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-5 h-5 text-red-600" />
      case "reading":
        return <BookOpen className="w-5 h-5 text-blue-600" />
      case "assignment":
        return <ClipboardList className="w-5 h-5 text-green-600" />
      case "quiz":
        return <HelpCircle className="w-5 h-5 text-purple-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
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

  if (courseItems.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No course items yet</h3>
          <p className="text-gray-600">Add content to start tracking your progress</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
        <span className="text-sm text-gray-500">{courseItems.length} items</span>
      </div>

      <div className="space-y-3">
        {courseItems.map((item) => {
          const progress = item.user_progress?.[0]
          const status = progress?.status || "not_started"
          const progressPercentage = progress?.progress_percentage || 0

          return (
            <Card key={item.id} className="border-l-4 border-l-blue-600">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getItemIcon(item.item_type)}</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-medium text-gray-900">{item.title}</CardTitle>
                      {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                    </div>
                  </div>
                  <Badge className={getItemTypeColor(item.item_type)}>{item.item_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {item.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {item.duration_minutes} min
                      </span>
                    )}
                    {item.content_url && (
                      <a
                        href={item.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open
                      </a>
                    )}
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/courses/${item.id.split("-")[0]}/items/${item.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Link>
                    </Button>
                  </div>

                  <ProgressTracker
                    courseItemId={item.id}
                    initialStatus={status as any}
                    initialProgress={progressPercentage}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
