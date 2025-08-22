"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, File, Image, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { validateFile, processFile } from "@/lib/files/file-processor"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  onFilesProcessed?: (files: ProcessedFileData[]) => void
  maxFiles?: number
  className?: string
}

interface ProcessedFileData {
  file: File
  content: string
  metadata: Record<string, any>
  status: "processing" | "completed" | "error"
  error?: string
}

export function FileUploader({ onFilesProcessed, maxFiles = 5, className }: FileUploaderProps) {
  const [files, setFiles] = useState<ProcessedFileData[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      handleFiles(droppedFiles)
    },
    [files, maxFiles],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      handleFiles(selectedFiles)
    },
    [files, maxFiles],
  )

  const handleFiles = async (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    setIsProcessing(true)

    const processedFiles: ProcessedFileData[] = []

    for (const file of newFiles) {
      const validation = validateFile(file)
      if (!validation.valid) {
        processedFiles.push({
          file,
          content: "",
          metadata: {},
          status: "error",
          error: validation.error,
        })
        continue
      }

      // Add file with processing status
      const fileData: ProcessedFileData = {
        file,
        content: "",
        metadata: {},
        status: "processing",
      }
      processedFiles.push(fileData)
    }

    setFiles((prev) => [...prev, ...processedFiles])

    // Process files
    for (let i = 0; i < processedFiles.length; i++) {
      const fileData = processedFiles[i]
      if (fileData.status === "error") continue

      try {
        const result = await processFile(fileData.file)
        if (result.success) {
          fileData.content = result.content || ""
          fileData.metadata = result.metadata || {}
          fileData.status = "completed"
        } else {
          fileData.status = "error"
          fileData.error = result.error
        }
      } catch (error) {
        fileData.status = "error"
        fileData.error = "Failed to process file"
      }

      // Update state with processed file
      setFiles((prev) => [...prev])
    }

    setIsProcessing(false)

    // Notify parent component
    const completedFiles = processedFiles.filter((f) => f.status === "completed")
    if (completedFiles.length > 0) {
      onFilesProcessed?.(completedFiles)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="w-5 h-5 text-blue-600" />
    } else if (file.type === "application/pdf") {
      return <FileText className="w-5 h-5 text-red-600" />
    } else {
      return <File className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Course Files
          </CardTitle>
          <p className="text-sm text-gray-600">
            Upload documents, images, or PDFs to extract course content automatically
          </p>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
              isProcessing && "opacity-50 pointer-events-none",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to upload</h3>
            <p className="text-sm text-gray-600 mb-4">
              Supports: PDF, Word documents, text files, and images (max {maxFiles} files, 10MB each)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              disabled={isProcessing}
            />
            <Button asChild disabled={isProcessing}>
              <label htmlFor="file-upload" className="cursor-pointer">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </>
                )}
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((fileData, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">{getFileIcon(fileData.file)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{fileData.file.name}</p>
                      {getStatusIcon(fileData.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(fileData.file.size)}</span>
                      <Badge variant="outline" className="text-xs">
                        {fileData.file.type.split("/")[1]?.toUpperCase() || "FILE"}
                      </Badge>
                      {fileData.status === "completed" && <span className="text-green-600">Ready for processing</span>}
                      {fileData.status === "error" && <span className="text-red-600">{fileData.error}</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeFile(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
