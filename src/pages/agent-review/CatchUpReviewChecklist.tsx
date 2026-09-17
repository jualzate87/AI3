import { CircleCheck, CircleCheckFill } from '@design-systems/icons'
import type { CatchUpChecklistItem } from './agentIntelligenceCopy'
import checklistStyles from '../../styles/check-return/AiDiagnosticsPanel.module.css'

interface CatchUpReviewChecklistProps {
  confirmedItems: readonly CatchUpChecklistItem[]
  reviewItems: readonly CatchUpChecklistItem[]
  checkedIds: Set<string>
  onToggle: (id: string) => void
}

function ConfirmedRow({
  item,
  showDivider,
}: {
  item: CatchUpChecklistItem
  showDivider?: boolean
}) {
  return (
    <li
      className={[
        checklistStyles.checklistRow,
        checklistStyles.checklistRowComplete,
        showDivider ? checklistStyles.checklistRowDivider : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={checklistStyles.checklistRowMain}>
        <div className={checklistStyles.checklistCheck}>
          <CircleCheckFill
            size="small"
            className={checklistStyles.checklistSuccessIcon}
            aria-hidden
          />
          <div className={checklistStyles.checklistText}>
            <span className={checklistStyles.checklistTitle}>{item.title}</span>
            {item.note ? <p className={checklistStyles.checklistNote}>{item.note}</p> : null}
          </div>
        </div>
      </div>
    </li>
  )
}

function ReviewRow({
  item,
  checked,
  onToggle,
  showDivider,
}: {
  item: CatchUpChecklistItem
  checked: boolean
  onToggle: (id: string) => void
  showDivider?: boolean
}) {
  return (
    <li
      className={[
        checklistStyles.checklistRow,
        checked ? checklistStyles.checklistRowComplete : '',
        showDivider ? checklistStyles.checklistRowDivider : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={checklistStyles.checklistRowMain}>
        <div className={checklistStyles.checklistCheck}>
          <button
            type="button"
            className={checklistStyles.checklistToggle}
            aria-pressed={checked}
            aria-label={
              checked
                ? `Mark "${item.title}" as not confirmed`
                : `Mark "${item.title}" as confirmed`
            }
            onClick={() => onToggle(item.id)}
          >
            {checked ? (
              <CircleCheckFill
                size="small"
                className={checklistStyles.checklistSuccessIcon}
                aria-hidden
              />
            ) : (
              <CircleCheck size="small" aria-hidden />
            )}
          </button>
          <div className={checklistStyles.checklistText}>
            <span className={checklistStyles.checklistTitle}>{item.title}</span>
            {item.note ? <p className={checklistStyles.checklistNote}>{item.note}</p> : null}
          </div>
        </div>
      </div>
    </li>
  )
}

/** Two-group checklist: preparer-confirmed vs reviewer sign-off — matches Check return checklist. */
export default function CatchUpReviewChecklist({
  confirmedItems,
  reviewItems,
  checkedIds,
  onToggle,
}: CatchUpReviewChecklistProps) {
  return (
    <div className={checklistStyles.checklistPhaseBlock}>
      <p className={checklistStyles.checklistGroupLabel}>Sarah confirmed — ready to go</p>
      <ul className={checklistStyles.checklistList}>
        {confirmedItems.map((item, index) => (
          <ConfirmedRow
            key={item.id}
            item={item}
            showDivider={index > 0}
          />
        ))}
      </ul>

      <p className={checklistStyles.checklistGroupLabel}>Your review — confirm before approving</p>
      <ul className={checklistStyles.checklistList}>
        {reviewItems.map((item, index) => (
          <ReviewRow
            key={item.id}
            item={item}
            checked={checkedIds.has(item.id)}
            onToggle={onToggle}
            showDivider={index > 0}
          />
        ))}
      </ul>
    </div>
  )
}
