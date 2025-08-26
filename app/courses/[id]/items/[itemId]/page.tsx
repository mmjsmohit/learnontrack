import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CourseItemDetail } from "@/components/courses/course-item-detail"
import { NotesSection } from "@/components/courses/notes-section"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface CourseItemPageProps {
  params: Promise<{ id: string; itemId: string }>
}

export default async function CourseItemPage({ params }: CourseItemPageProps) {
  const { id, itemId } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch course item with progress
  const { data: courseItem } = await supabase
    .from("course_items")
    .select(`
      *,
      courses (
        id,
        title
      ),
      user_progress (
        status,
        progress_percentage,
        time_spent_minutes,
        completed_at
      )
    `)
    .eq("id", itemId)
    .eq("user_id", data.user.id)
    .single()

  if (!courseItem || courseItem.courses?.id !== id) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={data.user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/courses/${id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CourseItemDetail courseItem={courseItem} />
            </div>
            <div className="lg:col-span-1">
              <NotesSection courseItemId={itemId} courseItemType={courseItem.item_type} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}



