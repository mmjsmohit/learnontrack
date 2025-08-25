import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CourseHeader } from "@/components/courses/course-header"
import { CourseItemsList } from "@/components/courses/course-items-list"
import { CourseProgress } from "@/components/courses/course-progress"

interface CoursePageProps {
  params: Promise<{ id: string }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch course details
  const { data: course } = await supabase.from("courses").select("*").eq("id", id).eq("user_id", data.user.id).single()

  if (!course) {
    redirect("/dashboard")
  }

  // Fetch course items with progress
  const { data: courseItems } = await supabase
    .from("course_items")
    .select(`
      *,
      user_progress (
        status,
        progress_percentage,
        time_spent_minutes,
        completed_at
      )
    `)
    .eq("course_id", id)
    .eq("user_id", data.user.id)
    .order("order_index")

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={data.user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <CourseHeader course={course} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CourseItemsList courseItems={courseItems || []} courseId={id} />
            </div>
            <div className="lg:col-span-1">
              <CourseProgress courseItems={courseItems || []} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
