"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NoteEditor } from "./note-editor"
import { Plus, Edit, Trash2, Clock, StickyNote } from "lucide-react"

interface Note {
  id: string
  title?: string
  content: string
  timestamp_seconds?: number
  created_at: string
  updated_at: string
}

interface NotesListProps {
  courseItemId: string
  courseItemType?: string
}

export function NotesList({ courseItemId, courseItemType }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/notes?courseItemId=${courseItemId}`)
      const result = await response.json()

      if (response.ok) {
        setNotes(result.data)
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [courseItemId])

  const handleSaveNote = (note: Note) => {
    if (editingNote) {
      setNotes(notes.map((n) => (n.id === note.id ? note : n)))
    } else {
      setNotes([note, ...notes])
    }
    setShowEditor(false)
    setEditingNote(null)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNotes(notes.filter((n) => n.id !== noteId))
      }
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (showEditor || editingNote) {
    return (
      <NoteEditor
        courseItemId={courseItemId}
        courseItemType={courseItemType}
        initialNote={editingNote || undefined}
        onSave={handleSaveNote}
        onCancel={() => {
          setShowEditor(false)
          setEditingNote(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          Notes
        </h3>
        <Button size="sm" onClick={() => setShowEditor(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading notes...</div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h4>
            <p className="text-gray-600 mb-4">Start taking notes to track your learning</p>
            <Button onClick={() => setShowEditor(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className="border-l-4 border-l-yellow-400">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {note.title && <CardTitle className="text-base font-medium text-gray-900">{note.title}</CardTitle>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{new Date(note.created_at).toLocaleDateString()}</span>
                      {note.timestamp_seconds !== null && note.timestamp_seconds !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(note.timestamp_seconds)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditingNote(note)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteNote(note.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
