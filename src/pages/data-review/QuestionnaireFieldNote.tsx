import { getQuestionnaireFieldNotes } from './questionnaireData'
import styles from '../../styles/data-review/QuestionnaireFieldNote.module.css'

interface QuestionnaireFieldNoteProps {
  fieldKey: string
}

/** Inline note when a questionnaire answer informed this field beyond source docs. */
export default function QuestionnaireFieldNote({ fieldKey }: QuestionnaireFieldNoteProps) {
  const notes = getQuestionnaireFieldNotes(fieldKey)
  if (notes.length === 0) return null

  return (
    <div className={styles.wrap} role="note">
      {notes.map(note => (
        <p key={`${note.topic}-${note.note}`} className={styles.text}>
          <span className={styles.label}>From questionnaire · {note.topic}</span>
          {' - '}
          {note.note}
          <span className={styles.source}> ({note.sourceLabel})</span>
        </p>
      ))}
    </div>
  )
}
