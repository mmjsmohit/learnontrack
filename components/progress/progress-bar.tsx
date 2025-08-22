import { cn } from "@/lib/utils"

interface ProgressBarProps {
  progress: number
  className?: string
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function ProgressBar({ progress, className, size = "md", showLabel = false }: ProgressBarProps) {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{clampedProgress}%</span>
        </div>
      )}
      <div className={cn("bg-gray-200 rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}
