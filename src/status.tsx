import { Link } from './router'
import { useReport } from './reportState'

export function ReportStatus() {
  const { report } = useReport()
  const viaDigiLocker = report.complainant.identityMethod === 'digilocker'
  return <main className="report-page">
    <div className="report-intro">
      <h1>Your report has been prepared</h1>
    </div>
    <div className="timeline">
      <div className="done"><b>Information collected</b></div>
      <div className="done"><b>Identity details provided</b></div>
      <div className="done"><b>Report prepared</b></div>
      <div className="current"><b>Ready for official reporting</b></div>
    </div>
    {viaDigiLocker && <p className="helper">Identity document provided through DigiLocker — prototype flow.</p>}
    <p className="helper">Sahay is a prototype that helps organize your information. No government complaint has been submitted from this demo, and no real DigiLocker or government data was accessed in this demonstration.</p>
    <Link className="button secondary" to="/">Return to homepage</Link>
  </main>
}
