import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EnhancedContentParser } from "@/components/courses/enhanced-content-parser"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface ParsePageProps {
  params: Promise<{ id: string }>
}

export default async function ParsePage({ params }: ParsePageProps) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={data.user} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/courses/${id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Link>
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parse Course Content</h1>
            <p className="text-gray-600 mt-2">
              Upload files or paste content to automatically extract course components
            </p>
            <p className="text-sm text-gray-500 mt-1">Course: {course.title}</p>
          </div>

          <EnhancedContentParser
            courseId={id}
            onContentParsed={() => {
              // Optionally redirect or show success message
            }}
          />
        </div>
      </main>
    </div>
  )
}
