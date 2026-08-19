import Tooltip from '../../pages/data-review/Tooltip'
import { getDocumentImportMeta, type ImportMode } from '../../data/documentImportMeta'
import styles from './ImportSourceBadge.module.css'

export type ImportSourceBadgeVariant = 'api-filed' | 'import'

const LABELS: Record<ImportSourceBadgeVariant, string> = {
  'api-filed': 'Imported through Filed API',
  import: 'IMPORT',
}

const TOOLTIPS: Record<ImportSourceBadgeVariant, string> = {
  'api-filed': 'PDF and input values imported through Filed API',
  import: 'Values extracted from uploaded document (OCR import)',
}

const STYLE_CLASS: Record<ImportSourceBadgeVariant, string> = {
  'api-filed': styles.apiFiled,
  import: styles.import,
}

export function importModeToBadgeVariant(mode: ImportMode): ImportSourceBadgeVariant | null {
  if (mode === 'api-filed') return 'api-filed'
  if (mode === 'extracted') return 'import'
  return null
}

type Props = {
  /** Explicit variant — overrides docKey lookup */
  variant?: ImportSourceBadgeVariant
  /** Look up variant from document import metadata */
  docKey?: string | null
  className?: string
}

/** Audit-log style import badge — API purple or OCR green. Manual docs use PageMessage instead. */
export default function ImportSourceBadge({ variant, docKey, className }: Props) {
  const meta = docKey ? getDocumentImportMeta(docKey) : null

  const resolvedVariant =
    variant ??
    (meta?.importMode === 'api-filed'
      ? 'api-filed'
      : meta?.importMode === 'extracted'
        ? 'import'
        : null)

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
