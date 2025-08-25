import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Play, FileText, Settings, Download } from "lucide-react"
import Link from "next/link"
import { CurrentUserAvatar } from "@/components/current-user-avatar"
import { BackButton } from "@/components/ui/back-button"

interface CourseHeaderProps {
  course: {
    id: string
    title: string
    description?: string
    source_type: string
    source_url?: string
    created_at: string
  }
}

export function CourseHeader({ course }: CourseHeaderProps) {
  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "youtube_playlist":
        return <Play className="w-4 h-4" />
      case "uploaded_document":
        return <FileText className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case "youtube_playlist":
        return "YouTube Playlist"
      case "uploaded_document":
        return "Document Upload"
      default:
        return "Custom Course"
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-4">
            <BackButton className="mb-4" />
          </div>
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
              {getSourceIcon(course.source_type)}
              {getSourceLabel(course.source_type)}
            </Badge>
          </div>

          {course.description && <p className="text-gray-600 mb-4">{course.description}</p>}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Created {new Date(course.created_at).toLocaleDateString()}</span>
            {course.source_url && (
              <a
                href={course.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                View Source
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/courses/${course.id}/import`}>
              <Download className="w-4 h-4 mr-2" />
              Import Content
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <div className="ml-4">
            <CurrentUserAvatar />
          </div>
        </div>
      </div>
    </div>
  )
}
