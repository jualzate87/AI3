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
        helperText="These notes appear in Comments and the reviewer summary."
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={5}
        width="100%"
      />
    </div>
  )
}
