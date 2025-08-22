import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar } from "@/components/progress/progress-bar"
import { calculateProgressStats } from "@/lib/progress/progress-utils"
import { CheckCircle, Clock, TrendingUp } from "lucide-react"

interface CourseProgressProps {
  courseItems: Array<{
    id: string
    user_progress?: Array<{
      status: string
      progress_percentage: number
      time_spent_minutes: number
    }>
  }>
}

export function CourseProgress({ courseItems }: CourseProgressProps) {
  // Extract progress data
  const progressData = courseItems.map((item) => {
    const progress = item.user_progress?.[0]
    return {
      status: progress?.status || "not_started",
      progress_percentage: progress?.progress_percentage || 0,
      time_spent_minutes: progress?.time_spent_minutes || 0,
    }
  })

  const stats = calculateProgressStats(progressData)

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar progress={stats.completionPercentage} size="lg" showLabel />

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Completed</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{stats.completedItems}</div>
            </div>

            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">In Progress</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{stats.inProgressItems}</div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Time Spent</span>
              <span className="font-medium">{formatTime(stats.totalTimeSpent)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-600">Remaining Items</span>
              <span className="font-medium">{stats.notStartedItems}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Items</span>
              <span className="font-medium">{stats.totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="font-medium">{stats.completionPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average per Item</span>
              <span className="font-medium">
                {stats.totalItems > 0 ? formatTime(Math.round(stats.totalTimeSpent / stats.totalItems)) : "0m"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
