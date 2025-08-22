"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react"

interface PlaylistImporterProps {
  courseId: string
  onImportComplete?: (data: any) => void
}

export function PlaylistImporter({ courseId, onImportComplete }: PlaylistImporterProps) {
  const [playlistUrl, setPlaylistUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importedData, setImportedData] = useState<any>(null)

  const handleImport = async () => {
    if (!playlistUrl.trim()) {
      setError("Please enter a YouTube playlist URL")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/youtube/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistUrl: playlistUrl.trim(),
          courseId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to import playlist")
      }

      setImportedData(result.data)
      onImportComplete?.(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  if (importedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Import Successful
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{importedData.playlist.title}</h3>
            {importedData.playlist.description && (
              <p className="text-gray-600 text-sm mt-1">{importedData.playlist.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{importedData.courseItems.length} videos imported</span>
            <span>
              Total duration:{" "}
              {formatDuration(
                importedData.courseItems.reduce((total: number, item: any) => total + (item.duration_minutes || 0), 0),
              )}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Imported Videos</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {importedData.courseItems.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <Play className="w-4 h-4 text-red-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Video {index + 1}</span>
                      {item.duration_minutes && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(item.duration_minutes)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">Video</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5 text-red-600" />
          Import YouTube Playlist
        </CardTitle>
        <p className="text-sm text-gray-600">
          Enter a YouTube playlist URL to automatically import all videos as course items
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="playlist-url">YouTube Playlist URL</Label>
          <Input
            id="playlist-url"
            placeholder="https://www.youtube.com/playlist?list=..."
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">Supported formats: playlist URLs, watch URLs with playlist parameter</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <Button onClick={handleImport} disabled={!playlistUrl.trim() || isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing Playlist...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Import Playlist
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• This will create individual course items for each video in the playlist</p>
          <p>• Video titles, descriptions, and durations will be automatically imported</p>
          <p>• You can edit or organize the imported items after import</p>
        </div>
      </CardContent>
    </Card>
  )
}
