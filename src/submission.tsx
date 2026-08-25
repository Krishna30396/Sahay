import { useState } from 'react'
import { Link } from './router'

const DEMO_REPORT_ID = 'NCRP-DEMO-48291'

export function ReportSubmission() {
  const [showStatus, setShowStatus] = useState(false)

  return <main className="report-page">
    <div className="report-intro">
      <h1>Your report is ready</h1>
      <p className="lead">Demo report submitted.</p>
      <p className="reassurance">Demo only — no complaint was sent to a government system.</p>
    </div>

    <section className="review-summary">
      <p className="review-description">Report ID</p>
      <p className="report-id">{DEMO_REPORT_ID}</p>
    </section>

    {!showStatus
      ? <button type="button" className="button primary" onClick={() => setShowStatus(true)}>View report status <span aria-hidden="true">→</span></button>
      : <div className="timeline">
          <div className="done"><b>Report prepared</b></div>
          <div className="done"><b>Report submitted</b><span>Just now (demo)</span></div>
          <div className="current"><b>Under review</b><span>Your demo report is awaiting review.</span></div>
          <div><b>Forwarded to relevant authority</b></div>
          <div><b>Further action</b></div>
        </div>}

    <p className="helper">This is a plain-language demo status. It does not mean money will be recovered or that any authority has received this report.</p>

    <Link className="button secondary" to="/">Return to homepage</Link>
  </main>
}
