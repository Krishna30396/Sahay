import { FormEvent, useEffect, useState } from 'react'
import { Link, useRouter } from './router'
import { IncidentData, useIncident } from './incident'

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

function SafetyNote() {
  return <p className="safety-note">If the payment happened just now, call <a href="tel:1930">1930</a> and your bank/payment provider immediately.</p>
}

export function ReportStart() {
  const { navigate } = useRouter()
  return <main className="report-page container">
    <ProgressSteps current="Start" />
    <div className="report-intro">
      <h1>Let’s prepare your report</h1>
      <p className="lead">You can describe what happened in your own words, or enter the details yourself.</p>
      <p className="reassurance">You will review everything before anything is submitted.</p>
    </div>
    <div className="option-grid">
      <article className="option-card recommended">
        <span className="badge">Recommended</span>
        <h2>Describe what happened</h2>
        <p>Tell us what happened in your own words. We’ll organize the information into the details needed for your report.</p>
        <p className="option-support">You review every detail before continuing.</p>
        <button className="button primary" onClick={() => navigate('/report/assisted')}>Continue with assisted entry <Arrow /></button>
      </article>
      <article className="option-card">
        <h2>Enter the details yourself</h2>
        <p>Fill in the information step by step.</p>
        <p className="option-support">You’ll have full control over every field.</p>
        <button className="button secondary" onClick={() => navigate('/report/manual')}>Continue with manual entry <Arrow /></button>
      </article>
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

const MISSING_LABELS: Record<string, string> = {
  amount: 'amount',
  paymentMethod: 'payment method',
  approximateTime: 'approximate time',
}

function mockExtractIncident(text: string): Partial<IncidentData> {
  const amountMatch = text.match(/(?:₹|rs\.?|inr)\s?([\d,]+)/i)
  const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : ''
  const paymentMethod = PAYMENT_KEYWORDS.find(([pattern]) => pattern.test(text))?.[1] ?? ''
  const contactMethod = CONTACT_KEYWORDS.find(([pattern]) => pattern.test(text))?.[1] ?? ''
  const suspectedImpersonation = /bank official|customer care|police|government official|claiming to be|impersonat/i.test(text)
  const timeMatch = text.match(/\b(\d{1,2}(:\d{2})?\s?(am|pm)|morning|afternoon|evening|night)\b/i)
  const approximateTime = timeMatch ? timeMatch[0] : ''

  const missingInformation: string[] = []
  if (!amount) missingInformation.push('amount')
  if (!paymentMethod) missingInformation.push('paymentMethod')
  if (!approximateTime) missingInformation.push('approximateTime')

  return { amount, paymentMethod, contactMethod, suspectedImpersonation, approximateTime, missingInformation }
}

export function ReportAssisted() {
  const { navigate } = useRouter()
  const { setIncident } = useIncident()
  const [text, setText] = useState('')
  const canContinue = text.trim().length > 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!canContinue) return
    setIncident(current => ({ ...current, ...mockExtractIncident(text), description: text }))
    navigate('/report/assisted/review')
  }

  return <main className="report-page container">
    <ProgressSteps current="Details" />
    <div className="report-intro">
      <h1>Tell us what happened</h1>
      <p className="lead">Describe the incident in your own words — what happened, roughly when, how much was involved and how you were contacted, if you remember.</p>
    </div>
    <form className="assisted-form" onSubmit={submit}>
      <label htmlFor="incident-text">What happened?</label>
      <textarea
        id="incident-text"
        value={text}
        onChange={event => setText(event.target.value)}
        placeholder="For example: On 20 August around 6 in the evening, I received a call from someone claiming to be from my bank. I shared an OTP and ₹15,000 was debited from my account via UPI."
      />
      <p className="helper">This is a prototype. We will never ask for real OTPs, passwords or account numbers — just describe what happened.</p>
      <button className="button primary" type="submit" disabled={!canContinue}>Continue <Arrow /></button>
    </form>
  </main>
}

export function ReportAssistedReview() {
  const { navigate } = useRouter()
  const { incident, setIncident } = useIncident()
  const [confirmed, setConfirmed] = useState(false)
  const hasDraft = incident.description.trim().length > 0

  useEffect(() => {
    if (!hasDraft) navigate('/report/assisted')
  }, [hasDraft, navigate])

  if (!hasDraft) return null

  const update = <K extends keyof IncidentData>(key: K, value: IncidentData[K]) => {
    setIncident(current => ({ ...current, [key]: value }))
    setConfirmed(false)
  }

  return <main className="report-page container">
    <ProgressSteps current="Details" />
    <div className="report-intro">
      <h1>Review what we understood</h1>
      <p className="lead">We organized your description into the fields below. Check each one and make changes if anything looks wrong.</p>
    </div>
    <form className="review-form" onSubmit={event => { event.preventDefault(); setConfirmed(true) }}>
      <div className="field-grid">
        <label>Incident type
          <input value="Financial fraud" disabled />
        </label>
        <label>Amount involved (₹)
          <input inputMode="numeric" value={incident.amount} onChange={e => update('amount', e.target.value)} placeholder="Not detected — add it" />
        </label>
        <label>Payment method
          <select value={incident.paymentMethod} onChange={e => update('paymentMethod', e.target.value)}>
            <option value="">Not detected — select one</option>
            <option>UPI</option>
            <option>Bank transfer</option>
            <option>Card</option>
            <option>Net banking</option>
            <option>Wallet</option>
            <option>Other</option>
          </select>
        </label>
        <label>Date
          <input type="date" value={incident.date} onChange={e => update('date', e.target.value)} />
        </label>
        <label>Approximate time
          <input value={incident.approximateTime} onChange={e => update('approximateTime', e.target.value)} placeholder="e.g. evening, around 6 pm" />
        </label>
        <label>How were you contacted?
          <select value={incident.contactMethod} onChange={e => update('contactMethod', e.target.value)}>
            <option value="">Not detected — select one</option>
            <option>Phone call</option>
            <option>SMS</option>
            <option>WhatsApp</option>
            <option>Email</option>
            <option>In person</option>
            <option>Not applicable</option>
          </select>
        </label>
        <label className="checkbox-field">
          <input type="checkbox" checked={incident.suspectedImpersonation} onChange={e => update('suspectedImpersonation', e.target.checked)} />
          The person or message claimed to represent a bank, company or government office
        </label>
      </div>
      <label className="description-field">Description
        <textarea value={incident.description} onChange={e => update('description', e.target.value)} />
      </label>
      {incident.missingInformation.length > 0 && <p className="helper">
        We couldn’t detect: {incident.missingInformation.map(key => MISSING_LABELS[key] ?? key).join(', ')}. Add these above if you can.
      </p>}
      {!confirmed
        ? <button className="button primary" type="submit">Confirm these details <Arrow /></button>
        : <p className="confirmation">Details confirmed. The next step (evidence upload) isn’t built yet in this prototype.</p>}
    </form>
  </main>
}

export function ReportManual() {
  const { navigate } = useRouter()
  return <main className="report-page container">
    <ProgressSteps current="Details" />
    <div className="report-intro">
      <h1>Enter the details yourself</h1>
      <p className="lead">Step-by-step manual entry isn’t built yet in this prototype.</p>
    </div>
    <div className="placeholder-card">
      <p>When this is ready, you’ll be asked for:</p>
      <ul className="needed-list">
        <li>Date</li>
        <li>Approximate time</li>
        <li>Amount</li>
        <li>Payment method</li>
        <li>Transaction/reference number</li>
        <li>Whether a transaction ID is available</li>
        <li>Contact method</li>
        <li>Description</li>
      </ul>
      <p className="helper">In the meantime, you can try assisted entry — it asks the same questions in plain language.</p>
      <div className="placeholder-actions">
        <button className="button secondary" onClick={() => navigate('/report/start')}>Back to start <Arrow /></button>
        <button className="button primary" onClick={() => navigate('/report/assisted')}>Try assisted entry instead <Arrow /></button>
      </div>
    </div>
  </main>
}

export function NotFound() {
  return <main className="report-page container">
    <div className="report-intro">
      <h1>Page not found</h1>
      <p className="lead">Let’s get you back on track.</p>
    </div>
    <Link className="button primary" to="/">Go to homepage <Arrow /></Link>
  </main>
}
