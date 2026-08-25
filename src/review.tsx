import { useRouter } from './router'
import { useReport } from './reportState'
import { MissingInfoNote, ProgressSteps, StepActionBar } from './report'

function formatAmount(amount: number | null) {
  return amount != null ? `₹${amount.toLocaleString('en-IN')}` : 'Not provided yet'
}

export function ReportReview() {
  const { navigate } = useRouter()
  const { report } = useReport()
  const editDetails = () => navigate('/report/details')

  return <main className="report-page">
    <ProgressSteps current="Review" />
    <div className="report-intro">
      <h1>Review your report</h1>
      <p className="lead">Check the information below before continuing.</p>
    </div>

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>What happened</h2>
        <button type="button" className="link-button" onClick={editDetails}>Edit</button>
      </div>
      <dl className="review-fields">
        <div><dt>Incident type</dt><dd>{report.incident.type ?? 'Financial fraud'}</dd></div>
      </dl>
      <p className="review-description">{report.incident.description || 'Not provided yet'}</p>
    </section>

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>Payment</h2>
        <button type="button" className="link-button" onClick={editDetails}>Edit</button>
      </div>
      <dl className="review-fields">
        <div><dt>Amount</dt><dd>{formatAmount(report.incident.amount)}</dd></div>
        <div><dt>Payment method</dt><dd>{report.incident.paymentMethod ?? 'Not provided yet'}</dd></div>
        <div><dt>Date</dt><dd>{report.incident.date ?? 'Not provided yet'}</dd></div>
        <div><dt>Approximate time</dt><dd>{report.incident.approximateTime ?? 'Not provided yet'}</dd></div>
      </dl>
    </section>

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>Contact</h2>
        <button type="button" className="link-button" onClick={editDetails}>Edit</button>
      </div>
      <dl className="review-fields">
        <div><dt>How you were contacted</dt><dd>{report.incident.contactMethod ?? 'Not provided yet'}</dd></div>
        <div><dt>Impersonation suspected</dt><dd>{report.incident.impersonation === true ? 'Yes' : report.incident.impersonation === false ? 'No' : 'Not provided yet'}</dd></div>
      </dl>
    </section>

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>Transaction</h2>
        <button type="button" className="link-button" onClick={editDetails}>Edit</button>
      </div>
      <dl className="review-fields">
        <div><dt>Transaction ID</dt><dd>{report.transaction.transactionId ?? 'Not provided yet'}</dd></div>
      </dl>
    </section>

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>Evidence</h2>
        <button type="button" className="link-button" onClick={() => navigate('/report/evidence')}>Edit</button>
      </div>
      <p className="review-description">{report.evidence.length === 0 ? 'No evidence added.' : `${report.evidence.length} item${report.evidence.length === 1 ? '' : 's'} added.`}</p>
      {report.evidence.length > 0 && <ul className="review-evidence-list">
        {report.evidence.map(item => <li key={item.id}>{item.fileName ?? item.description ?? 'Evidence item'}</li>)}
      </ul>}
    </section>

    <MissingInfoNote missing={report.missingInformation} onAddDetails={editDetails} />

    <StepActionBar
      onBack={() => navigate('/report/evidence')}
      primaryLabel="Continue to submission"
      onPrimary={() => navigate('/report/submission')}
    />
  </main>
}
