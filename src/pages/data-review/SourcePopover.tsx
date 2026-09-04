import { useEffect, useRef, type ReactNode } from 'react'
import { Close, Document, Edit } from '@design-systems/icons'
import type { TaxControlDocEntry } from '../../data/sourceDocuments'
import { parseCurrency } from '../../data/sourceDocuments'
import styles from '../../styles/data-review/SourcePopover.module.css'

/** One card in the unified source flyout. */
export type SourcePopoverItem = {
  id: string
  label: string
  amount?: number
  /** When set in `source` mode, card actions open this document. */
  docId?: string
  /** Detail field for View input navigation. */
  detailFieldId?: string
  /** Optional body text (info cards / notes). */
  note?: string
}

export type SourcePopoverMode = 'source' | 'calc' | 'info'

const DEFAULT_SUBTITLE: Record<SourcePopoverMode, string> = {
  source: '',
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

export function sourcePopoverTitle(rowLabel: string, mode: SourcePopoverMode = 'source'): string {
  if (mode !== 'source') return rowLabel
  if (rowLabel.toLowerCase().startsWith('inputs for ')) return rowLabel
  return `Inputs for ${rowLabel}`
}

export function sourceDocCountSubtitle(items: SourcePopoverItem[]): string {
  const count = items.filter(item => item.docId).length || items.length
  return `${count} document${count === 1 ? '' : 's'}`
}

/** Horizontal gap between a field value box and its flyout. */
export const POPOVER_FIELD_GAP = 12

/** Output / check-return flyout width — matches FieldPopover. */
export const OUTPUT_FORM_POPOVER_WIDTH = 360

/** Resolve the value-field box for popover anchoring (not the (i) button or whole row). */
export function getPopoverAnchorRect(fromEl: HTMLElement): DOMRect {
  const row = fromEl.closest('[data-field-row]') as HTMLElement | null
  const anchor = row?.querySelector('[data-popover-anchor]') as HTMLElement | null
  return (anchor ?? fromEl).getBoundingClientRect()
}

export function computeSourcePopoverPosition(
  anchorRect: DOMRect,
  popWidth = 328,
  gap = POPOVER_FIELD_GAP,
) {
  const placeRight = anchorRect.right + gap + popWidth <= window.innerWidth - 8
  const top = anchorRect.top + anchorRect.height / 2
  const left = placeRight
    ? anchorRect.right + gap
    : Math.max(8, anchorRect.left - gap - popWidth)
  const beakSide = placeRight ? 'left' : 'right'
  return { top, left, beakSide: beakSide as 'left' | 'right' }
}

interface SourcePopoverItemsProps {
  mode?: SourcePopoverMode
  items: SourcePopoverItem[]
  detailFieldIdByDocId?: Record<string, string>
  onViewDocument?: (docId: string) => void
  onViewInput?: (docId: string, detailFieldId?: string) => void
  /** @deprecated Use onViewDocument */
  onNavigateToDoc?: (docId: string) => void
  /** Click handler for cards without doc navigation (legacy label-only sources). */
  onItemClick?: (item: SourcePopoverItem) => void
}

/** Shared source card list — used inside SourcePopover and FieldPopover. */
export function SourcePopoverItems({
  mode = 'source',
  items,
  detailFieldIdByDocId,
  onViewDocument,
  onViewInput,
  onNavigateToDoc,
  onItemClick,
}: SourcePopoverItemsProps) {
  const handleViewDocument = onViewDocument ?? onNavigateToDoc

  return (
    <div className={styles.itemList}>
      {items.map(item => {
        const docId = item.docId
        const detailFieldId = item.detailFieldId ?? (docId ? detailFieldIdByDocId?.[docId] : undefined)
        const showDocActions = mode === 'source' && !!docId && (!!handleViewDocument || !!onViewInput)
        const isLegacyClick = !showDocActions && !!onItemClick
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
            {showDocActions && (
              <div className={styles.cardActions}>
                {handleViewDocument && (
                  <button
                    type="button"
                    className={styles.cardActionLink}
                    onClick={() => handleViewDocument(docId!)}
                  >
                    <Document size="small" aria-hidden />
                    View document
                  </button>
                )}
                {handleViewDocument && onViewInput && (
                  <span className={styles.cardActionSep} aria-hidden>|</span>
                )}
                {onViewInput && (
                  <button
                    type="button"
                    className={styles.cardActionLink}
                    onClick={() => onViewInput(docId!, detailFieldId)}
                  >
                    <Edit size="small" aria-hidden />
                    View input
                  </button>
                )}
              </div>
            )}
          </>
        )

        if (isLegacyClick) {
          return (
            <button
              key={item.id}
              type="button"
              className={styles.sourceCard}
              onClick={() => onItemClick?.(item)}
              aria-label={`View source for ${item.label}`}
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
  variant?: 'source' | 'calc' | 'info'
}

export function SourcePopoverFooter({ label, value, variant = 'source' }: SourcePopoverFooterProps) {
  return (
    <div className={variant === 'source' ? styles.footerRowPlain : styles.footerRow}>
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
      <div className={styles.headerBlock}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Close size="small" />
          </button>
        </div>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      <div className={styles.body}>
        {children}
        {footer}
      </div>
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
  detailFieldIdByDocId?: Record<string, string>
  onViewDocument?: (docId: string) => void
  onViewInput?: (docId: string, detailFieldId?: string) => void
  /** @deprecated Use onViewDocument */
  onNavigateToDoc?: (docId: string) => void
  anchorRect: DOMRect
  onClose: () => void
  /** Popover width — defaults to 328; use OUTPUT_FORM_POPOVER_WIDTH on output forms. */
  popoverWidth?: number
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
  detailFieldIdByDocId,
  onViewDocument,
  onViewInput,
  onNavigateToDoc,
  anchorRect,
  onClose,
  popoverWidth,
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
  const displayTitle = sourcePopoverTitle(rowLabel, mode)
  const displaySubtitle = subtitle
    ?? (mode === 'source' ? sourceDocCountSubtitle(items) : DEFAULT_SUBTITLE[mode])
  const { top, left, beakSide } = computeSourcePopoverPosition(
    anchorRect,
    popoverWidth ?? 328,
  )
  const useWide = (popoverWidth ?? 328) >= OUTPUT_FORM_POPOVER_WIDTH

  return (
    <div ref={ref}>
      <SourcePopoverShell
        title={displayTitle}
        subtitle={displaySubtitle}
        onClose={onClose}
        footnote={footnote}
        beakSide={beakSide}
        className={useWide ? styles.popoverWide : undefined}
        style={{
          position: 'fixed',
          top,
          left,
          transform: 'translateY(-50%)',
          zIndex: 10000,
          ...(useWide ? { width: OUTPUT_FORM_POPOVER_WIDTH } : undefined),
        }}
        footer={
          showFooter ? (
            <SourcePopoverFooter label={footerLabel} value={footerValue} variant={mode} />
          ) : undefined
        }
      >
        <SourcePopoverItems
          mode={mode}
          items={items}
          detailFieldIdByDocId={detailFieldIdByDocId}
          onViewDocument={onViewDocument}
          onViewInput={onViewInput}
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
