import { useEffect } from 'react'
import { useRouter } from './router'
import { ReportIncident, missingInformationLabel, useReport } from './reportState'
import { ProgressSteps, StepActionBar } from './report'

function SourceTag() {
  return <span className="source-tag">From your description</span>
}

export function ReportDetails() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()

  useEffect(() => {
    if (!report.entryMode) navigate('/report/start')
  }, [report.entryMode, navigate])

  if (!report.entryMode) return null

  const isAssisted = report.entryMode === 'assisted'
  const fromDescription = (value: string | number | null) => isAssisted && value !== null && value !== ''

  const updateIncident = <K extends keyof ReportIncident>(key: K, value: ReportIncident[K]) =>
    setReport(current => ({ ...current, incident: { ...current.incident, [key]: value } }))

  const updateTransactionId = (value: string) =>
    setReport(current => ({ ...current, transaction: { transactionId: value || null } }))

  return <main className="report-page">
    <ProgressSteps current="Details" />
    <div className="report-intro">
      <h1>{isAssisted ? 'Review what we understood' : 'Review your details'}</h1>
      <p className="lead">Check each field and make changes if anything looks wrong. Optional fields can be left blank.</p>
    </div>
    <form className="review-form" onSubmit={event => event.preventDefault()}>
      <div className="field-grid">
        <label>Incident type
          <input value={report.incident.type ?? 'Financial fraud'} disabled />
        </label>
        <label>Amount involved (₹) {fromDescription(report.incident.amount) && <SourceTag />}
          <input
            inputMode="numeric"
            type="number"
            value={report.incident.amount ?? ''}
            onChange={e => updateIncident('amount', e.target.value ? Number(e.target.value) : null)}
            placeholder="Not provided yet"
          />
        </label>
        <label>Payment method {fromDescription(report.incident.paymentMethod) && <SourceTag />}
          <select value={report.incident.paymentMethod ?? ''} onChange={e => updateIncident('paymentMethod', e.target.value || null)}>
            <option value="">Not provided yet</option>
            <option>UPI</option>
            <option>Bank transfer</option>
            <option>Card</option>
            <option>Net banking</option>
            <option>Wallet</option>
            <option>Other</option>
          </select>
        </label>
        <label>Date {fromDescription(report.incident.date) && <SourceTag />}
          <input value={report.incident.date ?? ''} onChange={e => updateIncident('date', e.target.value || null)} placeholder="Not provided yet" />
        </label>
        <label>Approximate time {fromDescription(report.incident.approximateTime) && <SourceTag />}
          <input value={report.incident.approximateTime ?? ''} onChange={e => updateIncident('approximateTime', e.target.value || null)} placeholder="Not provided yet" />
        </label>
        <label>How were you contacted? {fromDescription(report.incident.contactMethod) && <SourceTag />}
          <select value={report.incident.contactMethod ?? ''} onChange={e => updateIncident('contactMethod', e.target.value || null)}>
            <option value="">Not provided yet</option>
            <option>Phone call</option>
            <option>SMS</option>
            <option>WhatsApp</option>
            <option>Email</option>
            <option>In person</option>
            <option>Not applicable</option>
          </select>
        </label>
        <label>Transaction ID {fromDescription(report.transaction.transactionId) && <SourceTag />}
          <input value={report.transaction.transactionId ?? ''} onChange={e => updateTransactionId(e.target.value)} placeholder="Not provided yet" />
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={report.incident.impersonation === true}
            onChange={e => updateIncident('impersonation', e.target.checked)}
          />
          The person or message claimed to represent a bank, company or government office
        </label>
      </div>
      <label className="description-field">Description
        <textarea value={report.incident.description} onChange={e => updateIncident('description', e.target.value)} placeholder="Not provided yet" />
      </label>
      {report.missingInformation.length > 0 && <p className="helper">
        You can still continue. We couldn’t detect: {report.missingInformation.map(missingInformationLabel).join(', ')}.
      </p>}
    </form>
    <StepActionBar
      onBack={() => navigate(isAssisted ? '/report/assisted' : '/report/start')}
      primaryLabel="Continue to evidence"
      onPrimary={() => navigate('/report/evidence')}
    />
  </main>
}
