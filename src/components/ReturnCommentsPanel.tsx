import NotesPane from '../pages/data-review/NotesPane'
import { useReturnNotes } from '../hooks/useReturnNotes'
import { useReturnWorkflow } from '../contexts/ReturnWorkflowContext'
import activityStyles from '../styles/check-return/ActivityPanel.module.css'
import styles from '../styles/ReturnCommentsPanel.module.css'

interface ReturnCommentsPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export default function ReturnCommentsPanel({ isOpen, onToggle }: ReturnCommentsPanelProps) {
  const { notes, addNote, editNote, resolveNote, replyToNote } = useReturnNotes()
  const { currentUser } = useReturnWorkflow()

  if (!isOpen) return null

  return (
    <aside id="return-comments-panel" className={`${activityStyles.panel} ${styles.shell}`} aria-label="Comments">
      <NotesPane
        notes={notes}
        onAdd={text =>
          addNote(text, currentUser.name, currentUser.role === 'reviewer' ? 'reviewer' : 'preparer')
        }
        onEdit={editNote}
        onResolve={resolveNote}
        onReply={(id, text) =>
          replyToNote(
            id,
            text,
            currentUser.name,
            currentUser.role === 'reviewer' ? 'reviewer' : 'preparer',
          )
        }
        onClose={onToggle}
      />
    </aside>
  )
}
