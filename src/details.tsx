import { ReactNode, useEffect } from 'react'
import { Link, useRouter } from './router'
import { AccountIdentityInfo, OtherIncidentInfo, ReportIncident, useReport } from './reportState'
import { DescriptionField, IMPERSONATION_OPTIONS, ProgressSteps, StepActionBar } from './report'
import { assistedReviewPath, evidencePath, manualPath, startPath } from './reportRoutes'
import { financialRequiredErrors } from './validation'
import {
  ACCESS_STATUS_OPTIONS,
  ACCOUNT_PLATFORM_OPTIONS,
  OTHER_PLATFORM_OPTIONS,
  accountMisuseFieldLabel,
  accountMisuseOptions,
  accountPlatformFieldLabel,
  accountShowsAccess,
  accountShowsMisuse,
} from './categoryLabels'

function SourceTag() {
  return <span className="source-tag">From your description</span>
}

function iconProps() {
  return { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
}

function CheckBadgeGlyph() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#1c4b32" /><path d="M6.3 10.3l2.3 2.3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function InfoDotGlyph() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4" /><line x1="10" y1="9" x2="10" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="10" cy="6.3" r="1" fill="currentColor" /></svg>
}

function PhoneGlyph() {
  return <svg {...iconProps()}><path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z" /></svg>
}

function GlobeGlyph() {
  return <svg {...iconProps()}><circle cx="12" cy="12" r="9" /><line x1="3" y1="12" x2="21" y2="12" /><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" /></svg>
}

function MailGlyph() {
  return <svg {...iconProps()}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
}

function DotsGlyph() {
  return <svg {...iconProps()} strokeWidth="2.4"><circle cx="5" cy="12" r="0.6" /><circle cx="12" cy="12" r="0.6" /><circle cx="19" cy="12" r="0.6" /></svg>
}

function HelpfulSidebar({ addPath }: { addPath: string }) {
  const items: [ReactNode, string][] = [
    [<PhoneGlyph />, 'Suspect mobile number'],
    [<GlobeGlyph />, 'Website or social profile'],
    [<MailGlyph />, 'Email address'],
    [<DotsGlyph />, 'Other suspect details'],
  ]
  return <aside className="needed helpful-sidebar">
    <h2>Helpful if you have it</h2>
    <ul className="helpful-list">
      {items.map(([icon, label]) => <li key={label} className="helpful-item">
        {icon}
        <span>{label}</span>
        <Link className="helpful-add" to={addPath}>Add</Link>
      </li>)}
    </ul>
  </aside>
}

const FIELD_HELPERS: Record<string, string> = {
  amount: 'An approximate amount is okay.',
  paymentMethod: 'You can select this later if unsure.',
  date: 'An approximate date is okay.',
  approximateTime: 'An approximate time is okay.',
  contactMethod: 'Skip this if not applicable.',
  transactionId: 'Add this later if you find it.',
  accountPlatform: 'You can select this later if unsure.',
  accessStatus: 'You can update this later.',
  misuseType: 'You can add this later.',
  otherPlatform: 'You can select this later if unsure.',
  identifier: 'Add this later if you have it.',
}

export function ReportDetails() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()
  const category = report.category ?? 'financial-fraud'

  useEffect(() => {
    if (!report.entryMode) navigate(startPath(report.category))
  }, [report.entryMode, report.category, navigate])

  if (!report.entryMode) return null

  const isAssisted = report.entryMode === 'assisted'

  const updateIncident = <K extends keyof ReportIncident>(key: K, value: ReportIncident[K]) =>
    setReport(current => ({ ...current, incident: { ...current.incident, [key]: value } }))

  const updateTransaction = (key: 'transactionId' | 'merchantName' | 'transactionDate', value: string) =>
    setReport(current => ({ ...current, transaction: { ...current.transaction, [key]: value || null } }))

  const updateAccount = <K extends keyof AccountIdentityInfo>(key: K, value: AccountIdentityInfo[K]) =>
    setReport(current => ({ ...current, accountIdentity: { ...current.accountIdentity, [key]: value } }))

  const updateOther = <K extends keyof OtherIncidentInfo>(key: K, value: OtherIncidentInfo[K]) =>
    setReport(current => ({ ...current, otherIncident: { ...current.otherIncident, [key]: value } }))

  let typeLabel = 'Incident type'
  let typeValue = report.incident.type ?? 'Financial fraud'
  let extraFields: ReactNode[]

  if (category === 'account-identity') {
    typeLabel = 'Issue'
    typeValue = report.accountIdentity.affectedType ?? 'Not provided yet'
    const affectedType = report.accountIdentity.affectedType
    extraFields = [
      <label key="accountPlatform">{accountPlatformFieldLabel(affectedType)} {isAssisted && report.accountIdentity.accountPlatform && <SourceTag />}
        <select value={report.accountIdentity.accountPlatform ?? ''} onChange={e => updateAccount('accountPlatform', e.target.value || null)}>
          <option value="">Not provided yet</option>
          {ACCOUNT_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
        {!report.accountIdentity.accountPlatform && <span className="detail-field-helper">{FIELD_HELPERS.accountPlatform}</span>}
      </label>,
    ]
    if (accountShowsAccess(affectedType)) {
      extraFields.push(<label key="accessStatus">Can you still access the account? {isAssisted && report.accountIdentity.accessStatus && <SourceTag />}
        <select value={report.accountIdentity.accessStatus ?? ''} onChange={e => updateAccount('accessStatus', e.target.value || null)}>
          <option value="">Not provided yet</option>
          {ACCESS_STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
        {!report.accountIdentity.accessStatus && <span className="detail-field-helper">{FIELD_HELPERS.accessStatus}</span>}
      </label>)
    }
    if (accountShowsMisuse(affectedType)) {
      extraFields.push(<label key="misuseType">{accountMisuseFieldLabel(affectedType)} {isAssisted && report.accountIdentity.misuseType && <SourceTag />}
        <select value={report.accountIdentity.misuseType ?? ''} onChange={e => updateAccount('misuseType', e.target.value || null)}>
          <option value="">Not provided yet</option>
          {accountMisuseOptions(affectedType).map(o => <option key={o}>{o}</option>)}
        </select>
        {!report.accountIdentity.misuseType && <span className="detail-field-helper">{FIELD_HELPERS.misuseType}</span>}
      </label>)
    }
  } else if (category === 'other-cyber') {
    typeLabel = 'Issue'
    typeValue = report.otherIncident.issueType ?? 'Not provided yet'
    const issueType = report.otherIncident.issueType
    extraFields = [
      <label key="otherPlatform">Platform {isAssisted && report.otherIncident.platform && <SourceTag />}
        <select value={report.otherIncident.platform ?? ''} onChange={e => updateOther('platform', e.target.value || null)}>
          <option value="">Not provided yet</option>
          {OTHER_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
        {!report.otherIncident.platform && <span className="detail-field-helper">{FIELD_HELPERS.otherPlatform}</span>}
      </label>,
    ]
    if (issueType === 'Threats or harassment') {
      extraFields.push(<label key="contactMethod">How you are being contacted {isAssisted && report.incident.contactMethod && <SourceTag />}
        <select value={report.incident.contactMethod ?? ''} onChange={e => updateIncident('contactMethod', e.target.value || null)}>
          <option value="">Not provided yet</option>
          {OTHER_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
        {!report.incident.contactMethod && <span className="detail-field-helper">{FIELD_HELPERS.contactMethod}</span>}
      </label>)
    }
    if (issueType === 'Fake profile or impersonation' || issueType === 'Suspicious message, link or website') {
      extraFields.push(<label key="identifier">Profile, account or link {isAssisted && report.otherIncident.personOrAccountIdentifier && <SourceTag />}
        <input value={report.otherIncident.personOrAccountIdentifier ?? ''} onChange={e => updateOther('personOrAccountIdentifier', e.target.value || null)} placeholder="Not provided yet" />
        {!report.otherIncident.personOrAccountIdentifier && <span className="detail-field-helper">{FIELD_HELPERS.identifier}</span>}
      </label>)
    }
  } else {
    extraFields = [
      <label key="amount">Amount involved (₹) {isAssisted && report.incident.amount != null && <SourceTag />}
        <input inputMode="numeric" type="number" value={report.incident.amount ?? ''} onChange={e => updateIncident('amount', e.target.value ? Number(e.target.value) : null)} placeholder="0" />
        {(report.incident.amount == null || report.incident.amount <= 0) && <span className="detail-field-helper field-error">This is required for a financial-fraud complaint.</span>}
      </label>,
      <label key="paymentMethod">Payment method {isAssisted && report.incident.paymentMethod && <SourceTag />}
        <select value={report.incident.paymentMethod ?? ''} onChange={e => updateIncident('paymentMethod', e.target.value || null)}>
          <option value="">Not provided yet</option>
          <option>UPI</option>
          <option>Bank transfer</option>
          <option>Card</option>
          <option>Net banking</option>
          <option>Wallet</option>
          <option>Other</option>
        </select>
        {!report.incident.paymentMethod && <span className="detail-field-helper">{FIELD_HELPERS.paymentMethod}</span>}
      </label>,
      <label key="contactMethod">How were you contacted? {isAssisted && report.incident.contactMethod && <SourceTag />}
        <select value={report.incident.contactMethod ?? ''} onChange={e => updateIncident('contactMethod', e.target.value || null)}>
          <option value="">Not provided yet</option>
          <option>Phone call</option>
          <option>SMS</option>
          <option>WhatsApp</option>
          <option>Email</option>
          <option>In person</option>
          <option>Not applicable</option>
        </select>
        {!report.incident.contactMethod && <span className="detail-field-helper">{FIELD_HELPERS.contactMethod}</span>}
      </label>,
      <label key="impersonation">Claimed to represent {isAssisted && report.incident.impersonation && <SourceTag />}
        <select value={report.incident.impersonation ?? ''} onChange={e => updateIncident('impersonation', e.target.value || null)}>
          <option value="">Not applicable</option>
          {IMPERSONATION_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
      </label>,
    ]
  }

  const isFinancial = category === 'financial-fraud'
  const financialErrors = isFinancial ? financialRequiredErrors(report) : []
  const canContinue = financialErrors.length === 0

  const heading = category === 'financial-fraud'
    ? (isAssisted ? 'Here’s what we understood' : 'Check your details')
    : (isAssisted ? 'Review what we understood' : 'Review your details')

  const backTo = () => {
    if (category === 'financial-fraud') { navigate(isAssisted ? '/report/assisted' : '/report/manual'); return }
    navigate(isAssisted ? assistedReviewPath(category) : manualPath(category))
  }

  return <main className="report-page report-page-wide">
    <ProgressSteps current="Details" />
    <div className="details-intro">
      <div className="report-intro">
        <h1>{heading}</h1>
        <p className="lead">We filled these in from what you told us.</p>
        <p className="lead">Check anything that’s missing or incorrect.</p>
      </div>
      {isAssisted && <span className="understood-pill">
        <CheckBadgeGlyph /> Details understood from your description <InfoDotGlyph />
      </span>}
    </div>

    <div className="details-layout">
      <form className="review-form details-card" onSubmit={event => event.preventDefault()}>
        <h2 className="details-section-title">Incident details</h2>
        <div className="field-grid">
          <label>{typeLabel}
            <input value={typeValue} disabled />
          </label>
          <label>When did it happen?
            <div className="field-split">
              <input value={report.incident.date ?? ''} onChange={e => updateIncident('date', e.target.value || null)} placeholder="Date not provided" />
              <input value={report.incident.approximateTime ?? ''} onChange={e => updateIncident('approximateTime', e.target.value || null)} placeholder="Time not provided" />
            </div>
          </label>
          {extraFields}
        </div>

        {isFinancial && <>
          <h2 className="details-section-title">Transaction details</h2>
          <div className="field-grid">
            <label>Bank / wallet / merchant {isAssisted && report.transaction.merchantName && <SourceTag />}
              <input value={report.transaction.merchantName ?? ''} onChange={e => updateTransaction('merchantName', e.target.value)} placeholder="e.g. HDFC Bank, Paytm" />
              {!report.transaction.merchantName && <span className="detail-field-helper field-error">This is required for a financial-fraud complaint.</span>}
            </label>
            <label>Transaction / UTR number (if available) {isAssisted && report.transaction.transactionId && <SourceTag />}
              <input value={report.transaction.transactionId ?? ''} onChange={e => updateTransaction('transactionId', e.target.value)} placeholder="12-digit UTR" />
              {(!report.transaction.transactionId || !/^\d{12}$/.test(report.transaction.transactionId)) && <span className="detail-field-helper field-error">Must be exactly 12 digits.</span>}
            </label>
            <label>Transaction date
              <input value={report.transaction.transactionDate ?? ''} onChange={e => updateTransaction('transactionDate', e.target.value)} placeholder="e.g. 24 August 2026" />
              {!report.transaction.transactionDate && <span className="detail-field-helper field-error">This is required for a financial-fraud complaint.</span>}
            </label>
          </div>
        </>}

        <DescriptionField
          value={report.incident.description}
          onChange={value => updateIncident('description', value)}
          generated={isAssisted}
        />
      </form>

      <HelpfulSidebar addPath={evidencePath(category)} />
    </div>

    {financialErrors.length > 0 && <p className="field-error">
      Complete the required financial-fraud fields above before continuing.
    </p>}

    <StepActionBar
      onBack={backTo}
      primaryLabel="Continue to evidence"
      onPrimary={() => navigate(evidencePath(category))}
      primaryDisabled={!canContinue}
    />
  </main>
}
