import { TextArea } from '@ids-ts/textarea'
import '@ids-ts/textarea/dist/main.css'
import styles from '../../styles/handoff/HandoffNotesField.module.css'

interface HandoffNotesFieldProps {
  id: string
  label: string
  helperText?: string
  value: string
  onChange: (value: string) => void
}

export default function HandoffNotesField({
  id,
  label,
  helperText,
  value,
  onChange,
}: HandoffNotesFieldProps) {
  return (
    <div className={styles.notesField}>
      <TextArea
        id={id}
        label={label}
        aria-label={label}
        helperText={helperText}
        placeholder="Add your notes"
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        resizeTextArea={false}
        width="100%"
      />
    </div>
  )
}
