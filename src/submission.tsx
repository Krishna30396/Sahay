import { Link, useRouter } from './router'
import { useReport } from './reportState'

const DEMO_REPORT_ID = 'SAHAY-DEMO-48291'

export function ReportSubmission() {
  const { setReport } = useReport()
  const { navigate } = useRouter()

  const viewStatus = () => {
    setReport(current => ({ ...current, status: { ...current.status, stage: 'submitted', lastUpdated: new Date().toISOString() } }))
    navigate('/report/status')
  }

  return <main className="report-page">
    <div className="report-intro">
      <h1>Report prepared successfully</h1>
      <p className="reassurance">Demo submission. This prototype does not submit complaints to a government system.</p>
    </div>

    <section className="review-summary">
      <p className="review-description">Reference</p>
      <p className="report-id">{DEMO_REPORT_ID}</p>
    </section>

    <button type="button" className="button primary" onClick={viewStatus}>View status <span aria-hidden="true">→</span></button>

    <p className="helper">This is a plain-language demo status. It does not mean any authority has received this report.</p>

    <Link className="button secondary" to="/">Return to homepage</Link>
  </main>
}
