import type { TopTab } from '../pages/data-review/ReviewTab'

export type InputNavItemId = 'w2' | '1099-int' | '1099-div' | '1099-r' | '1099-nec'

export interface InputNavItem {
  id: InputNavItemId
  label: string
  topTab: TopTab
}

export interface InputNavCategory {
  id: string
  label: string
  items: InputNavItem[]
  disabled?: boolean
}

export const INPUT_NAV_CATEGORIES: InputNavCategory[] = [
  {
    id: 'income',
    label: 'Income',
    items: [
      { id: 'w2', label: 'W-2 — Wages, salaries, tips', topTab: 'w2s' },
      { id: '1099-int', label: '1099-INT — Interest income', topTab: '1099-ints' },
      { id: '1099-div', label: '1099-DIV — Dividend income', topTab: '1099-divs' },
      { id: '1099-r', label: '1099-R — Retirement distributions', topTab: '1099-rs' },
      { id: '1099-nec', label: '1099-NEC — Nonemployee compensation', topTab: '1099-necs' },
    ],
  },
  { id: 'deductions', label: 'Deductions', items: [], disabled: true },
  { id: 'credits', label: 'Credits', items: [], disabled: true },
  { id: 'taxes', label: 'Taxes', items: [], disabled: true },
  { id: 'other', label: 'Other', items: [], disabled: true },
]

const ALL_ITEMS = INPUT_NAV_CATEGORIES.flatMap(c => c.items)

export function inputNavItemById(id: string | null | undefined): InputNavItem {
  return ALL_ITEMS.find(item => item.id === id) ?? ALL_ITEMS[0]
}

export function inputNavItemByTopTab(tab: TopTab): InputNavItem {
  return ALL_ITEMS.find(item => item.topTab === tab) ?? ALL_ITEMS[0]
}
