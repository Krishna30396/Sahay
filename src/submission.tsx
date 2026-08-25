import { useState } from 'react'
import { Link, useRouter } from './router'
import { ReportCategory, useReport } from './reportState'
import { statusPath } from './reportRoutes'

const DEMO_IDS: Record<ReportCategory, string> = {
  'financial-fraud': 'NCRP-DEMO-48291',
  'account-identity': 'SAHAY-DEMO-ACCOUNT-48291',
  'other-cyber': 'SAHAY-DEMO-OTHER-48291',
}

const COPY: Record<ReportCategory, { lead: string; note: string }> = {
  'financial-fraud': { lead: 'Demo report submitted.', note: 'Demo only — no complaint was sent to a government system.' },
  'account-identity': { lead: 'Demo submission.', note: 'This prototype does not send your information to a government system.' },
  'other-cyber': { lead: 'Demo submission.', note: 'This prototype does not send your information to a government system.' },
}

export function ReportSubmission() {
  const { report, setReport } = useReport()
  const { navigate } = useRouter()
  const [showStatus, setShowStatus] = useState(false)
  const category = report.category ?? 'financial-fraud'
  const isFinancial = category === 'financial-fraud'
  const copy = COPY[category]

  const viewStatus = () => {
    setReport(current => ({ ...current, status: { ...current.status, stage: 'submitted', lastUpdated: new Date().toISOString() } }))
    if (isFinancial) setShowStatus(true)
    else navigate(statusPath(category))
  }

  return <main className="report-page">
    <div className="report-intro">
      <h1>Your report is ready</h1>
      <p className="lead">{copy.lead}</p>
      <p className="reassurance">{copy.note}</p>
    </div>

    <section className="review-summary">
      <p className="review-description">Report ID</p>
      <p className="report-id">{DEMO_IDS[category]}</p>
    </section>

    {isFinancial && showStatus
      ? <div className="timeline">
          <div className="done"><b>Report prepared</b></div>
          <div className="done"><b>Report submitted</b><span>Just now (demo)</span></div>
          <div className="current"><b>Under review</b><span>Your demo report is awaiting review.</span></div>
          <div><b>Forwarded to relevant authority</b></div>
          <div><b>Further action</b></div>
        </div>
      : <button type="button" className="button primary" onClick={viewStatus}>View report status <span aria-hidden="true">→</span></button>}

    <p className="helper">This is a plain-language demo status. It does not mean money will be recovered, content removed or that any authority has received this report.</p>

    <Link className="button secondary" to="/">Return to homepage</Link>
  </main>
}
