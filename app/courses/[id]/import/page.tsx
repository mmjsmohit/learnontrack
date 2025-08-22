import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PlaylistImporter } from "@/components/youtube/playlist-importer"
import { EnhancedContentParser } from "@/components/courses/enhanced-content-parser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface ImportPageProps {
  params: Promise<{ id: string }>
}

export default async function ImportPage({ params }: ImportPageProps) {
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
            <h1 className="text-3xl font-bold text-gray-900">Import Course Content</h1>
            <p className="text-gray-600 mt-2">Add content to your course from various sources</p>
            <p className="text-sm text-gray-500 mt-1">Course: {course.title}</p>
          </div>

          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files">Upload Files</TabsTrigger>
              <TabsTrigger value="youtube">YouTube Playlist</TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="space-y-6">
              <EnhancedContentParser courseId={id} />
            </TabsContent>

            <TabsContent value="youtube" className="space-y-6">
              <PlaylistImporter courseId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
