"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import type { ParsedCourseContent } from "@/lib/ai/content-parser"

interface ContentParserProps {
  courseId: string
  onContentParsed?: (content: ParsedCourseContent) => void
}

export function ContentParser({ courseId, onContentParsed }: ContentParserProps) {
  const [textContent, setTextContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [parsedContent, setParsedContent] = useState<ParsedCourseContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setError(null)
    setSelectedFile(file)

    try {
      // First extract text from file
      const formData = new FormData()
      formData.append("file", file)

      const extractResponse = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      })

      const extractResult = await extractResponse.json()

      if (!extractResponse.ok) {
        throw new Error(extractResult.error || "Failed to extract text")
      }

      // Then parse the extracted content
      const parseResponse = await fetch("/api/parse-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: extractResult.text,
          type: file.type.startsWith("image/") ? "image" : "document",
          courseId,
        }),
      })

      const parseResult = await parseResponse.json()

      if (!parseResponse.ok) {
        throw new Error(parseResult.error || "Failed to parse content")
      }

      setParsedContent(parseResult.data)
      onContentParsed?.(parseResult.data)
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
            Upload documents or paste content to automatically extract course components
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Paste Text</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>

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

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload course documents, syllabi, or screenshots</p>
                  <input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                    className="hidden"
                    id="file-upload"
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Label>
                  {selectedFile && <p className="text-xs text-gray-500 mt-2">Selected: {selectedFile.name}</p>}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
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
