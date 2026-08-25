import { ReactNode, useEffect } from 'react'
import { useRouter } from './router'
import { ReportIncident, useReport } from './reportState'
import { ProgressSteps, StepActionBar } from './report'

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
}

export function ReportDetails() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()

  useEffect(() => {
    if (!report.entryMode) navigate('/report/start')
  }, [report.entryMode, navigate])

  if (!report.entryMode) return null

  const isAssisted = report.entryMode === 'assisted'

  const updateIncident = <K extends keyof ReportIncident>(key: K, value: ReportIncident[K]) =>
    setReport(current => ({ ...current, incident: { ...current.incident, [key]: value } }))

  const updateTransactionId = (value: string) =>
    setReport(current => ({ ...current, transaction: { transactionId: value || null } }))

  const field = (key: string, hasValue: boolean, node: ReactNode) => ({ key, hasValue, node })

  const fields = [
    field('amount', report.incident.amount != null, <label>Amount involved (₹) {isAssisted && report.incident.amount != null && <SourceTag />}
      <input inputMode="numeric" type="number" value={report.incident.amount ?? ''} onChange={e => updateIncident('amount', e.target.value ? Number(e.target.value) : null)} placeholder="Not provided yet" />
      {report.incident.amount == null && <span className="detail-field-helper">{FIELD_HELPERS.amount}</span>}
    </label>),
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
    field('transactionId', !!report.transaction.transactionId, <label>Transaction ID {isAssisted && report.transaction.transactionId && <SourceTag />}
      <input value={report.transaction.transactionId ?? ''} onChange={e => updateTransactionId(e.target.value)} placeholder="Not provided yet" />
      {!report.transaction.transactionId && <span className="detail-field-helper">{FIELD_HELPERS.transactionId}</span>}
    </label>),
  ]

  const found = fields.filter(f => f.hasValue)
  const stillNeeded = fields.filter(f => !f.hasValue)

  return <main className="report-page">
    <ProgressSteps current="Details" />
    <div className="report-intro">
      <h1>{isAssisted ? 'Here’s what we understood' : 'Check your details'}</h1>
      <p className="lead">Check each field and make changes if anything looks wrong. Optional fields can be left blank.</p>
    </div>
    <form className="review-form" onSubmit={event => event.preventDefault()}>
      <div className="field-grid">
        <label>Incident type
          <input value={report.incident.type ?? 'Financial fraud'} disabled />
        </label>
      </div>

      {found.length > 0 && <section className="found-block">
        <h2>{isAssisted ? 'Found from your description' : 'You’ve provided'}</h2>
        <div className="field-grid">{found.map(f => <div key={f.key} className="detail-field found">{f.node}</div>)}</div>
      </section>}

      {stillNeeded.length > 0 && <section className="still-needed-block">
        <h2>Still needed</h2>
        <div className="field-grid">{stillNeeded.map(f => <div key={f.key} className="detail-field missing">{f.node}</div>)}</div>
      </section>}

      <label className="checkbox-field standalone">
        <input
          type="checkbox"
          checked={report.incident.impersonation === true}
          onChange={e => updateIncident('impersonation', e.target.checked)}
        />
        The person or message claimed to represent a bank, company or government office
      </label>

      <label className="description-field">Description
        <textarea value={report.incident.description} onChange={e => updateIncident('description', e.target.value)} placeholder="Not provided yet" />
      </label>
    </form>
    <StepActionBar
      onBack={() => navigate(isAssisted ? '/report/assisted' : '/report/manual')}
      primaryLabel="Continue to evidence"
      onPrimary={() => navigate('/report/evidence')}
    />
  </main>
}
