import { useState } from 'react'
import { Link, useRouter } from './router'
import { ReportIncident, missingInformationLabel, useReport } from './reportState'

const Arrow = () => <span aria-hidden="true">→</span>

const STEPS = ['Start', 'Details', 'Evidence', 'Review'] as const
type Step = typeof STEPS[number]

export function ProgressSteps({ current }: { current: Step }) {
  const currentIndex = STEPS.indexOf(current)
  return <ol className="progress-steps" aria-label="Report progress">
    {STEPS.map((step, index) => {
      const status = index === currentIndex ? 'current' : index < currentIndex ? 'done' : 'upcoming'
      return <li key={step} className={status} aria-current={status === 'current' ? 'step' : undefined}>
        <span className="step-index" aria-hidden="true">{status === 'done' ? '✓' : index + 1}</span>
        <span className="step-label">{step}</span>
      </li>
    })}
  </ol>
}

export function StepActionBar({ onBack, backLabel = '← Back', primaryLabel, onPrimary, primaryDisabled }: {
  onBack: () => void
  backLabel?: string
  primaryLabel?: string
  onPrimary?: () => void
  primaryDisabled?: boolean
}) {
  return <div className="step-action-bar">
    <button type="button" className="button secondary" onClick={onBack}>{backLabel}</button>
    {primaryLabel && <button type="button" className="button primary" onClick={onPrimary} disabled={primaryDisabled}>{primaryLabel} <Arrow /></button>}
  </div>
}

export function MissingInfoNote({ missing, onAddDetails }: { missing: string[]; onAddDetails: () => void }) {
  if (missing.length === 0) return null
  return <section className="missing-note">
    <p className="missing-note-title">You can still continue</p>
    <p className="missing-note-sub">{missing.length} optional detail{missing.length === 1 ? '' : 's'} haven’t been provided</p>
    <ul className="missing-note-list">{missing.map(key => <li key={key}>{missingInformationLabel(key)}</li>)}</ul>
    <button type="button" className="link-button" onClick={onAddDetails}>Add details</button>
  </section>
}

function SafetyNote() {
  return <p className="safety-note">If the payment happened just now, call <a href="tel:1930">1930</a> and your bank/payment provider immediately.</p>
}

export function ReportStart() {
  const { navigate } = useRouter()
  const { setReport } = useReport()
  const [selected, setSelected] = useState<'assisted' | 'manual' | null>(null)

  const goNext = () => {
    if (!selected) return
    setReport(current => ({ ...current, entryMode: selected }))
    navigate(selected === 'assisted' ? '/report/assisted' : '/report/manual')
  }

  return <main className="report-page">
    <ProgressSteps current="Start" />
    <div className="report-intro">
      <h1>Let’s prepare your report</h1>
      <p className="lead">You can describe what happened in your own words, or enter the details yourself.</p>
      <p className="reassurance">You will review everything before anything is submitted.</p>
    </div>
    <div className="option-grid" role="radiogroup" aria-label="How would you like to provide details?">
      <label className={`option-card recommended${selected === 'assisted' ? ' selected' : ''}`}>
        <input className="option-card-radio" type="radio" name="entry-mode" value="assisted" checked={selected === 'assisted'} onChange={() => setSelected('assisted')} />
        <span className="badge">Recommended</span>
        <h2>Describe what happened</h2>
        <p>Tell us what happened in your own words. We’ll organize the information into the details needed for your report.</p>
        <p className="option-support">You review every detail before continuing.</p>
      </label>
      <label className={`option-card${selected === 'manual' ? ' selected' : ''}`}>
        <input className="option-card-radio" type="radio" name="entry-mode" value="manual" checked={selected === 'manual'} onChange={() => setSelected('manual')} />
        <h2>Enter the details yourself</h2>
        <p>Fill in the information step by step.</p>
        <p className="option-support">You’ll have full control over every field.</p>
      </label>
    </div>
    <section className="needed">
      <h2>What you’ll need</h2>
      <ul className="needed-list">
        <li>Approximate date and time</li>
        <li>Amount involved</li>
        <li>Payment method</li>
        <li>Transaction/reference details, if available</li>
        <li>Screenshots, messages or other evidence</li>
      </ul>
      <p className="helper">Don’t have everything? That’s okay. You can continue and add missing information later.</p>
    </section>
    <SafetyNote />
    <StepActionBar
      onBack={() => navigate('/')}
      primaryLabel="Continue to details"
      onPrimary={goNext}
      primaryDisabled={!selected}
    />
  </main>
}

const PAYMENT_KEYWORDS: [RegExp, string][] = [
  [/\bupi\b/i, 'UPI'],
  [/net ?banking/i, 'Net banking'],
  [/credit card|debit card|\bcard\b/i, 'Card'],
  [/bank transfer|neft|rtgs|imps/i, 'Bank transfer'],
  [/wallet/i, 'Wallet'],
]

const CONTACT_KEYWORDS: [RegExp, string][] = [
  [/whatsapp/i, 'WhatsApp'],
  [/\bcall(ed|er)?\b|\bphone\b/i, 'Phone call'],
  [/\bsms\b|text message/i, 'SMS'],
  [/\bemail\b/i, 'Email'],
]

function extractAmount(text: string): number | null {
  const withSymbol = text.match(/(?:₹|rs\.?|inr)\s?([\d,]+(?:\.\d+)?)\s?(k|thousand|l|lakh|lakhs)?/i)
  const withUnit = !withSymbol?.[2] ? text.match(/\b(\d+(?:\.\d+)?)\s?(k|thousand|l|lakh|lakhs)\b/i) : null
  const match = withSymbol ?? withUnit
  if (match) {
    let value = Number(match[1].replace(/,/g, ''))
    const unit = match[2]?.toLowerCase()
    if (unit === 'k' || unit === 'thousand') value *= 1000
    else if (unit === 'l' || unit === 'lakh' || unit === 'lakhs') value *= 100000
    return value
  }
  const bare = text.match(/\b(\d{3,7})\b/)
  return bare ? Number(bare[1]) : null
}

function formatDemoDate(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function extractDate(text: string): string | null {
  const explicit = text.match(/\bon\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+)\b/i)
  if (explicit) return explicit[1]
  if (/\b(yesterday|last night)\b/i.test(text)) return formatDemoDate(-1)
  if (/\btoday\b/i.test(text)) return formatDemoDate(0)
  return null
}

function extractApproximateTime(text: string): string | null {
  const match = text.match(/\b(\d{1,2}(:\d{2})?\s?(am|pm)|morning|afternoon|evening|night)\b/i)
  return match ? match[0] : null
}

function extractTransactionId(text: string): string | null {
  const match = text.match(/(?:txn|transaction)\s*(?:id|no\.?|number)?\s*[:#]?\s*([A-Za-z0-9]{6,})/i)
  return match ? match[1] : null
}

function extractImpersonation(text: string): boolean | null {
  return /bank official|customer care|police|government official|claiming to be|impersonat/i.test(text) ? true : null
}

function mockExtractIncident(text: string): { incident: Partial<ReportIncident>; transactionId: string | null } {
  return {
    incident: {
      type: 'Financial fraud',
      amount: extractAmount(text),
      currency: 'INR',
      paymentMethod: PAYMENT_KEYWORDS.find(([pattern]) => pattern.test(text))?.[1] ?? null,
      date: extractDate(text),
      approximateTime: extractApproximateTime(text),
      contactMethod: CONTACT_KEYWORDS.find(([pattern]) => pattern.test(text))?.[1] ?? null,
      impersonation: extractImpersonation(text),
      description: text,
    },
    transactionId: extractTransactionId(text),
  }
}

export function ReportAssisted() {
  const { navigate } = useRouter()
  const { setReport } = useReport()
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)
  const canContinue = text.trim().length > 0

  const submit = () => {
    if (!canContinue || processing) return
    setProcessing(true)
    setTimeout(() => {
      const extracted = mockExtractIncident(text)
      setReport(current => ({
        ...current,
        entryMode: 'assisted',
        incident: { ...current.incident, ...extracted.incident },
        transaction: { transactionId: extracted.transactionId },
      }))
      navigate('/report/details')
    }, 700)
  }

  return <main className="report-page">
    <ProgressSteps current="Details" />
    <div className="report-intro">
      <h1>Tell us what happened</h1>
      <p className="lead">Describe the incident in your own words — what happened, roughly when, how much was involved and how you were contacted, if you remember.</p>
    </div>
    <form className="assisted-form" onSubmit={event => { event.preventDefault(); submit() }}>
      <label htmlFor="incident-text">What happened?</label>
      <textarea
        id="incident-text"
        value={text}
        onChange={event => setText(event.target.value)}
        placeholder="For example: I lost 50k from UPI yesterday after a call from someone claiming to be my bank."
      />
      <p className="helper">This is a prototype. We will never ask for real OTPs, passwords or account numbers — just describe what happened.</p>
      {processing && <p className="helper processing-note">Organizing your details…</p>}
    </form>
    <StepActionBar
      onBack={() => navigate('/report/start')}
      primaryLabel={processing ? 'Organizing your details…' : 'Continue to details'}
      onPrimary={submit}
      primaryDisabled={!canContinue || processing}
    />
  </main>
}

interface ManualDraft {
  amount: string
  paymentMethod: string
  date: string
  approximateTime: string
  contactMethod: string
  impersonation: boolean
  description: string
  transactionId: string
}

export function ReportManualEntry() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()
  const [draft, setDraft] = useState<ManualDraft>(() => ({
    amount: report.incident.amount != null ? String(report.incident.amount) : '',
    paymentMethod: report.incident.paymentMethod ?? '',
    date: report.incident.date ?? '',
    approximateTime: report.incident.approximateTime ?? '',
    contactMethod: report.incident.contactMethod ?? '',
    impersonation: report.incident.impersonation === true,
    description: report.incident.description,
    transactionId: report.transaction.transactionId ?? '',
  }))

  const update = <K extends keyof ManualDraft>(key: K, value: ManualDraft[K]) => setDraft(current => ({ ...current, [key]: value }))

  const submit = () => {
    setReport(current => ({
      ...current,
      entryMode: 'manual',
      incident: {
        ...current.incident,
        type: 'Financial fraud',
        amount: draft.amount ? Number(draft.amount) : null,
        paymentMethod: draft.paymentMethod || null,
        date: draft.date || null,
        approximateTime: draft.approximateTime || null,
        contactMethod: draft.contactMethod || null,
        impersonation: draft.impersonation,
        description: draft.description,
      },
      transaction: { transactionId: draft.transactionId || null },
    }))
    navigate('/report/details')
  }

  return <main className="report-page">
    <ProgressSteps current="Details" />
    <div className="report-intro">
      <h1>Enter the details yourself</h1>
      <p className="lead">Fill in what you know. You can leave anything blank and add it later.</p>
    </div>
    <form className="review-form" onSubmit={event => { event.preventDefault(); submit() }}>
      <div className="field-grid">
        <label>Amount involved (₹)
          <input inputMode="numeric" type="number" value={draft.amount} onChange={e => update('amount', e.target.value)} placeholder="Not provided yet" />
        </label>
        <label>Payment method
          <select value={draft.paymentMethod} onChange={e => update('paymentMethod', e.target.value)}>
            <option value="">Not provided yet</option>
            <option>UPI</option>
            <option>Bank transfer</option>
            <option>Card</option>
            <option>Net banking</option>
            <option>Wallet</option>
            <option>Other</option>
          </select>
        </label>
        <label>Date
          <input value={draft.date} onChange={e => update('date', e.target.value)} placeholder="e.g. yesterday, 20 August" />
        </label>
        <label>Approximate time
          <input value={draft.approximateTime} onChange={e => update('approximateTime', e.target.value)} placeholder="e.g. evening, around 6 pm" />
        </label>
        <label>How were you contacted?
          <select value={draft.contactMethod} onChange={e => update('contactMethod', e.target.value)}>
            <option value="">Not provided yet</option>
            <option>Phone call</option>
            <option>SMS</option>
            <option>WhatsApp</option>
            <option>Email</option>
            <option>In person</option>
            <option>Not applicable</option>
          </select>
        </label>
        <label>Transaction ID
          <input value={draft.transactionId} onChange={e => update('transactionId', e.target.value)} placeholder="Not provided yet" />
        </label>
        <label className="checkbox-field">
          <input type="checkbox" checked={draft.impersonation} onChange={e => update('impersonation', e.target.checked)} />
          The person or message claimed to represent a bank, company or government office
        </label>
      </div>
      <label className="description-field">Description
        <textarea value={draft.description} onChange={e => update('description', e.target.value)} placeholder="Optional — add any extra detail" />
      </label>
    </form>
    <StepActionBar
      onBack={() => navigate('/report/start')}
      primaryLabel="Continue to details"
      onPrimary={submit}
    />
  </main>
}

export function NotFound() {
  return <main className="report-page">
    <div className="report-intro">
      <h1>Page not found</h1>
      <p className="lead">Let’s get you back on track.</p>
    </div>
    <Link className="button primary" to="/">Go to homepage <Arrow /></Link>
  </main>
}
