import { NotesList } from "@/components/notes/notes-list"

interface NotesSectionProps {
  courseItemId: string
  courseItemType?: string
}

export function NotesSection({ courseItemId, courseItemType }: NotesSectionProps) {
  return (
    <div className="space-y-6">
      <NotesList courseItemId={courseItemId} courseItemType={courseItemType} />
    </div>
  )
}
