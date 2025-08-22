import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Play, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  title: string
  description: string
  source_type: string
  thumbnail_url?: string
  created_at: string
}

interface CourseGridProps {
  courses: Course[]
}

export function CourseGrid({ courses }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
        <p className="text-gray-600 mb-6">Start your learning journey by adding your first course</p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/courses/new">Add Your First Course</Link>
        </Button>
      </div>
    )
  }

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
        return "YouTube"
      case "uploaded_document":
        return "Document"
      default:
        return "Custom"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">{course.title}</CardTitle>
              <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                {getSourceIcon(course.source_type)}
                {getSourceLabel(course.source_type)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {course.description && <p className="text-sm text-gray-600 mb-4 line-clamp-3">{course.description}</p>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Added {new Date(course.created_at).toLocaleDateString()}</span>
              <Button asChild size="sm" variant="outline">
                <Link href={`/courses/${course.id}`}>
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
