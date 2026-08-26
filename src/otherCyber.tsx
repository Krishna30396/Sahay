import { useEffect, useState } from 'react'
import { useRouter } from './router'
import { useReport } from './reportState'
import { DescriptionField, EntryStartShell, ProgressSteps, StepActionBar, VoiceAssistedEntry, extractApproximateTime, extractDate } from './report'
import { descriptionMeetsMinimum, generateStructuredDescription } from './validation'
import {
  IMMEDIATE_RISK_OPTIONS,
  OTHER_ISSUE_TYPES,
  OTHER_PLATFORM_OPTIONS,
  RECEIVED_VIA_OPTIONS,
} from './categoryLabels'

export function OtherStart() {
  return <EntryStartShell
    category="other-cyber"
    title="Let’s understand what happened"
    supportingText="You can describe the problem in your own words, or enter the details yourself."
    assistedPath="/report/other/assisted"
    manualPath="/report/other/manual"
  />
}

const OTHER_PLATFORM_KEYWORDS: [RegExp, string][] = [
  [/whatsapp/i, 'WhatsApp'],
  [/instagram/i, 'Instagram'],
  [/facebook/i, 'Facebook'],
  [/\bemail\b/i, 'Email'],
  [/\bsms\b|text message/i, 'SMS'],
]

function extractOtherIssueType(text: string): string | null {
  if (/threat|harass|abus/i.test(text)) return 'Threats or harassment'
  if (/fake[\w\s]{0,24}(profile|account)|impersonat/i.test(text)) return 'Fake profile or impersonation'
  if (/suspicious (message|link|website)|phishing|scam link/i.test(text)) return 'Suspicious message, link or website'
  return null
}

function extractOtherPlatform(text: string): string | null {
  return OTHER_PLATFORM_KEYWORDS.find(([pattern]) => pattern.test(text))?.[1] ?? null
}

export function OtherAssisted() {
  const { navigate } = useRouter()
  const { setReport } = useReport()
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)
  const canContinue = text.trim().length > 0

  const submit = () => {
    if (!canContinue || processing) return
    setProcessing(true)
    setTimeout(() => {
      const issueType = extractOtherIssueType(text)
      const platform = extractOtherPlatform(text)
      const date = extractDate(text)

      const factsParts: string[] = []
      if (issueType) factsParts.push(`issue ${issueType}`)
      if (platform) factsParts.push(`platform ${platform}`)
      if (date) factsParts.push(`date ${date}`)
      const factsLine = factsParts.length ? `${factsParts.join('; ')}.` : null

      setReport(current => ({
        ...current,
        category: 'other-cyber',
        entryMode: 'assisted',
        incident: {
          ...current.incident,
          subType: issueType,
          date,
          approximateTime: extractApproximateTime(text),
          description: generateStructuredDescription(text, factsLine),
        },
        otherIncident: {
          ...current.otherIncident,
          issueType,
          platform,
        },
      }))
      navigate('/report/other/assisted/review')
    }, 700)
  }

  const appendSpeech = (chunk: string) => setText(current => (current.trim() ? `${current.trim()} ${chunk}` : chunk))

  return <main className="report-page report-page-wide">
    <ProgressSteps current="Start" />
    <VoiceAssistedEntry
      needed={{
        heading: 'What you’ll need',
        items: [
          'What happened',
          'Which platform or app it happened on',
          'Roughly when',
          'Any profile, account or link involved',
        ],
      }}
      title="Tell us what happened"
      supportingText="Speak in your own words. We’ll turn it into text for your report."
      placeholder="Someone created a fake Instagram account using my name and photo and has been sending messages to people I know."
      text={text}
      onTextChange={setText}
      onAppendSpeech={appendSpeech}
      onBack={() => navigate('/report/other/start')}
      onSubmit={submit}
      canContinue={canContinue}
      processing={processing}
      manualPath="/report/other/manual"
    />
  </main>
}

function SourceTag() {
  return <span className="source-tag">From your description</span>
}

export function OtherAssistedReview() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()

  useEffect(() => {
    if (report.entryMode !== 'assisted' || report.category !== 'other-cyber') navigate('/report/other/start')
  }, [report.entryMode, report.category, navigate])

  if (report.entryMode !== 'assisted' || report.category !== 'other-cyber') return null

  const updateOther = <K extends keyof typeof report.otherIncident>(key: K, value: typeof report.otherIncident[K]) =>
    setReport(current => ({ ...current, otherIncident: { ...current.otherIncident, [key]: value } }))
  const updateDate = (value: string) => setReport(current => ({ ...current, incident: { ...current.incident, date: value || null } }))

  return <main className="report-page">
    <ProgressSteps current="Details" />
    <div className="report-intro">
      <h1>Review what we understood</h1>
      <p className="lead">Check each field and make changes if anything looks wrong.</p>
    </div>
    <form className="review-form" onSubmit={event => event.preventDefault()}>
      <div className="field-grid">
        <label>Issue {report.otherIncident.issueType && <SourceTag />}
          <select value={report.otherIncident.issueType ?? ''} onChange={e => updateOther('issueType', e.target.value || null)}>
            <option value="">Not provided yet</option>
            {OTHER_ISSUE_TYPES.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>Platform {report.otherIncident.platform && <SourceTag />}
          <select value={report.otherIncident.platform ?? ''} onChange={e => updateOther('platform', e.target.value || null)}>
            <option value="">Not provided yet</option>
            {OTHER_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>Date {report.incident.date && <SourceTag />}
          <input value={report.incident.date ?? ''} onChange={e => updateDate(e.target.value)} placeholder="Not provided yet" />
        </label>
        <label>Person/account involved
          <input value={report.otherIncident.personOrAccountIdentifier ?? ''} onChange={e => updateOther('personOrAccountIdentifier', e.target.value || null)} placeholder="Not provided yet" />
        </label>
      </div>
      <DescriptionField
        value={report.incident.description}
        onChange={value => setReport(current => ({ ...current, incident: { ...current.incident, description: value } }))}
        generated
      />
    </form>
    <StepActionBar
      onBack={() => navigate('/report/other/assisted')}
      primaryLabel="Continue"
      onPrimary={() => navigate('/report/other/details')}
      primaryDisabled={!descriptionMeetsMinimum(report.incident.description)}
    />
  </main>
}

interface OtherManualDraft {
  issueType: string
  date: string
  approximateTime: string
  platform: string
  contactMethod: string
  immediateRisk: string
  impersonationTarget: string
  identifier: string
  receivedVia: string
  stillHave: string
  description: string
}

export function OtherManual() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()
  const [draft, setDraft] = useState<OtherManualDraft>(() => ({
    issueType: report.otherIncident.issueType ?? '',
    date: report.incident.date ?? '',
    approximateTime: report.incident.approximateTime ?? '',
    platform: report.otherIncident.platform ?? '',
    contactMethod: report.incident.contactMethod ?? '',
    immediateRisk: report.otherIncident.immediateRisk ?? '',
    impersonationTarget: '',
    identifier: report.otherIncident.personOrAccountIdentifier ?? '',
    receivedVia: '',
    stillHave: '',
    description: report.incident.description ?? '',
  }))

  const update = <K extends keyof OtherManualDraft>(key: K, value: OtherManualDraft[K]) => setDraft(current => ({ ...current, [key]: value }))
  const canContinue = draft.issueType.length > 0

  const submit = () => {
    if (!canContinue) return
    let description = draft.description
    if (draft.issueType === 'Fake profile or impersonation' && draft.impersonationTarget) {
      description = `Impersonating: ${draft.impersonationTarget}. ${description}`.trim()
    }
    if (draft.issueType === 'Suspicious message, link or website' && draft.stillHave === 'No') {
      description = `${description} (Original message or link is no longer available.)`.trim()
    }

    setReport(current => ({
      ...current,
      category: 'other-cyber',
      entryMode: 'manual',
      incident: {
        ...current.incident,
        subType: draft.issueType,
        date: draft.issueType === 'Threats or harassment' ? (draft.date || null) : current.incident.date,
        approximateTime: draft.issueType === 'Threats or harassment' ? (draft.approximateTime || null) : current.incident.approximateTime,
        contactMethod: draft.issueType === 'Threats or harassment' ? (draft.contactMethod || null)
          : draft.issueType === 'Suspicious message, link or website' ? (draft.receivedVia || null)
          : current.incident.contactMethod,
        description,
      },
      otherIncident: {
        ...current.otherIncident,
        issueType: draft.issueType,
        platform: draft.platform || null,
        personOrAccountIdentifier: draft.identifier || null,
        immediateRisk: draft.issueType === 'Threats or harassment' ? (draft.immediateRisk || null) : current.otherIncident.immediateRisk,
      },
    }))
    navigate('/report/other/details')
  }

  return <main className="report-page">
    <ProgressSteps current="Details" />
    <div className="report-intro">
      <h1>Tell us about the problem</h1>
      <p className="lead">Choose the closest match, then add a few details.</p>
    </div>
    <form className="review-form" onSubmit={event => { event.preventDefault(); submit() }}>
      <div className="field-grid">
        <label>What happened?
          <select value={draft.issueType} onChange={e => update('issueType', e.target.value)}>
            <option value="">Select an option</option>
            {OTHER_ISSUE_TYPES.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
      </div>

      {draft.issueType === 'Threats or harassment' && <div className="field-grid">
        <label>When did this start? (date)
          <input value={draft.date} onChange={e => update('date', e.target.value)} placeholder="e.g. yesterday, 20 August" />
        </label>
        <label>Approximate time
          <input value={draft.approximateTime} onChange={e => update('approximateTime', e.target.value)} placeholder="e.g. evening, around 6 pm" />
        </label>
        <label>Where is this happening?
          <select value={draft.platform} onChange={e => update('platform', e.target.value)}>
            <option value="">Select an option</option>
            {OTHER_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>How are you being contacted?
          <select value={draft.contactMethod} onChange={e => update('contactMethod', e.target.value)}>
            <option value="">Select an option</option>
            {OTHER_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>Are you currently in immediate danger?
          <select value={draft.immediateRisk} onChange={e => update('immediateRisk', e.target.value)}>
            <option value="">Select an option</option>
            {IMMEDIATE_RISK_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
      </div>}
      {draft.issueType === 'Threats or harassment' && draft.immediateRisk === 'Yes' && <p className="field-error" role="alert">
        If you are in immediate physical danger, contact local emergency services or a trusted person now. Do not wait for this prototype.
      </p>}

      {draft.issueType === 'Fake profile or impersonation' && <div className="field-grid">
        <label>What is being impersonated?
          <select value={draft.impersonationTarget} onChange={e => update('impersonationTarget', e.target.value)}>
            <option value="">Select an option</option>
            <option>Me</option>
            <option>Someone I know</option>
            <option>A company or person</option>
            <option>Other</option>
          </select>
        </label>
        <label>Where?
          <select value={draft.platform} onChange={e => update('platform', e.target.value)}>
            <option value="">Select an option</option>
            {OTHER_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>Profile / link (optional)
          <input value={draft.identifier} onChange={e => update('identifier', e.target.value)} placeholder="Not provided yet" />
        </label>
      </div>}

      {draft.issueType === 'Suspicious message, link or website' && <div className="field-grid">
        <label>How did you receive it?
          <select value={draft.receivedVia} onChange={e => update('receivedVia', e.target.value)}>
            <option value="">Select an option</option>
            {RECEIVED_VIA_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>Do you still have the message or link?
          <select value={draft.stillHave} onChange={e => update('stillHave', e.target.value)}>
            <option value="">Select an option</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>
        <label>Website or profile (optional)
          <input value={draft.identifier} onChange={e => update('identifier', e.target.value)} placeholder="Not provided yet" />
        </label>
      </div>}

      {draft.issueType === 'Suspicious message, link or website' && <p className="helper">What did it ask you to do? Include this in the description below.</p>}
      <DescriptionField value={draft.description} onChange={value => update('description', value)} />
    </form>
    <StepActionBar
      onBack={() => navigate('/report/other/start')}
      primaryLabel="Continue"
      onPrimary={submit}
      primaryDisabled={!canContinue}
    />
  </main>
}
