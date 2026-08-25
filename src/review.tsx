import { useState } from 'react'
import { useRouter } from './router'
import { missingInformationLabel, useReport } from './reportState'
import { ProgressSteps, StepActionBar } from './report'

function summarizeEvidence(count: number) {
  if (count === 0) return 'No evidence added.'
  return `${count} item${count === 1 ? '' : 's'} added.`
}

export function ReportReview() {
  const { navigate } = useRouter()
  const { report } = useReport()
  const [submitted, setSubmitted] = useState(false)

  const rows: { label: string; value: string }[] = [
    { label: 'Incident type', value: report.incident.type ?? 'Financial fraud' },
    { label: 'Amount involved', value: report.incident.amount != null ? `₹${report.incident.amount.toLocaleString('en-IN')}` : 'Not provided yet' },
    { label: 'Payment method', value: report.incident.paymentMethod ?? 'Not provided yet' },
    { label: 'Date', value: report.incident.date ?? 'Not provided yet' },
    { label: 'Approximate time', value: report.incident.approximateTime ?? 'Not provided yet' },
    { label: 'How you were contacted', value: report.incident.contactMethod ?? 'Not provided yet' },
    { label: 'Impersonation suspected', value: report.incident.impersonation === true ? 'Yes' : report.incident.impersonation === false ? 'No' : 'Not provided yet' },
    { label: 'Transaction ID', value: report.transaction.transactionId ?? 'Not provided yet' },
  ]

  return <main className="report-page">
    <ProgressSteps current="Review" />
    <div className="report-intro">
      <h1>Review your report</h1>
      <p className="lead">Check everything below before continuing. You can edit any section.</p>
    </div>

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>What happened</h2>
        <button type="button" className="link-button" onClick={() => navigate('/report/details')}>Edit</button>
      </div>
      <p className="review-description">{report.incident.description || 'Not provided yet'}</p>
    </section>

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>Incident details</h2>
        <button type="button" className="link-button" onClick={() => navigate('/report/details')}>Edit</button>
      </div>
      <dl className="review-fields">
        {rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
      </dl>
    </section>

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>Evidence</h2>
        <button type="button" className="link-button" onClick={() => navigate('/report/evidence')}>Edit</button>
      </div>
      <p className="review-description">{summarizeEvidence(report.evidence.length)}</p>
      {report.evidence.length > 0 && <ul className="review-evidence-list">
        {report.evidence.map(item => <li key={item.id}>{item.fileName ?? item.description ?? 'Evidence item'}</li>)}
      </ul>}
    </section>

    {report.missingInformation.length > 0 && <section className="needed">
      <h2>Missing information</h2>
      <p className="helper">You can still continue.</p>
      <ul className="missing-list">{report.missingInformation.map(key => <li key={key}>{missingInformationLabel(key)}</li>)}</ul>
    </section>}

    {submitted && <p className="confirmation">Report ready for submission. This prototype doesn’t send your report anywhere — no real complaint is filed.</p>}

    <StepActionBar
      onBack={() => navigate('/report/evidence')}
      primaryLabel="Continue to submission"
      onPrimary={() => setSubmitted(true)}
      primaryDisabled={submitted}
    />
  </main>
}
