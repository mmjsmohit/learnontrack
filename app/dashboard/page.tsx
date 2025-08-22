import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CourseGrid } from "@/components/dashboard/course-grid"
import { StatsCards } from "@/components/dashboard/stats-cards"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch user's courses
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  // Fetch progress stats
  const { data: progressStats } = await supabase.from("user_progress").select("status").eq("user_id", data.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={data.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your learning progress and manage your courses</p>
          </div>

          <StatsCards courses={courses || []} progressStats={progressStats || []} />

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Courses</h2>
            <CourseGrid courses={courses || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
