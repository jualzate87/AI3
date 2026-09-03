import ViewSourceDocumentsButton from '../../components/ViewSourceDocumentsButton'
import InputDocTabBar, { type InputDocTabItem } from './InputDocTabBar'
import styles from '../../styles/data-review/DetailFields.module.css'

export type { InputDocTabItem }

interface InputFormPageHeaderProps {
  title: string
  onViewSourceDocuments?: () => void
  docTabs?: InputDocTabItem[]
  activeDocKey?: string
  onDocTabChange?: (key: string) => void
}

export default function InputFormPageHeader({
  title,
  onViewSourceDocuments,
  docTabs,
  activeDocKey,
  onDocTabChange,
}: InputFormPageHeaderProps) {
  const showDocTabs =
    docTabs && docTabs.length > 1 && activeDocKey && onDocTabChange

  return (
    <div className={styles.pageHeaderInput}>
      <div className={styles.inputHeaderTitleRow}>
        <h2 className={styles.inputHeaderTitle}>{title}</h2>
        <ViewSourceDocumentsButton onClick={onViewSourceDocuments} />
      </div>
      {showDocTabs && (
        <InputDocTabBar
          tabs={docTabs}
          activeKey={activeDocKey}
          onChange={onDocTabChange}
        />
      )}
    </div>
  )
}
