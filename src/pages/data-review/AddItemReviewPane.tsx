import { useMemo, useState } from 'react'
import { Upload } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import DropdownButton from '@ids-ts/dropdown-button'
import '@ids-ts/dropdown-button/dist/main.css'
import { MenuItem } from '@ids-ts/menu'
import '@ids-ts/menu/dist/main.css'
import ImportSourceBadge from '../../components/ImportSourceBadge/ImportSourceBadge'
import {
  DOCUMENT_LIBRARY,
  libraryDocsForFormType,
  type LibraryDocument,
} from '../../data/documentLibrary'
import {
  inputScreensForTopTab,
  reviewInputScreenById,
  type ReviewInputScreen,
} from '../../data/reviewInputScreens'
import type { TopTab } from './ReviewTab'
import DocumentPreview from './DocumentPreview'
import styles from '../../styles/data-review/AddItemReviewPane.module.css'

export type AddItemLinkResult = {
  input: ReviewInputScreen
  libraryDoc: LibraryDocument
  importReady: boolean
}

type Props = {
  activeTopTab: TopTab
  usedLibraryIds: Set<string>
  onLink: (result: AddItemLinkResult) => void
  onCancel: () => void
}

export default function AddItemReviewPane({
  activeTopTab,
  usedLibraryIds,
  onLink,
  onCancel,
}: Props) {
  const inputOptions = useMemo(() => inputScreensForTopTab(activeTopTab), [activeTopTab])

  const [selectedInputId, setSelectedInputId] = useState<string | null>(inputOptions[0]?.id ?? null)
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null)
  const [uploadedDoc, setUploadedDoc] = useState<LibraryDocument | null>(null)

  const selectedInput = reviewInputScreenById(selectedInputId)

  const libraryOptions = useMemo(() => {
    const formType = selectedInput?.formType
    if (!formType) return []
    return libraryDocsForFormType(formType).filter(d => !usedLibraryIds.has(d.id))
  }, [selectedInput?.formType, usedLibraryIds])

  const activeDoc = uploadedDoc ?? libraryOptions.find(d => d.id === selectedLibraryId) ?? null

  const documentLabel = activeDoc?.label ?? 'Select uploaded document'
  const inputLabel = selectedInput?.label ?? 'Select input screen'

  const canLink = Boolean(selectedInput && activeDoc)

  const handleUpload = () => {
    const next = libraryOptions[0] ?? DOCUMENT_LIBRARY[0]
    if (next) {
      setUploadedDoc({ ...next, label: `${next.label} (uploaded just now)` })
      setSelectedLibraryId(null)
    }
  }

  const handleLink = () => {
    if (!selectedInput || !activeDoc) return
    onLink({
      input: selectedInput,
      libraryDoc: activeDoc,
      importReady: selectedInput.importReady,
    })
  }

  return (
    <div className={styles.root}>
      <div className={styles.peelRow}>
        <span className={styles.newDocPill}>New document</span>
        <ImportSourceBadge variant="manual" />
      </div>

      <div className={styles.split}>
        <div className={styles.docPane}>
          {activeDoc ? (
            <DocumentPreview imageSrc={activeDoc.imageSrc} alt={activeDoc.label} />
          ) : (
            <div className={styles.docEmpty}>
              <div className={styles.docEmptyControls}>
                <DropdownButton
                  label={documentLabel}
                  buttonPurpose="passive"
                  buttonPriority="secondary"
                  buttonSize="medium"
                  alignment="left"
                  onSelect={(_e, info) => {
                    const id = String(info?.value ?? '')
                    setSelectedLibraryId(id)
                    setUploadedDoc(null)
                  }}
                >
                  {libraryOptions.length === 0 ? (
                    <MenuItem value="" displayedLabel="No documents available" disabled>
                      No uploaded documents for this form type
                    </MenuItem>
                  ) : (
                    libraryOptions.map(doc => (
                      <MenuItem key={doc.id} value={doc.id} displayedLabel={doc.label}>
                        {doc.label}
                      </MenuItem>
                    ))
                  )}
                </DropdownButton>
                <Button priority="secondary" purpose="passive" size="medium" onClick={handleUpload}>
                  <Upload size="small" /> Upload document
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.resizeHandle} aria-hidden />

        <div className={styles.inputPane}>
          <header className={styles.inputHeader}>
            <h2 className={styles.inputTitle}>Select input screen to review</h2>
          </header>
          <div className={styles.inputBody}>
            <DropdownButton
              label={inputLabel}
              buttonPurpose="passive"
              buttonPriority="secondary"
              buttonSize="medium"
              alignment="left"
              onSelect={(_e, info) => {
                setSelectedInputId(String(info?.value ?? ''))
                setSelectedLibraryId(null)
                setUploadedDoc(null)
              }}
            >
              {inputOptions.map(opt => (
                <MenuItem key={opt.id} value={opt.id} displayedLabel={opt.label}>
                  {opt.label}
                </MenuItem>
              ))}
            </DropdownButton>
          </div>
          <footer className={styles.inputFooter}>
            <Button priority="tertiary" size="medium" onClick={onCancel}>
              Cancel
            </Button>
            <Button priority="primary" size="medium" onClick={handleLink} disabled={!canLink}>
              Link and start review
            </Button>
          </footer>
        </div>
      </div>
    </div>
  )
}
