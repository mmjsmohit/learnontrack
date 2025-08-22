"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Save, X, Clock } from "lucide-react"

interface NoteEditorProps {
  courseItemId: string
  courseItemType?: string
  initialNote?: {
    id: string
    title?: string
    content: string
    timestamp_seconds?: number
  }
  onSave?: (note: any) => void
  onCancel?: () => void
}

export function NoteEditor({ courseItemId, courseItemType, initialNote, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState(initialNote?.title || "")
  const [content, setContent] = useState(initialNote?.content || "")
  const [timestampSeconds, setTimestampSeconds] = useState(initialNote?.timestamp_seconds || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Content is required")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const url = initialNote ? `/api/notes/${initialNote.id}` : "/api/notes"
      const method = initialNote ? "PUT" : "POST"

      const body: any = {
        title: title.trim() || null,
        content: content.trim(),
      }

      if (!initialNote) {
        body.courseItemId = courseItemId
      }

      if (timestampSeconds && courseItemType === "video") {
        body.timestampSeconds = Number(timestampSeconds)
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save note")
      }

      onSave?.(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{initialNote ? "Edit Note" : "Add Note"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title (Optional)</Label>
          <Input id="title" placeholder="Enter note title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {courseItemType === "video" && (
          <div className="space-y-2">
            <Label htmlFor="timestamp" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timestamp (seconds)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="timestamp"
                type="number"
                placeholder="e.g., 120"
                value={timestampSeconds}
                onChange={(e) => setTimestampSeconds(e.target.value)}
                className="w-32"
              />
              {timestampSeconds && <Badge variant="outline">{formatTimestamp(Number(timestampSeconds))}</Badge>}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="content">Note Content</Label>
          <Textarea
            id="content"
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </div>

        {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isLoading || !content.trim()}>
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {initialNote ? "Update" : "Save"} Note
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
