import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { navigationForDetailField } from '../data-review/phase1FieldSync'
import type { ImportMismatchRow } from '../data-review/phase2FlagSync'
import { DiagnosticFieldEmbed } from './DiagnosticFieldEmbed'
import styles from '../../styles/check-return/DiagnosticEmbed.module.css'

type ImportMismatchDiagnosticEmbedProps = {
  rows: ImportMismatchRow[]
}

export default function ImportMismatchDiagnosticEmbed({
  rows,
}: ImportMismatchDiagnosticEmbedProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(prev => Math.min(prev, Math.max(0, rows.length - 1)))
  }, [rows.length])

  if (rows.length === 0) return null

  const safeIndex = Math.min(index, rows.length - 1)
  const row = rows[safeIndex]
  const nav = navigationForDetailField(row.field)

  return (
    <div className={styles.embedStack} aria-label="Fix import mismatches inline">
      <div className={styles.embedNav}>
        <p className={styles.embedNavLabel}>
          <span className={styles.embedNavCount}>
            {safeIndex + 1} of {rows.length}
          </span>
          <span className={styles.embedNavField}>{row.label}</span>
        </p>
        <div className={styles.embedNavActions}>
          <Button
            priority="secondary"
            size="small"
            disabled={safeIndex === 0}
            onClick={() => setIndex(prev => Math.max(0, prev - 1))}
            aria-label="Previous mismatch"
          >
            <ChevronLeft size="small" aria-hidden />
            Previous
          </Button>
          <Button
            priority="secondary"
            size="small"
            disabled={safeIndex >= rows.length - 1}
            onClick={() => setIndex(prev => Math.min(rows.length - 1, prev + 1))}
            aria-label="Next mismatch"
          >
            Next
            <ChevronRight size="small" aria-hidden />
          </Button>
        </div>
      </div>

      {rows.length > 1 && (
        <div className={styles.embedPills} role="tablist" aria-label="Import mismatch fields">
          {rows.map((mismatchRow, pillIndex) => (
            <button
              key={mismatchRow.id}
              type="button"
              role="tab"
              aria-selected={pillIndex === safeIndex}
              aria-label={`${pillIndex + 1}. ${mismatchRow.label}`}
              title={mismatchRow.label}
              className={[
                styles.embedPill,
                pillIndex === safeIndex ? styles.embedPillActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setIndex(pillIndex)}
            >
              {pillIndex + 1}
            </button>
          ))}
        </div>
      )}

      <DiagnosticFieldEmbed
        key={row.id}
        highlightField={row.field}
        tab={row.tab}
        ariaLabel={`Fix ${row.label}`}
        divPayer={nav?.divPayer}
        subTab={nav?.tab === 'w2s' ? 'techCircle' : undefined}
      />
    </div>
  )
}
