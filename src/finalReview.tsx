import { useRouter } from './router'
import { useReport } from './reportState'
import { ProgressSteps, StepActionBar } from './report'
import { detailsPath, evidencePath } from './reportRoutes'

function formatAmount(amount: number | null) {
  return amount != null ? `₹${amount.toLocaleString('en-IN')}` : 'Not provided yet'
}

const ID_DOCUMENT_LABELS: Record<string, string> = {
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  'driving-license': 'Driving Licence',
  'voter-id': 'Voter ID',
  passport: 'Passport',
}

export function FinalReview() {
  const { navigate } = useRouter()
  const { report } = useReport()
  const category = report.category ?? 'financial-fraud'

  const issueLabel = category === 'account-identity'
    ? (report.accountIdentity.affectedType ?? 'Not provided yet')
    : category === 'other-cyber'
      ? (report.otherIncident.issueType ?? 'Not provided yet')
      : (report.incident.type ?? 'Financial fraud')

  const allSuspectRows: [string, string | null][] = [
    ['Mobile number', report.suspect.mobile],
    ['Email', report.suspect.email],
    ['Bank account', report.suspect.bankAccount],
    ['Address', report.suspect.address],
    ['Photograph', report.suspect.photograph],
    ['Other identifying document', report.suspect.otherDocument],
    ['Website / social media handle', report.suspect.websiteOrHandle],
  ]
  const suspectRows = allSuspectRows.filter(([, value]) => !!value)

  const submit = () => navigate('/report/submission')

  return <main className="report-page">
    <ProgressSteps current="Submit" />
    <div className="report-intro">
      <h1>Final review</h1>
      <p className="lead">This is everything that will be included in your report. Check it carefully before you submit.</p>
    </div>

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>Complainant</h2>
        <button type="button" className="link-button" onClick={() => navigate('/report/identity')}>Edit</button>
      </div>
      <dl className="review-fields">
        <div><dt>Name</dt><dd>{report.complainant.name ?? 'Not provided yet'}</dd></div>
        <div><dt>Mobile</dt><dd>{report.complainant.mobile ?? 'Not provided yet'}{report.complainant.mobileVerified ? ' — Verified' : ''}</dd></div>
        <div><dt>State</dt><dd>{report.complainant.state ?? 'Not provided yet'}</dd></div>
      </dl>
    </section>

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>Identity</h2>
        <button type="button" className="link-button" onClick={() => navigate('/report/identity')}>Edit</button>
      </div>
      <dl className="review-fields">
        <div><dt>Method</dt><dd>{report.complainant.identityMethod === 'digilocker' ? 'DigiLocker' : report.complainant.identityMethod === 'manual-upload' ? 'Uploaded document' : 'Not provided yet'}</dd></div>
        <div><dt>Document</dt><dd>{report.complainant.identityDocument.uploaded ? (ID_DOCUMENT_LABELS[report.complainant.identityDocument.type ?? ''] ?? 'Document') : 'Not added'}</dd></div>
        {report.complainant.identityDocument.issuer && <div><dt>Issuer</dt><dd>{report.complainant.identityDocument.issuer}</dd></div>}
        <div><dt>Status</dt><dd>{report.complainant.identityDocument.status === 'demo-verified' ? 'Demo verified' : 'Not provided yet'}</dd></div>
      </dl>
    </section>

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>Incident</h2>
        <button type="button" className="link-button" onClick={() => navigate(detailsPath(category))}>Edit</button>
      </div>
      <dl className="review-fields">
        <div><dt>Date / time</dt><dd>{report.incident.date ?? 'Not provided yet'}{report.incident.approximateTime ? `, ${report.incident.approximateTime}` : ''}</dd></div>
        <div><dt>Category</dt><dd>{issueLabel}</dd></div>
      </dl>
      <p className="review-description">{report.incident.description || 'Not provided yet'}</p>
    </section>

    {category === 'financial-fraud' && <section className="review-summary">
      <div className="review-summary-head">
        <h2>Financial details</h2>
        <button type="button" className="link-button" onClick={() => navigate(detailsPath(category))}>Edit</button>
      </div>
      <dl className="review-fields">
        <div><dt>Bank / wallet / merchant</dt><dd>{report.transaction.merchantName ?? 'Not provided yet'}</dd></div>
        <div><dt>Transaction ID / UTR</dt><dd>{report.transaction.transactionId ?? 'Not provided yet'}</dd></div>
        <div><dt>Transaction date</dt><dd>{report.transaction.transactionDate ?? 'Not provided yet'}</dd></div>
        <div><dt>Fraud amount</dt><dd>{formatAmount(report.incident.amount)}</dd></div>
      </dl>
    </section>}

    <section className="review-summary">
      <div className="review-summary-head">
        <h2>Evidence</h2>
        <button type="button" className="link-button" onClick={() => navigate(evidencePath(category))}>Edit</button>
      </div>
      <p className="review-description">{report.evidence.length === 0 ? 'No evidence added.' : `${report.evidence.length} item${report.evidence.length === 1 ? '' : 's'} added.`}</p>
      {report.evidence.length > 0 && <ul className="review-evidence-list">
        {report.evidence.map(item => <li key={item.id}>{item.fileName ?? item.description ?? 'Evidence item'}</li>)}
      </ul>}
    </section>

    {suspectRows.length > 0 && <section className="review-summary">
      <div className="review-summary-head">
        <h2>Optional suspect information</h2>
        <button type="button" className="link-button" onClick={() => navigate(evidencePath(category))}>Edit</button>
      </div>
      <dl className="review-fields">
        {suspectRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </section>}

    <StepActionBar
      onBack={() => navigate('/report/identity')}
      primaryLabel="Submit report"
      onPrimary={submit}
    />
  </main>
}
