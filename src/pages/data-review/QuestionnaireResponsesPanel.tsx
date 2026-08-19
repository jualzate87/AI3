import { useEffect, useRef, useState } from 'react'
import PageMessage from '@ids-ts/page-message'
import '@ids-ts/page-message/dist/main.css'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { LinkActionButton } from '@ids-ts/link-action-button'
import '@ids-ts/link-action-button/dist/main.css'
import { B3 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import DocVerifyHeaderActions from './DocVerifyHeaderActions'
import {
  QUESTIONNAIRE_DOC_KEY,
  QUESTIONNAIRE_PANEL_META,
  QUESTIONNAIRE_RESPONSES,
  formatQuestionnaireSourceMix,
  getQuestionnaireSourceLabel,
  type QuestionnaireFieldLink,
  type QuestionnaireFieldLinkStatus,
  type QuestionnaireResponseId,
} from './questionnaireData'
import type { ActivityEntry } from '../../hooks/useSyncedReviewState'
import styles from '../../styles/data-review/QuestionnaireResponsesPanel.module.css'

interface QuestionnaireResponsesPanelProps {
  verifiedDocs?: Set<string>
  verifiedDocsMeta?: Map<string, ActivityEntry>
  reviewerConfirmedDocs?: Set<string>
  reviewerConfirmedDocsMeta?: Map<string, ActivityEntry>
  onVerifyDoc?: (docKey: string) => void
  /** Scroll/highlight a seeded Q&A card (from Phase 2 View client response) */
  highlightResponseId?: QuestionnaireResponseId | null
  /** Jump to a linked return field from a questionnaire answer */
  onNavigateToField?: (link: QuestionnaireFieldLink) => void
}

function linkStatusBadge(status: QuestionnaireFieldLinkStatus) {
  switch (status) {
    case 'applied':
      return <Badge status="success" label="Applied" capitalization="sentence" />
    case 'pending':
      return <Badge status="warn" label="Pending" capitalization="sentence" />
    case 'flagged':
      return <Badge status="error" label="Flagged" capitalization="sentence" />
    case 'planning':
      return <Badge status="info" label="Planning" capitalization="sentence" />
    default:
      return null
  }
}

export default function QuestionnaireResponsesPanel({
  verifiedDocs,
  verifiedDocsMeta,
  reviewerConfirmedDocs,
  reviewerConfirmedDocsMeta,
  onVerifyDoc,
  highlightResponseId = null,
  onNavigateToField,
}: QuestionnaireResponsesPanelProps) {
  const cardRefs = useRef<Partial<Record<QuestionnaireResponseId, HTMLElement | null>>>({})
  const [introOpen, setIntroOpen] = useState(true)

  useEffect(() => {
    if (!highlightResponseId) return
    const el = cardRefs.current[highlightResponseId]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightResponseId])

  const primarySourceLabel = getQuestionnaireSourceLabel(QUESTIONNAIRE_PANEL_META.primarySource)

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>Questionnaire</h2>
            <Badge
              status="info"
              label={primarySourceLabel}
              capitalization="sentence"
              priority="secondary"
            />
          </div>
          <p className={styles.subtitle}>
            {QUESTIONNAIRE_PANEL_META.clientName} · {QUESTIONNAIRE_PANEL_META.submittedRange}
            {' · '}
            {QUESTIONNAIRE_PANEL_META.responseCount} responses
          </p>
        </div>
        <DocVerifyHeaderActions
          docKey={QUESTIONNAIRE_DOC_KEY}
          verifiedDocs={verifiedDocs}
          verifiedDocsMeta={verifiedDocsMeta}
          reviewerConfirmedDocs={reviewerConfirmedDocs}
          reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
          onVerifyDoc={onVerifyDoc}
        />
      </div>

      <div className={styles.list}>
        {introOpen && (
          <div className={styles.introMessage}>
            <PageMessage
              type="discovery"
              title="Client answers feed the return"
              open={introOpen}
              dismissible
              onClose={() => setIntroOpen(false)}
            >
              <B3 className={styles.introBody}>
                Review each answer, open linked fields to confirm values, and mark reviewed when done.
                Sources: {formatQuestionnaireSourceMix(QUESTIONNAIRE_PANEL_META.sourceMix).toLowerCase()}.
              </B3>
            </PageMessage>
          </div>
        )}

        {QUESTIONNAIRE_RESPONSES.map((qa) => (
          <article
            key={qa.id}
            id={`questionnaire-${qa.id}`}
            ref={(node) => { cardRefs.current[qa.id] = node }}
            className={`${styles.card} ${highlightResponseId === qa.id ? styles.cardHighlight : ''}`}
          >
            <div className={styles.cardMeta}>
              <p className={styles.topic}>{qa.topic}</p>
              <Badge
                status="neutral"
                label={getQuestionnaireSourceLabel(qa.sourceChannel)}
                capitalization="sentence"
                priority="secondary"
              />
            </div>

            <p className={styles.question}>
              <span className={styles.questionLabel}>Asked</span>
              {qa.question}
            </p>

            <div className={styles.bubble}>
              <span className={styles.avatar} aria-hidden="true">JD</span>
              <div className={styles.qaText}>
                <span className={styles.qaName}>
                  {qa.clientName} · {qa.date}
                </span>
                <p className={styles.qaAnswer}>{qa.answer}</p>
              </div>
            </div>

            <div className={styles.linkageSection}>
              <p className={styles.linkageHeading}>On return</p>
              {qa.appliedSummary && (
                <p className={styles.linkageSummary}>{qa.appliedSummary}</p>
              )}
              <ul className={styles.fieldLinkList}>
                {qa.fieldLinks.map((link, index) => (
                  <li key={`${qa.id}-${link.fieldKey}-${index}`} className={styles.fieldLinkRow}>
                    <div className={styles.fieldLinkMain}>
                      {onNavigateToField ? (
                        <LinkActionButton
                          size="small"
                          onClick={() => onNavigateToField(link)}
                        >
                          {link.label}
                        </LinkActionButton>
                      ) : (
                        <span className={styles.fieldLinkLabel}>{link.label}</span>
                      )}
                      {linkStatusBadge(link.status)}
                    </div>
                    {link.statusNote && (
                      <p className={styles.fieldLinkNote}>{link.statusNote}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
