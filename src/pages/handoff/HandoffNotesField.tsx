import { TextArea } from '@ids-ts/textarea'
import '@ids-ts/textarea/dist/main.css'
import styles from '../../styles/handoff/HandoffNotesField.module.css'

interface HandoffNotesFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

export default function HandoffNotesField({
  id,
  label,
  value,
  onChange,
}: HandoffNotesFieldProps) {
  return (
    <div className={styles.notesField}>
      <TextArea
        id={id}
        label={label}
        aria-label={label}
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
