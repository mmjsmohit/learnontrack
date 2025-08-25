import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarLayout } from "@/components/sidebar-layout"
import { CreateCourseForm } from "@/components/courses/create-course-form"

export default async function NewCoursePage() {
  console.log("[v0] NewCoursePage: Starting authentication check")

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  console.log("[v0] NewCoursePage: Auth result", {
    hasUser: !!data?.user,
    error: error?.message,
    userId: data?.user?.id,
  })

  if (error || !data?.user) {
    console.log("[v0] NewCoursePage: Redirecting to login due to auth failure")
    redirect("/auth/login")
  }

  console.log("[v0] NewCoursePage: User authenticated, rendering page")

  return (
    <SidebarLayout>
      <div className="py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Course</h1>
            <p className="text-gray-600 mt-2">Create a new course to start tracking your learning progress</p>
          </div>
          <CreateCourseForm />
        </div>
      </div>
    </SidebarLayout>
  )
}
