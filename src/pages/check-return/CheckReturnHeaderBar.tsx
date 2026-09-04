import { PersonTwo, CircleInfo } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { DropdownButton, MenuItem } from '@ids-ts/dropdown-button'
import '@ids-ts/dropdown-button/dist/main.css'
import { SplitButton } from '@ids-ts/split-button'
import '@ids-ts/split-button/dist/main.css'
import styles from '../../styles/check-return/CheckReturnHeaderBar.module.css'

export default function CheckReturnHeaderBar() {
  return (
    <div className={styles.bar} data-automation-id="check-return-header-bar">
      <div className={styles.left}>
        <div className={styles.wordmark} aria-label="ProConnect Tax Online">
          <span className={styles.wordmarkLine}>ProConnect</span>
          <span className={styles.wordmarkLine}>Tax Online</span>
        </div>

        <PersonTwo size="small" className={styles.filingIcon} aria-hidden />

        <span className={styles.clientContext}>
          Jordan Rivera · 2025 Individual Return
        </span>

        <div className={styles.divider} aria-hidden />

        <div className={styles.titleBlock}>
          <span className={styles.pageLabel}>Check Return</span>
          <div className={styles.clientTitleRow}>
            <span className={styles.clientTitle}>Jessica Morgan</span>
            <Button
              priority="borderless"
              size="small"
              className={styles.infoBtn}
              aria-label="Jessica Morgan client information"
            >
              <CircleInfo size="small" />
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.avatar} aria-label="User initials JH">
          JH
        </div>

        <DropdownButton
          label="Copy return..."
          buttonPriority="secondary"
          buttonPurpose="passive"
          buttonSize="medium"
          automationId="check-return-copy-return"
          className={styles.actionDropdown}
        >
          <MenuItem value="copy-full">Copy full return</MenuItem>
          <MenuItem value="copy-federal">Copy federal only</MenuItem>
        </DropdownButton>

        <DropdownButton
          label="More actions"
          buttonPriority="secondary"
          buttonPurpose="passive"
          buttonSize="medium"
          automationId="check-return-more-actions"
          className={styles.actionDropdown}
        >
          <MenuItem value="archive">Archive return</MenuItem>
          <MenuItem value="delete">Delete return</MenuItem>
        </DropdownButton>

        <SplitButton
          label="Print/Save PDF"
          buttonPriority="primary"
          buttonPurpose="standard"
          buttonSize="medium"
          automationId="check-return-print-save-pdf"
          className={styles.printSplitBtn}
        >
          <MenuItem value="print">Print</MenuItem>
          <MenuItem value="save-pdf">Save as PDF</MenuItem>
          <MenuItem value="save-package">Save client copy package</MenuItem>
        </SplitButton>
      </div>
    </div>
  )
}
