import { useCallback, useEffect, useState } from 'react'
import type { Note } from '../pages/data-review/NotesPane'

export const RETURN_NOTES_KEY = 'protoc3-notes'
export const RETURN_NOTES_EVENT = 'protoc3-notes-changed'

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

function persistNotes(next: Note[], openComments = false) {
  localStorage.setItem(RETURN_NOTES_KEY, JSON.stringify(next))
  window.dispatchEvent(
    new CustomEvent(RETURN_NOTES_EVENT, { detail: { openComments } }),
  )
}

export function useReturnNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())

  useEffect(() => {
    const sync = () => setNotes(loadNotes())
    window.addEventListener(RETURN_NOTES_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(RETURN_NOTES_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const addNote = useCallback((
    text: string,
    author: string,
    role: Note['role'] = 'preparer',
    context?: string,
  ) => {
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
      ...(context ? { context } : {}),
    }
    setNotes(prev => {
      const next = [note, ...prev]
      persistNotes(next, true)
      return next
    })
    return note
  }, [])

  const addHandoffNote = useCallback(
    (text: string, author: string, context: string, role: Note['role'] = 'preparer') => {
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
        context,
        role,
        status: 'open',
      }
      setNotes(prev => {
        const next = [note, ...prev]
        persistNotes(next, true)
        return next
      })
      return note
    },
    [],
  )

  const editNote = useCallback((id: string, text: string) => {
    setNotes(prev => {
      const next = prev.map(note => (note.id === id ? { ...note, text } : note))
      persistNotes(next)
      return next
    })
  }, [])

  const resolveNote = useCallback((id: string) => {
    setNotes(prev => {
      const next = prev.map(note =>
        note.id === id ? { ...note, status: 'resolved' as const } : note,
      )
      persistNotes(next)
      return next
    })
  }, [])

  const replyToNote = useCallback((id: string, text: string, author: string, role: Note['role']) => {
    setNotes(prev => {
      const next = prev.map(note => {
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
      })
      persistNotes(next)
      return next
    })
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
