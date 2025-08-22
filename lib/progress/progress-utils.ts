export interface ProgressStats {
  totalItems: number
  completedItems: number
  inProgressItems: number
  notStartedItems: number
  completionPercentage: number
  totalTimeSpent: number
}

export function calculateProgressStats(progressData: any[]): ProgressStats {
  const totalItems = progressData.length
  const completedItems = progressData.filter((p) => p.status === "completed").length
  const inProgressItems = progressData.filter((p) => p.status === "in_progress").length
  const notStartedItems = progressData.filter((p) => p.status === "not_started").length
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  const totalTimeSpent = progressData.reduce((total, p) => total + (p.time_spent_minutes || 0), 0)

  return {
    totalItems,
    completedItems,
    inProgressItems,
    notStartedItems,
    completionPercentage,
    totalTimeSpent,
  }
}

export function getProgressColor(status: string): string {
  switch (status) {
    case "completed":
      return "text-green-600"
    case "in_progress":
      return "text-orange-600"
    default:
      return "text-gray-400"
  }
}

export function getProgressBgColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-100"
    case "in_progress":
      return "bg-orange-100"
    default:
      return "bg-gray-100"
  }
}
