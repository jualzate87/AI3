import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from '@design-systems/icons'
import styles from '../styles/HeaderSelectMenu.module.css'

export type HeaderSelectOption = {
  id: string
  label: string
}

interface HeaderSelectMenuProps {
  ariaLabel: string
  value: string
  options: HeaderSelectOption[]
  onChange: (id: string) => void
}

export default function HeaderSelectMenu({
  ariaLabel,
  value,
  options,
  onChange,
}: HeaderSelectMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find(option => option.id === value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
      >
        {selected?.label ?? ariaLabel}
        <ChevronDown size="small" aria-hidden />
      </button>
      {open ? (
        <ul className={styles.menu} role="listbox" aria-label={ariaLabel}>
          {options.map(option => (
            <li key={option.id} role="none">
              <button
                type="button"
                role="option"
                aria-selected={option.id === value}
                className={`${styles.menuItem} ${option.id === value ? styles.menuItemSelected : ''}`}
                onClick={() => {
                  onChange(option.id)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
