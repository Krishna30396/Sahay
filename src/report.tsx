import { useEffect, useState } from 'react'
import { Link, useRouter } from './router'
import { ReportCategory, ReportIncident, missingInformationLabel, useReport } from './reportState'
import { messageForSpeechError, useSpeechRecognition } from './speech'
import { MIN_DESCRIPTION_LENGTH, descriptionLength, descriptionMeetsMinimum, generateStructuredDescription } from './validation'

const Arrow = () => <span aria-hidden="true">→</span>

const STEPS = ['Start', 'Details', 'Evidence', 'Review', 'Submit'] as const
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

export function DescriptionField({ value, onChange, generated }: { value: string; onChange: (value: string) => void; generated?: boolean }) {
  const count = descriptionLength(value)
  const meetsMin = descriptionMeetsMinimum(value)
  return <div className="description-field-wrap">
    <label className="description-field">Description {generated && <span className="source-tag">Generated from your description</span>}
      <textarea value={value} onChange={event => onChange(event.target.value)} placeholder="Not provided yet" />
    </label>
    {generated && <p className="helper">Check that this accurately describes what happened.</p>}
    <p className={meetsMin ? 'char-count' : 'char-count char-count-low'}>
      {count} / {MIN_DESCRIPTION_LENGTH} characters — {MIN_DESCRIPTION_LENGTH} characters minimum.
      {!meetsMin && ' Add more detail before continuing.'}
    </p>
  </div>
}

function voiceIconProps() {
  return { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
}

function MicGlyph() {
  return <svg {...voiceIconProps()}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
}

function FileTextGlyph() {
  return <svg {...voiceIconProps()}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
}

function formatTimer(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function VoiceHeroIllustration() {
  return <img className="voice-hero-illustration" src="/assets/voice-assisted.png" alt="" aria-hidden="true" />
}

function StopGlyph() {
  return <svg {...voiceIconProps()} fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
}

function NeededSidebar({ heading, items }: { heading: string; items: string[] }) {
  return <section className="needed voice-sidebar">
    <h2>{heading}</h2>
    <ul className="needed-list">
      {items.map(item => <li key={item}>{item}</li>)}
    </ul>
    <p className="helper">Don’t have everything? That’s okay. You can continue and add missing information later.</p>
  </section>
}

export function VoiceAssistedEntry({
  needed,
  title,
  supportingText,
  placeholder,
  text,
  onTextChange,
  onAppendSpeech,
  onBack,
  backLabel = '← Change incident type',
  onSubmit,
  canContinue,
  processing,
  primaryLabel = 'Save & continue',
  processingLabel = 'Organizing your details…',
  manualPath,
  manualDescription = 'Enter every detail step by step with full control over your report.',
}: {
  needed: { heading: string; items: string[] }
  title: string
  supportingText: string
  placeholder: string
  text: string
  onTextChange: (value: string) => void
  onAppendSpeech: (chunk: string) => void
  onBack: () => void
  backLabel?: string
  onSubmit: () => void
  canContinue: boolean
  processing: boolean
  primaryLabel?: string
  processingLabel?: string
  manualPath: string
  manualDescription?: string
}) {
  const speech = useSpeechRecognition(onAppendSpeech)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (speech.state !== 'listening') return
    setElapsed(0)
    const id = setInterval(() => setElapsed(current => current + 1), 1000)
    return () => clearInterval(id)
  }, [speech.state])

  const listening = speech.state === 'listening'
  const micLabel = listening ? 'Listening…' : speech.state === 'unsupported' ? 'Voice not supported' : 'Tap to speak'

  return <>
    <div className="voice-layout">
      <div className="voice-copy-row">
        <div className="report-intro">
          <h1>{title}</h1>
          <p className="lead">{supportingText}</p>
        </div>
        <VoiceHeroIllustration />
      </div>

      <div className="voice-main">
        <section className="voice-card">
          <div className="voice-card-mic">
            <button
              type="button"
              className={`mic-circle${listening ? ' listening' : ''}`}
              onClick={() => { if (!listening) speech.start() }}
              disabled={speech.state === 'unsupported'}
              aria-pressed={listening}
            >
              <MicGlyph />
              {listening && <>
                <span className="mic-wave" aria-hidden="true" />
                <span className="mic-wave mic-wave-delay" aria-hidden="true" />
              </>}
            </button>
            <p className="mic-caption">{micLabel}</p>
            {listening && <span className="voice-timer">{formatTimer(elapsed)}</span>}
            {listening && <button type="button" className="mic-stop-button" onClick={speech.stop} aria-label="Stop recording">
              <StopGlyph />
            </button>}
          </div>
          <div className="voice-card-transcript">
            {listening && <div className="voice-status-row">
              <span className="voice-status-live">● Listening…</span>
            </div>}
            <textarea
              className="voice-transcript-text"
              value={text}
              onChange={event => onTextChange(event.target.value)}
              placeholder={placeholder}
            />
            {speech.interimText && <p className="helper voice-interim">Hearing: “{speech.interimText}”</p>}
            {speech.state === 'error' && <p className="field-error">{messageForSpeechError(speech.errorCode)}</p>}
            {speech.state === 'unsupported' && <p className="helper">Voice input isn’t supported in this browser. Try Chrome or Edge, or type your description below.</p>}
            <p className="voice-tip">💡 You can review and edit this in the next step.</p>
          </div>
        </section>

        <section className="manual-fallback">
          <span className="manual-fallback-icon" aria-hidden="true"><FileTextGlyph /></span>
          <div className="manual-fallback-text">
            <h2>Prefer to fill it in yourself?</h2>
            <p>{manualDescription}</p>
          </div>
          <Link className="button secondary" to={manualPath}>Fill in manually <Arrow /></Link>
        </section>
      </div>

      <NeededSidebar heading={needed.heading} items={needed.items} />
    </div>

    <div className="step-action-bar">
      <button type="button" className="button secondary" onClick={onBack}>{backLabel}</button>
      <span className="secure-note">🔒 Your information is secure and confidential.</span>
      <button type="button" className="button primary" onClick={onSubmit} disabled={!canContinue || processing}>{processing ? processingLabel : primaryLabel} <Arrow /></button>
    </div>
  </>
}

export function EntryStartShell({ category, title, supportingText, assistedPath, manualPath, needed, showSafetyNote }: {
  category: ReportCategory
  title: string
  supportingText: string
  assistedPath: string
  manualPath: string
  needed?: { heading: string; items: string[] }
  showSafetyNote?: boolean
}) {
  const { navigate } = useRouter()
  const { setReport } = useReport()
  const [selected, setSelected] = useState<'assisted' | 'manual' | null>(null)

  const goNext = () => {
    if (!selected) return
    setReport(current => ({ ...current, category, entryMode: selected }))
    navigate(selected === 'assisted' ? assistedPath : manualPath)
  }

  return <main className="report-page">
    <ProgressSteps current="Start" />
    <div className="report-intro">
      <h1>{title}</h1>
      <p className="lead">{supportingText}</p>
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
    {needed && <section className="needed">
      <h2>{needed.heading}</h2>
      <ul className="needed-list">
        {needed.items.map(item => <li key={item}>{item}</li>)}
      </ul>
      <p className="helper">Don’t have everything? That’s okay. You can continue and add missing information later.</p>
    </section>}
    {showSafetyNote && <SafetyNote />}
    <StepActionBar
      onBack={() => navigate('/')}
      primaryLabel="Continue to details"
      onPrimary={goNext}
      primaryDisabled={!selected}
    />
  </main>
}

export function ReportStart() {
  return <EntryStartShell
    category="financial-fraud"
    title="Let’s prepare your report"
    supportingText="You can describe what happened in your own words, or enter the details yourself."
    assistedPath="/report/assisted"
    manualPath="/report/manual"
    needed={{
      heading: 'What you’ll need',
      items: [
        'Approximate date and time',
        'Amount involved',
        'Payment method',
        'Transaction/reference details, if available',
        'Screenshots, messages or other evidence',
      ],
    }}
    showSafetyNote
  />
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

export function formatDemoDate(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function extractDate(text: string): string | null {
  const explicit = text.match(/\bon\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+)\b/i)
  if (explicit) return explicit[1]
  if (/\b(yesterday|last night)\b/i.test(text)) return formatDemoDate(-1)
  if (/\btoday\b/i.test(text)) return formatDemoDate(0)
  return null
}

export function extractApproximateTime(text: string): string | null {
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
  const amount = extractAmount(text)
  const paymentMethod = PAYMENT_KEYWORDS.find(([pattern]) => pattern.test(text))?.[1] ?? null
  const date = extractDate(text)
  const contactMethod = CONTACT_KEYWORDS.find(([pattern]) => pattern.test(text))?.[1] ?? null

  const factsParts: string[] = []
  if (amount != null) factsParts.push(`amount ₹${amount.toLocaleString('en-IN')}`)
  if (paymentMethod) factsParts.push(`payment method ${paymentMethod}`)
  if (date) factsParts.push(`date ${date}`)
  if (contactMethod) factsParts.push(`contacted via ${contactMethod}`)
  const factsLine = factsParts.length ? `${factsParts.join('; ')}.` : null

  return {
    incident: {
      type: 'Financial fraud',
      amount,
      currency: 'INR',
      paymentMethod,
      date,
      approximateTime: extractApproximateTime(text),
      contactMethod,
      impersonation: extractImpersonation(text),
      description: generateStructuredDescription(text, factsLine),
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
        transaction: { ...current.transaction, transactionId: extracted.transactionId },
      }))
      navigate('/report/details')
    }, 700)
  }

  const appendSpeech = (chunk: string) => setText(current => (current.trim() ? `${current.trim()} ${chunk}` : chunk))

  return <main className="report-page report-page-wide">
    <ProgressSteps current="Start" />
    <VoiceAssistedEntry
      needed={{
        heading: 'What you’ll need',
        items: [
          'Approximate date and time',
          'Amount involved',
          'Payment method',
          'Transaction/reference details, if available',
          'Screenshots, messages or other evidence',
        ],
      }}
      title="Tell us what happened"
      supportingText="Speak in your own words. We’ll turn it into text for your report."
      placeholder="For example: I lost 50k from UPI yesterday after a call from someone claiming to be my bank."
      text={text}
      onTextChange={setText}
      onAppendSpeech={appendSpeech}
      onBack={() => navigate('/report/start')}
      onSubmit={submit}
      canContinue={canContinue}
      processing={processing}
      manualPath="/report/manual"
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
  merchantName: string
  transactionDate: string
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
    merchantName: report.transaction.merchantName ?? '',
    transactionDate: report.transaction.transactionDate ?? '',
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
      transaction: {
        transactionId: draft.transactionId || null,
        merchantName: draft.merchantName || null,
        transactionDate: draft.transactionDate || null,
      },
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
      <section className="required-block">
        <h2>Required for this complaint</h2>
        <p className="helper">The National Cyber Crime Reporting Portal requires these details for a financial-fraud complaint.</p>
        <div className="field-grid">
          <label>Bank / wallet / merchant name <span className="required-badge">Required</span>
            <input value={draft.merchantName} onChange={e => update('merchantName', e.target.value)} placeholder="e.g. HDFC Bank, Paytm" />
          </label>
          <label>Transaction ID / UTR <span className="required-badge">Required</span>
            <input value={draft.transactionId} onChange={e => update('transactionId', e.target.value)} placeholder="12-digit UTR" />
          </label>
          <label>Transaction date <span className="required-badge">Required</span>
            <input value={draft.transactionDate} onChange={e => update('transactionDate', e.target.value)} placeholder="e.g. 24 August 2026" />
          </label>
          <label>Fraud amount (₹) <span className="required-badge">Required</span>
            <input inputMode="numeric" type="number" value={draft.amount} onChange={e => update('amount', e.target.value)} placeholder="0" />
          </label>
        </div>
      </section>
      <div className="field-grid">
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
        <label className="checkbox-field">
          <input type="checkbox" checked={draft.impersonation} onChange={e => update('impersonation', e.target.checked)} />
          The person or message claimed to represent a bank, company or government office
        </label>
      </div>
      <DescriptionField value={draft.description} onChange={value => update('description', value)} />
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
