import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileStats } from "@/components/profile/profile-stats"
import { ProfileInfo } from "@/components/profile/profile-info"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile data
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch user course statistics
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      created_at,
      course_items (
        id,
        type,
        user_progress (
          status,
          completed_at
        )
      )
    `)
    .eq("user_id", user.id)

  // Calculate statistics
  const totalCourses = courses?.length || 0
  const totalItems = courses?.reduce((acc, course) => acc + (course.course_items?.length || 0), 0) || 0
  const completedItems =
    courses?.reduce(
      (acc, course) =>
        acc +
        (course.course_items?.filter((item) => item.user_progress?.some((progress) => progress.status === "completed"))
          .length || 0),
      0,
    ) || 0
  const completedCourses =
    courses?.filter((course) => {
      const items = course.course_items || []
      if (items.length === 0) return false
      return items.every((item) => item.user_progress?.some((progress) => progress.status === "completed"))
    }).length || 0

  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <ProfileHeader user={user} profile={profile} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProfileStats
              totalCourses={totalCourses}
              completedCourses={completedCourses}
              totalItems={totalItems}
              completedItems={completedItems}
              overallProgress={overallProgress}
            />
          </div>

          <div>
            <ProfileInfo user={user} profile={profile} />
          </div>
        </div>
      </div>
    </div>
  )
}
