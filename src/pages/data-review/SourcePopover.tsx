import { useEffect, useRef, type ReactNode } from 'react'
import { Close, Document } from '@design-systems/icons'
import type { TaxControlDocEntry } from '../../data/sourceDocuments'
import { parseCurrency } from '../../data/sourceDocuments'
import styles from '../../styles/data-review/SourcePopover.module.css'

/** One card in the unified source flyout. */
export type SourcePopoverItem = {
  id: string
  label: string
  amount?: number
  /** When set in `source` mode, card click opens this document. */
  docId?: string
  /** Optional body text (info cards / notes). */
  note?: string
}

export type SourcePopoverMode = 'source' | 'calc' | 'info'

const DEFAULT_SUBTITLE: Record<SourcePopoverMode, string> = {
  source: 'Select a source below to open its document.',
  calc: 'Amounts included in this total.',
  info: 'About this amount.',
}

const DEFAULT_SUM_LABEL: Record<SourcePopoverMode, string> = {
  source: 'Total from sources',
  calc: 'Total from lines',
  info: 'Total',
}

function fmt(n: number) {
  return n.toLocaleString()
}

export function computeSourcePopoverPosition(anchorRect: DOMRect, popWidth = 300) {
  const GAP = 12
  const placeRight = anchorRect.right + GAP + popWidth <= window.innerWidth - 8
  const top = anchorRect.top + anchorRect.height / 2
  const left = placeRight
    ? anchorRect.right + GAP
    : Math.max(8, anchorRect.left - GAP - popWidth)
  const beakSide = placeRight ? 'left' : 'right'
  return { top, left, beakSide: beakSide as 'left' | 'right' }
}

interface SourcePopoverItemsProps {
  mode?: SourcePopoverMode
  items: SourcePopoverItem[]
  onNavigateToDoc?: (docId: string) => void
  /** Click handler for cards without doc navigation (legacy label-only sources). */
  onItemClick?: (item: SourcePopoverItem) => void
}

/** Shared source card list — used inside SourcePopover and FieldPopover. */
export function SourcePopoverItems({
  mode = 'source',
  items,
  onNavigateToDoc,
  onItemClick,
}: SourcePopoverItemsProps) {
  return (
    <div className={styles.itemList}>
      {items.map(item => {
        const isSourceNav = mode === 'source' && !!item.docId && !!onNavigateToDoc
        const isLegacyClick = !isSourceNav && !!onItemClick
        const amount = item.amount
        const content = (
          <>
            <div className={styles.cardMain}>
              <span className={styles.cardLabel}>{item.label}</span>
              {amount !== undefined && (
                <span className={styles.cardAmount}>${fmt(amount)}</span>
              )}
            </div>
            {item.note && <p className={styles.itemNote}>{item.note}</p>}
            {isSourceNav && (
              <span className={styles.viewSource}>
                <Document size="small" />
                View source
              </span>
            )}
          </>
        )

        if (isSourceNav || isLegacyClick) {
          return (
            <button
              key={item.id}
              type="button"
              className={styles.sourceCard}
              onClick={() => {
                if (isSourceNav) onNavigateToDoc?.(item.docId!)
                else onItemClick?.(item)
              }}
              aria-label={`View source document for ${item.label}`}
            >
              {content}
            </button>
          )
        }

        return (
          <div
            key={item.id}
            className={`${styles.sourceCard} ${styles.sourceCardStatic}`}
            role="group"
            aria-label={item.label}
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}

interface SourcePopoverFooterProps {
  label: string
  value: number
}

export function SourcePopoverFooter({ label, value }: SourcePopoverFooterProps) {
  return (
    <div className={styles.footerRow}>
      <span className={styles.footerLabel}>{label}</span>
      <span className={styles.footerValue}>${fmt(value)}</span>
    </div>
  )
}

interface SourcePopoverShellProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footnote?: string
  footer?: ReactNode
  className?: string
  style?: React.CSSProperties
  beakSide?: 'left' | 'right'
}

/** Header + subtitle + body shell without positioning — for embedded use (FieldPopover). */
export function SourcePopoverShell({
  title,
  subtitle,
  onClose,
  children,
  footnote,
  footer,
  className,
  style,
  beakSide = 'left',
}: SourcePopoverShellProps) {
  return (
    <div
      className={[
        styles.popover,
        beakSide === 'left' ? styles.popoverBeakLeft : styles.popoverBeakRight,
        className,
      ].filter(Boolean).join(' ')}
      style={style}
      role="dialog"
      aria-label={`${title} details`}
    >
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Close size="small" />
        </button>
      </div>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      {children}
      {footer}
      {footnote ? <p className={styles.footnote}>{footnote}</p> : null}
    </div>
  )
}

interface SourcePopoverProps {
  rowLabel: string
  mode?: SourcePopoverMode
  subtitle?: string
  items: SourcePopoverItem[]
  sumLabel?: string
  sumValue?: number
  footnote?: string
  onNavigateToDoc?: (docId: string) => void
  anchorRect: DOMRect
  onClose: () => void
}

/** Fixed-position source flyout — Summary rows, schedule (i) buttons, OutputFormViews. */
export default function SourcePopover({
  rowLabel,
  mode = 'source',
  subtitle,
  items,
  sumLabel,
  sumValue,
  footnote,
  onNavigateToDoc,
  anchorRect,
  onClose,
}: SourcePopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return
      if (ref.current?.contains(target)) return
      if (target.closest?.('[data-field-row]')) return
      onClose()
    }
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 80)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const itemsSum = items.reduce((sum, d) => sum + (d.amount ?? 0), 0)
  const footerValue = sumValue ?? itemsSum
  const showFooter = sumLabel !== undefined || mode !== 'info' || items.some(i => i.amount !== undefined)
  const footerLabel = sumLabel ?? DEFAULT_SUM_LABEL[mode]
  const { top, left, beakSide } = computeSourcePopoverPosition(anchorRect)

  return (
    <div ref={ref}>
      <SourcePopoverShell
        title={rowLabel}
        subtitle={subtitle ?? DEFAULT_SUBTITLE[mode]}
        onClose={onClose}
        footnote={footnote}
        beakSide={beakSide}
        style={{ position: 'fixed', top, left, transform: 'translateY(-50%)', zIndex: 300 }}
        footer={
          showFooter ? (
            <SourcePopoverFooter label={footerLabel} value={footerValue} />
          ) : undefined
        }
      >
        <SourcePopoverItems
          mode={mode}
          items={items}
          onNavigateToDoc={onNavigateToDoc}
        />
      </SourcePopoverShell>
    </div>
  )
}

/** @deprecated use SourcePopoverItem */
export type SummaryInfoItem = SourcePopoverItem
/** @deprecated use SourcePopoverMode */
export type SummaryInfoMode = SourcePopoverMode

/** Map legacy TaxControlDocEntry[] into SourcePopoverItems. */
export function docsToSummaryItems(docs: TaxControlDocEntry[]): SourcePopoverItem[] {
  return docs.map(doc => ({
    id: doc.docId,
    label: doc.label,
    amount: doc.hint ?? 0,
    docId: doc.docId,
  }))
}

export function sumControlDocInputs(
  docs: TaxControlDocEntry[],
  values: Record<string, string>,
): number | null {
  const parsed = docs.map(d => parseCurrency(values[d.docId] ?? ''))
  if (parsed.some(v => v === null)) return null
  return parsed.reduce((a, b) => a! + b!, 0)!
}

export function getDocValuesForRow(
  rowId: string,
  docs: TaxControlDocEntry[],
  controlInputs: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const doc of docs) {
    const key = `${rowId}::${doc.docId}`
    if (controlInputs[key] !== undefined) result[doc.docId] = controlInputs[key]
  }
  return result
}

export function setDocValueForRow(
  rowId: string,
  docId: string,
  value: string,
  prev: Record<string, string>,
): Record<string, string> {
  return { ...prev, [`${rowId}::${docId}`]: value }
}

export function setDocValuesForRow(
  rowId: string,
  values: Record<string, string>,
  prev: Record<string, string>,
): Record<string, string> {
  const next = { ...prev }
  for (const [docId, value] of Object.entries(values)) {
    next[`${rowId}::${docId}`] = value
  }
  return next
}
