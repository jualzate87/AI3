import { useCallback, useEffect, useState } from 'react'
import type { Note } from '../pages/data-review/NotesPane'

export const RETURN_NOTES_KEY = 'protoc3-notes'

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(RETURN_NOTES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Note[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useReturnNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())

  useEffect(() => {
    localStorage.setItem(RETURN_NOTES_KEY, JSON.stringify(notes))
  }, [notes])

  const addNote = useCallback((text: string, author: string, role: Note['role'] = 'preparer') => {
    const note: Note = {
      id: `note-${Date.now()}`,
      text,
      author,
      at: new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      role,
      status: 'open',
    }
    setNotes(prev => [note, ...prev])
    return note
  }, [])

  const addHandoffNote = useCallback(
    (text: string, author: string, toName: string) => {
      const note: Note = {
        id: `handoff-${Date.now()}`,
        text,
        author,
        at: new Date().toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        context: `Handoff note for ${toName}`,
        role: 'preparer',
        status: 'open',
      }
      setNotes(prev => [note, ...prev])
      return note
    },
    [],
  )

  const editNote = useCallback((id: string, text: string) => {
    setNotes(prev => prev.map(note => (note.id === id ? { ...note, text } : note)))
  }, [])

  const resolveNote = useCallback((id: string) => {
    setNotes(prev =>
      prev.map(note => (note.id === id ? { ...note, status: 'resolved' as const } : note)),
    )
  }, [])

  const replyToNote = useCallback((id: string, text: string, author: string, role: Note['role']) => {
    setNotes(prev =>
      prev.map(note => {
        if (note.id !== id) return note
        const reply = {
          id: `reply-${Date.now()}`,
          text,
          author,
          at: new Date().toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
          role,
        }
        return { ...note, replies: [...(note.replies ?? []), reply] }
      }),
    )
  }, [])

  return {
    notes,
    setNotes,
    addNote,
    addHandoffNote,
    editNote,
    resolveNote,
    replyToNote,
  }
}

/** First handoff note for reviewer summary / catch-up copy. */
export function getHandoffNoteForSummary(): string | null {
  const notes = loadNotes()
  const handoff = notes.find(
    note => note.context?.toLowerCase().includes('handoff') || note.id.startsWith('handoff-'),
  )
  return handoff?.text ?? null
}
