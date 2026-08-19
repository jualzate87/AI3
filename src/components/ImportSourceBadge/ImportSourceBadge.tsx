import Tooltip from '../../pages/data-review/Tooltip'
import { getDocumentImportMeta, type ImportMode } from '../../data/documentImportMeta'
import styles from './ImportSourceBadge.module.css'

export type ImportSourceBadgeVariant = 'api-filed' | 'import' | 'manual'

const LABELS: Record<ImportSourceBadgeVariant, string> = {
  'api-filed': 'API · Filed',
  import: 'IMPORT',
  manual: 'Manual entry',
}

const TOOLTIPS: Record<ImportSourceBadgeVariant, string> = {
  'api-filed': 'PDF and input values imported via Filed API',
  import: 'Values extracted from uploaded document (OCR import)',
  manual: 'Document attached for reference · data entered manually',
}

const STYLE_CLASS: Record<ImportSourceBadgeVariant, string> = {
  'api-filed': styles.apiFiled,
  import: styles.import,
  manual: styles.manual,
}

export function importModeToBadgeVariant(mode: ImportMode): ImportSourceBadgeVariant {
  if (mode === 'api-filed') return 'api-filed'
  if (mode === 'extracted') return 'import'
  return 'manual'
}

type Props = {
  /** Explicit variant — overrides docKey lookup */
  variant?: ImportSourceBadgeVariant
  /** Look up variant from document import metadata */
  docKey?: string | null
  className?: string
}

export default function ImportSourceBadge({ variant, docKey, className }: Props) {
  const resolvedVariant =
    variant ??
    (docKey ? importModeToBadgeVariant(getDocumentImportMeta(docKey)?.importMode ?? 'manual') : null)

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
