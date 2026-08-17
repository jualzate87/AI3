import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SmartReturnHeader from './SmartReturnHeader'
import InputMenuNav from './input-return/InputMenuNav'
import InputFormPanel from './input-return/InputFormPanel'
import {
  inputNavItemById,
  type InputNavItemId,
} from '../data/inputMenuNav'
import styles from '../styles/InputReturnPage.module.css'

export default function InputReturnPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const formParam = searchParams.get('form') as InputNavItemId | null
  const diagnostic = searchParams.get('diagnostic')
  const [activeItemId, setActiveItemId] = useState<InputNavItemId>(
    () => inputNavItemById(formParam).id,
  )
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const el = document.documentElement
    const prevTheme = el.getAttribute('data-theme')
    el.setAttribute('data-theme', 'intuit')
    el.style.setProperty('--color-action-standard', '#205ea3')
    el.style.setProperty('--color-action-standard-hover', '#174d87')
    el.style.setProperty('--color-action-standard-active', '#174d87')
    return () => {
      if (prevTheme) el.setAttribute('data-theme', prevTheme)
      el.style.removeProperty('--color-action-standard')
      el.style.removeProperty('--color-action-standard-hover')
      el.style.removeProperty('--color-action-standard-active')
    }
  }, [])

  useEffect(() => {
    if (formParam && formParam !== activeItemId) {
      setActiveItemId(inputNavItemById(formParam).id)
    }
  }, [formParam, activeItemId])

  const handleSelectItem = (id: InputNavItemId) => {
    setActiveItemId(id)
    const next = new URLSearchParams(searchParams)
    next.set('form', id)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className={styles.page} data-theme="intuit">
      <SmartReturnHeader activeTab="inputreturn" />

      <div className={styles.body}>
        <div className={styles.contentArea}>
          <InputMenuNav
            activeItemId={activeItemId}
            onSelect={handleSelectItem}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <InputFormPanel
            activeItemId={activeItemId}
            showMissingEinDiagnostic={diagnostic === 'missing-ein'}
          />
        </div>
      </div>

      <div className={styles.footerBar}>
        <button type="button" className={styles.footerLink} onClick={() => navigate('/import-confirmation')}>
          Back to import confirmation
        </button>
      </div>
    </div>
  )
}
