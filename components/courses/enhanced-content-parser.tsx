"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "@/components/files/file-uploader"
import { FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import type { ParsedCourseContent } from "@/lib/ai/content-parser"

interface EnhancedContentParserProps {
  courseId: string
  onContentParsed?: (content: ParsedCourseContent) => void
}

export function EnhancedContentParser({ courseId, onContentParsed }: EnhancedContentParserProps) {
  const [textContent, setTextContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [parsedContent, setParsedContent] = useState<ParsedCourseContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  const handleTextParse = async () => {
    if (!textContent.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/parse-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textContent,
          type: "document",
          courseId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to parse content")
      }

      setParsedContent(result.data)
      onContentParsed?.(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilesProcessed = async (files: any[]) => {
    setUploadedFiles(files)
    setIsLoading(true)
    setError(null)

    try {
      // Combine content from all files
      const combinedContent = files
        .map((file) => {
          return `File: ${file.file.name}\n${file.content}\n\n---\n\n`
        })
        .join("")

      const response = await fetch("/api/parse-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: combinedContent,
          type: "document",
          courseId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to parse content")
      }

      setParsedContent(result.data)
      onContentParsed?.(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-100 text-red-800"
      case "reading":
        return "bg-blue-100 text-blue-800"
      case "assignment":
        return "bg-green-100 text-green-800"
      case "quiz":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            AI Content Parser
          </CardTitle>
          <p className="text-sm text-gray-600">
            Upload files or paste content to automatically extract course components
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
              <TabsTrigger value="text">Paste Text</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <FileUploader onFilesProcessed={handleFilesProcessed} maxFiles={5} />
              {uploadedFiles.length > 0 && !isLoading && !parsedContent && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    {uploadedFiles.length} file(s) processed and ready for content extraction
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Course Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your course syllabus, assignment list, or any course-related content here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>
              <Button onClick={handleTextParse} disabled={!textContent.trim() || isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Parsing Content...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Parse Content
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md mt-4">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {parsedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Parsed Content
            </CardTitle>
            <p className="text-sm text-gray-600">Found {parsedContent.items.length} course items</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedContent.course_title && (
              <div>
                <Label className="text-sm font-medium">Detected Course Title</Label>
                <p className="text-lg font-semibold">{parsedContent.course_title}</p>
              </div>
            )}

            {parsedContent.course_description && (
              <div>
                <Label className="text-sm font-medium">Course Description</Label>
                <p className="text-gray-700">{parsedContent.course_description}</p>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Source Files</Label>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, index) => (
                    <Badge key={index} variant="outline">
                      {file.file.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium mb-3 block">Course Items</Label>
              <div className="space-y-3">
                {parsedContent.items.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <Badge className={getItemTypeColor(item.item_type)}>{item.item_type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Order: {item.order_index + 1}</span>
                      {item.duration_minutes && <span>Duration: {item.duration_minutes} min</span>}
                      {item.content_url && <span>Has URL</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
