import { ReactNode, useEffect } from 'react'
import { useRouter } from './router'
import { AccountIdentityInfo, OtherIncidentInfo, ReportIncident, useReport } from './reportState'
import { DescriptionField, ProgressSteps, StepActionBar } from './report'
import { assistedReviewPath, evidencePath, manualPath, startPath } from './reportRoutes'
import { descriptionMeetsMinimum, financialRequiredErrors } from './validation'
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

  const field = (key: string, hasValue: boolean, node: ReactNode) => ({ key, hasValue, node })

  let typeLabel = 'Incident type'
  let typeValue = report.incident.type ?? 'Financial fraud'
  let fields: ReturnType<typeof field>[]

  if (category === 'account-identity') {
    typeLabel = 'Issue'
    typeValue = report.accountIdentity.affectedType ?? 'Not provided yet'
    const affectedType = report.accountIdentity.affectedType
    fields = [
      field('accountPlatform', !!report.accountIdentity.accountPlatform, <label>{accountPlatformFieldLabel(affectedType)} {isAssisted && report.accountIdentity.accountPlatform && <SourceTag />}
        <select value={report.accountIdentity.accountPlatform ?? ''} onChange={e => updateAccount('accountPlatform', e.target.value || null)}>
          <option value="">Not provided yet</option>
          {ACCOUNT_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
        {!report.accountIdentity.accountPlatform && <span className="detail-field-helper">{FIELD_HELPERS.accountPlatform}</span>}
      </label>),
      field('date', !!report.incident.date, <label>Date {isAssisted && report.incident.date && <SourceTag />}
        <input value={report.incident.date ?? ''} onChange={e => updateIncident('date', e.target.value || null)} placeholder="Not provided yet" />
        {!report.incident.date && <span className="detail-field-helper">{FIELD_HELPERS.date}</span>}
      </label>),
      field('approximateTime', !!report.incident.approximateTime, <label>Approximate time {isAssisted && report.incident.approximateTime && <SourceTag />}
        <input value={report.incident.approximateTime ?? ''} onChange={e => updateIncident('approximateTime', e.target.value || null)} placeholder="Not provided yet" />
        {!report.incident.approximateTime && <span className="detail-field-helper">{FIELD_HELPERS.approximateTime}</span>}
      </label>),
    ]
    if (accountShowsAccess(affectedType)) {
      fields.push(field('accessStatus', !!report.accountIdentity.accessStatus, <label>Can you still access the account? {isAssisted && report.accountIdentity.accessStatus && <SourceTag />}
        <select value={report.accountIdentity.accessStatus ?? ''} onChange={e => updateAccount('accessStatus', e.target.value || null)}>
          <option value="">Not provided yet</option>
          {ACCESS_STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
        {!report.accountIdentity.accessStatus && <span className="detail-field-helper">{FIELD_HELPERS.accessStatus}</span>}
      </label>))
    }
    if (accountShowsMisuse(affectedType)) {
      fields.push(field('misuseType', !!report.accountIdentity.misuseType, <label>{accountMisuseFieldLabel(affectedType)} {isAssisted && report.accountIdentity.misuseType && <SourceTag />}
        <select value={report.accountIdentity.misuseType ?? ''} onChange={e => updateAccount('misuseType', e.target.value || null)}>
          <option value="">Not provided yet</option>
          {accountMisuseOptions(affectedType).map(o => <option key={o}>{o}</option>)}
        </select>
        {!report.accountIdentity.misuseType && <span className="detail-field-helper">{FIELD_HELPERS.misuseType}</span>}
      </label>))
    }
  } else if (category === 'other-cyber') {
    typeLabel = 'Issue'
    typeValue = report.otherIncident.issueType ?? 'Not provided yet'
    const issueType = report.otherIncident.issueType
    fields = [
      field('otherPlatform', !!report.otherIncident.platform, <label>Platform {isAssisted && report.otherIncident.platform && <SourceTag />}
        <select value={report.otherIncident.platform ?? ''} onChange={e => updateOther('platform', e.target.value || null)}>
          <option value="">Not provided yet</option>
          {OTHER_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
        {!report.otherIncident.platform && <span className="detail-field-helper">{FIELD_HELPERS.otherPlatform}</span>}
      </label>),
      field('date', !!report.incident.date, <label>Date {isAssisted && report.incident.date && <SourceTag />}
        <input value={report.incident.date ?? ''} onChange={e => updateIncident('date', e.target.value || null)} placeholder="Not provided yet" />
        {!report.incident.date && <span className="detail-field-helper">{FIELD_HELPERS.date}</span>}
      </label>),
    ]
    if (issueType === 'Threats or harassment') {
      fields.push(field('approximateTime', !!report.incident.approximateTime, <label>Approximate time {isAssisted && report.incident.approximateTime && <SourceTag />}
        <input value={report.incident.approximateTime ?? ''} onChange={e => updateIncident('approximateTime', e.target.value || null)} placeholder="Not provided yet" />
        {!report.incident.approximateTime && <span className="detail-field-helper">{FIELD_HELPERS.approximateTime}</span>}
      </label>))
      fields.push(field('contactMethod', !!report.incident.contactMethod, <label>How you are being contacted {isAssisted && report.incident.contactMethod && <SourceTag />}
        <select value={report.incident.contactMethod ?? ''} onChange={e => updateIncident('contactMethod', e.target.value || null)}>
          <option value="">Not provided yet</option>
          {OTHER_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
        {!report.incident.contactMethod && <span className="detail-field-helper">{FIELD_HELPERS.contactMethod}</span>}
      </label>))
    }
    if (issueType === 'Fake profile or impersonation' || issueType === 'Suspicious message, link or website') {
      fields.push(field('identifier', !!report.otherIncident.personOrAccountIdentifier, <label>Profile, account or link {isAssisted && report.otherIncident.personOrAccountIdentifier && <SourceTag />}
        <input value={report.otherIncident.personOrAccountIdentifier ?? ''} onChange={e => updateOther('personOrAccountIdentifier', e.target.value || null)} placeholder="Not provided yet" />
        {!report.otherIncident.personOrAccountIdentifier && <span className="detail-field-helper">{FIELD_HELPERS.identifier}</span>}
      </label>))
    }
  } else {
    fields = [
      field('paymentMethod', !!report.incident.paymentMethod, <label>Payment method {isAssisted && report.incident.paymentMethod && <SourceTag />}
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
      </label>),
      field('date', !!report.incident.date, <label>Date {isAssisted && report.incident.date && <SourceTag />}
        <input value={report.incident.date ?? ''} onChange={e => updateIncident('date', e.target.value || null)} placeholder="Not provided yet" />
        {!report.incident.date && <span className="detail-field-helper">{FIELD_HELPERS.date}</span>}
      </label>),
      field('approximateTime', !!report.incident.approximateTime, <label>Approximate time {isAssisted && report.incident.approximateTime && <SourceTag />}
        <input value={report.incident.approximateTime ?? ''} onChange={e => updateIncident('approximateTime', e.target.value || null)} placeholder="Not provided yet" />
        {!report.incident.approximateTime && <span className="detail-field-helper">{FIELD_HELPERS.approximateTime}</span>}
      </label>),
      field('contactMethod', !!report.incident.contactMethod, <label>How were you contacted? {isAssisted && report.incident.contactMethod && <SourceTag />}
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
      </label>),
    ]
  }

  const isFinancial = category === 'financial-fraud'
  const financialErrors = isFinancial ? financialRequiredErrors(report) : []
  const descriptionOk = descriptionMeetsMinimum(report.incident.description)
  const canContinue = descriptionOk && financialErrors.length === 0

  const found = fields.filter(f => f.hasValue)
  const stillNeeded = fields.filter(f => !f.hasValue)

  const heading = category === 'financial-fraud'
    ? (isAssisted ? 'Here’s what we understood' : 'Check your details')
    : (isAssisted ? 'Review what we understood' : 'Review your details')

  const backTo = () => {
    if (category === 'financial-fraud') { navigate(isAssisted ? '/report/assisted' : '/report/manual'); return }
    navigate(isAssisted ? assistedReviewPath(category) : manualPath(category))
  }

  return <main className="report-page">
    <ProgressSteps current="Details" />
    <div className="report-intro">
      <h1>{heading}</h1>
      <p className="lead">Check each field and make changes if anything looks wrong. Optional fields can be left blank.</p>
    </div>
    <form className="review-form" onSubmit={event => event.preventDefault()}>
      <div className="field-grid">
        <label>{typeLabel}
          <input value={typeValue} disabled />
        </label>
      </div>

      {isFinancial && <section className="required-block">
        <h2>Required for this complaint</h2>
        <p className="helper">The National Cyber Crime Reporting Portal requires these details for a financial-fraud complaint.</p>
        <div className="field-grid">
          <label>Bank / wallet / merchant name <span className="required-badge">Required</span>
            <input value={report.transaction.merchantName ?? ''} onChange={e => updateTransaction('merchantName', e.target.value)} placeholder="e.g. HDFC Bank, Paytm" />
            {!report.transaction.merchantName && <span className="detail-field-helper field-error">This is required for a financial-fraud complaint.</span>}
          </label>
          <label>Transaction ID / UTR <span className="required-badge">Required</span>
            <input value={report.transaction.transactionId ?? ''} onChange={e => updateTransaction('transactionId', e.target.value)} placeholder="12-digit UTR" />
            {(!report.transaction.transactionId || !/^\d{12}$/.test(report.transaction.transactionId)) && <span className="detail-field-helper field-error">Must be exactly 12 digits.</span>}
          </label>
          <label>Transaction date <span className="required-badge">Required</span>
            <input value={report.transaction.transactionDate ?? ''} onChange={e => updateTransaction('transactionDate', e.target.value)} placeholder="e.g. 24 August 2026" />
            {!report.transaction.transactionDate && <span className="detail-field-helper field-error">This is required for a financial-fraud complaint.</span>}
          </label>
          <label>Fraud amount (₹) <span className="required-badge">Required</span>
            <input inputMode="numeric" type="number" value={report.incident.amount ?? ''} onChange={e => updateIncident('amount', e.target.value ? Number(e.target.value) : null)} placeholder="0" />
            {(report.incident.amount == null || report.incident.amount <= 0) && <span className="detail-field-helper field-error">This is required for a financial-fraud complaint.</span>}
          </label>
        </div>
      </section>}

      {found.length > 0 && <section className="found-block">
        <h2>{isAssisted ? 'Found from your description' : 'You’ve provided'}</h2>
        <div className="field-grid">{found.map(f => <div key={f.key} className="detail-field found">{f.node}</div>)}</div>
      </section>}

      {stillNeeded.length > 0 && <section className="still-needed-block">
        <h2>Still needed</h2>
        <div className="field-grid">{stillNeeded.map(f => <div key={f.key} className="detail-field missing">{f.node}</div>)}</div>
      </section>}

      {category === 'financial-fraud' && <label className="checkbox-field standalone">
        <input
          type="checkbox"
          checked={report.incident.impersonation === true}
          onChange={e => updateIncident('impersonation', e.target.checked)}
        />
        The person or message claimed to represent a bank, company or government office
      </label>}

      <DescriptionField
        value={report.incident.description}
        onChange={value => updateIncident('description', value)}
        generated={isAssisted}
      />
    </form>

    {(!descriptionOk || financialErrors.length > 0) && <p className="field-error">
      {!descriptionOk ? 'Add more detail to the description before continuing. ' : ''}
      {financialErrors.length > 0 ? 'Complete the required financial-fraud fields above before continuing.' : ''}
    </p>}

    <StepActionBar
      onBack={backTo}
      primaryLabel="Continue to evidence"
      onPrimary={() => navigate(evidencePath(category))}
      primaryDisabled={!canContinue}
    />
  </main>
}
