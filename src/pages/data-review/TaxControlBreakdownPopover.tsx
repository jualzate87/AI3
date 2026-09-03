import { useEffect, useRef } from 'react'
import type { TaxControlBreakdown } from '../../data/taxControlBreakdowns'
import {
  SourcePopoverFooter,
  SourcePopoverShell,
  computeSourcePopoverPosition,
} from './SourcePopover'
import styles from '../../styles/data-review/SourcePopover.module.css'

interface TaxControlBreakdownPopoverProps {
  breakdown: TaxControlBreakdown
  anchorRect: DOMRect
  onClose: () => void
}

function fmt(n: number) {
  return n.toLocaleString()
}

export default function TaxControlBreakdownPopover({
  breakdown,
  anchorRect,
  onClose,
}: TaxControlBreakdownPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 80)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const { top, left, beakSide } = computeSourcePopoverPosition(anchorRect)

  return (
    <div ref={ref}>
      <SourcePopoverShell
        title={breakdown.title}
        subtitle={breakdown.formula}
        onClose={onClose}
        footnote={breakdown.footnote}
        beakSide={beakSide}
        style={{ position: 'fixed', top, left, transform: 'translateY(-50%)', zIndex: 300 }}
        footer={<SourcePopoverFooter label={breakdown.totalLabel} value={breakdown.total} variant="calc" />}
      >
        <ul className={styles.calcList}>
          {breakdown.components.map((comp, i) => (
            <li key={i} className={styles.calcRow}>
              <span className={styles.calcOp}>{comp.operator ?? '+'}</span>
              <span className={styles.calcLabel}>{comp.label}</span>
              <span className={styles.calcValue}>${fmt(comp.value)}</span>
            </li>
          ))}
        </ul>
      </SourcePopoverShell>
    </div>
  )
}
