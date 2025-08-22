"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Play, FileText, Upload } from "lucide-react"

export function CreateCourseForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [sourceType, setSourceType] = useState("custom")
  const [sourceUrl, setSourceUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("courses")
        .insert({
          title,
          description,
          source_type: sourceType,
          source_url: sourceUrl || null,
          user_id: user.user.id,
        })
        .select()
        .single()

      if (error) throw error

      if (sourceType === "youtube_playlist") {
        router.push(`/courses/${data.id}/import?tab=youtube`)
      } else if (sourceType === "uploaded_document" || sourceType === "custom") {
        router.push(`/courses/${data.id}/import?tab=document`)
      } else {
        router.push(`/courses/${data.id}`)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Course Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              placeholder="Enter course title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this course covers"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Course Source</Label>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setSourceType("custom")}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:border-blue-300 ${
                  sourceType === "custom"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      sourceType === "custom" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">Custom Course</div>
                    <div className="text-sm text-gray-500">Build your course from scratch</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSourceType("youtube_playlist")}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:border-blue-300 ${
                  sourceType === "youtube_playlist"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      sourceType === "youtube_playlist" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Play className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">YouTube Playlist</div>
                    <div className="text-sm text-gray-500">Import videos from a YouTube playlist</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSourceType("uploaded_document")}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:border-blue-300 ${
                  sourceType === "uploaded_document"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      sourceType === "uploaded_document" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">Document Upload</div>
                    <div className="text-sm text-gray-500">Parse course content from documents</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {sourceType === "youtube_playlist" && (
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">YouTube Playlist URL (Optional)</Label>
              <Input
                id="sourceUrl"
                placeholder="https://www.youtube.com/playlist?list=... (can be added later)"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">You can import the playlist in the next step if not provided now</p>
            </div>
          )}

          {sourceType === "uploaded_document" && (
            <div className="space-y-2">
              <Label>Document Upload</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Document upload will be available in the next step</p>
              </div>
            </div>
          )}

          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
