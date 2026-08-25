import { useEffect, useState } from 'react'
import { Link, useRouter } from './router'
import { ReportIncident, useReport } from './reportState'

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

function SafetyNote() {
  return <p className="safety-note">If the payment happened just now, call <a href="tel:1930">1930</a> and your bank/payment provider immediately.</p>
}

export function ReportStart() {
  const { navigate } = useRouter()
  return <main className="report-page">
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
    <StepActionBar onBack={() => navigate('/')} />
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
  const withSymbol = text.match(/(?:₹|rs\.?|inr)\s?([\d,]+(?:\.\d+)?)/i)
  if (withSymbol) return Number(withSymbol[1].replace(/,/g, ''))
  const bare = text.match(/\b(\d{3,7})\b/)
  return bare ? Number(bare[1]) : null
}

function extractDate(text: string): string | null {
  const match = text.match(/\bon\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+)\b/i)
  return match ? match[1] : null
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
  const canContinue = text.trim().length > 0

  const submit = () => {
    if (!canContinue) return
    const extracted = mockExtractIncident(text)
    setReport(current => ({
      ...current,
      entryMode: 'assisted',
      incident: { ...current.incident, ...extracted.incident },
      transaction: { transactionId: extracted.transactionId },
    }))
    navigate('/report/details')
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
        placeholder="For example: On 20 August around 6 in the evening, I received a call from someone claiming to be from my bank. I shared an OTP and ₹15,000 was debited from my account via UPI."
      />
      <p className="helper">This is a prototype. We will never ask for real OTPs, passwords or account numbers — just describe what happened.</p>
    </form>
    <StepActionBar
      onBack={() => navigate('/report/start')}
      primaryLabel="Continue"
      onPrimary={submit}
      primaryDisabled={!canContinue}
    />
  </main>
}

export function ReportManualRedirect() {
  const { navigate } = useRouter()
  const { setReport } = useReport()

  useEffect(() => {
    setReport(current => current.entryMode === 'manual' ? current : { ...current, entryMode: 'manual' })
    navigate('/report/details')
  }, [])

  return null
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
