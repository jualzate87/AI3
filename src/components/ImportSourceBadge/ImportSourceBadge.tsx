import Tooltip from '../../pages/data-review/Tooltip'
import { getDocumentImportMeta, type ImportMode } from '../../data/documentImportMeta'
import styles from './ImportSourceBadge.module.css'

export type ImportSourceBadgeVariant = 'api-filed' | 'import' | 'manual'

const LABELS: Record<ImportSourceBadgeVariant, string> = {
  'api-filed': 'Imported via Filed API',
  import: 'Imported via Smart return',
  manual: 'Manual entry',
}

const TOOLTIPS: Record<ImportSourceBadgeVariant, string> = {
  'api-filed': 'PDF and input values imported via Filed API',
  import: 'PDF and values imported via Smart return native import',
  manual: 'No structured import — values were entered manually',
}

const STYLE_CLASS: Record<ImportSourceBadgeVariant, string> = {
  'api-filed': styles.apiFiled,
  import: styles.import,
  manual: styles.manual,
}

export function importModeToBadgeVariant(mode: ImportMode): ImportSourceBadgeVariant | null {
  if (mode === 'api-filed') return 'api-filed'
  if (mode === 'extracted') return 'import'
  if (mode === 'pdf-only' || mode === 'manual') return 'manual'
  return null
}

type Props = {
  /** Explicit variant — overrides docKey lookup */
  variant?: ImportSourceBadgeVariant
  /** Look up variant from document import metadata */
  docKey?: string | null
  className?: string
}

/** Audit-log style import badge — API purple, OCR green, or neutral manual. */
export default function ImportSourceBadge({ variant, docKey, className }: Props) {
  const meta = docKey ? getDocumentImportMeta(docKey) : null

  const resolvedVariant =
    variant ?? (meta ? importModeToBadgeVariant(meta.importMode) : null)

  if (!resolvedVariant) return null

  const label = LABELS[resolvedVariant]
  const tooltip = TOOLTIPS[resolvedVariant]

  return (
    <Tooltip text={tooltip} placement="top">
      <span
        className={`${styles.badge} ${STYLE_CLASS[resolvedVariant]}${className ? ` ${className}` : ''}`}
        aria-label={tooltip}
      >
        {label}
      </span>
    </Tooltip>
  )
}
