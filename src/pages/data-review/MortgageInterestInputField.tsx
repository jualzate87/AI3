import { useEffect, useState } from 'react'
import { TextField } from '@ids-ts/text-field'
import '@ids-ts/text-field/dist/main.css'
import { ESTIMATED_MORTGAGE_INTEREST } from '../../data/liveReturn'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'

type MortgageInterestInputFieldProps = {
  helperText?: string
  autoFocus?: boolean
}

export default function MortgageInterestInputField({
  helperText = `Enter the Form 1098 amount. Projection uses ${ESTIMATED_MORTGAGE_INTEREST.toLocaleString()} until you add one.`,
  autoFocus = false,
}: MortgageInterestInputFieldProps) {
  const { amounts, updateAmounts } = useSyncedReviewState()
  const [mortgageDraft, setMortgageDraft] = useState(() =>
    amounts.mortgageInterest > 0 ? String(amounts.mortgageInterest) : '',
  )

  useEffect(() => {
    if (amounts.mortgageInterest > 0) {
      setMortgageDraft(String(amounts.mortgageInterest))
    }
  }, [amounts.mortgageInterest])

  return (
    <TextField
      aria-label="Mortgage interest amount for Schedule A line 8a"
      label="Mortgage interest amount (Schedule A line 8a)"
      placeholder={ESTIMATED_MORTGAGE_INTEREST.toLocaleString()}
      helperText={helperText}
      size="small"
      width="100%"
      value={mortgageDraft}
      autoFocus={autoFocus}
      onChange={event => setMortgageDraft(event.target.value.replace(/[^\d]/g, ''))}
      onBlur={() => {
        const parsed = Number(mortgageDraft)
        if (Number.isFinite(parsed) && parsed > 0) {
          updateAmounts({ mortgageInterest: parsed })
        }
      }}
    />
  )
}
