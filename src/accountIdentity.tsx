import { useEffect, useState } from 'react'
import { useRouter } from './router'
import { useReport } from './reportState'
import { DescriptionField, ProgressSteps, StepActionBar, VoiceAssistedEntry, extractApproximateTime, extractDate } from './report'
import { generateStructuredDescription } from './validation'
import {
  ACCESS_STATUS_OPTIONS,
  ACCOUNT_AFFECTED_TYPES,
  ACCOUNT_PLATFORM_OPTIONS,
  accountMisuseFieldLabel,
  accountMisuseOptions,
  accountPlatformFieldLabel,
  accountShowsAccess,
  accountShowsMisuse,
} from './categoryLabels'

const ACCOUNT_PLATFORM_KEYWORDS: [RegExp, string][] = [
  [/whatsapp/i, 'WhatsApp'],
  [/instagram/i, 'Instagram'],
  [/facebook/i, 'Facebook'],
  [/\bgmail\b|google account/i, 'Google account'],
  [/\bemail\b/i, 'Email'],
]

function extractAffectedType(text: string): string | null {
  if (/hack|taken over|took over|compromis/i.test(text)) return 'Hacked account'
  if (/pretend(ing)? to be me|impersonat/i.test(text)) return 'Someone is pretending to be me'
  if (/personal information|leaked|misused my (details|information)/i.test(text)) return 'My personal information was misused'
  if (/accessed .*without (my )?permission|unauthorized access/i.test(text)) return 'Someone accessed my account without permission'
  return null
}

function extractAccessStatus(text: string): string | null {
  if (/can still (log ?in|access)|still have access|still access/i.test(text)) return 'Yes'
  if (/(can'?t|cannot|unable to) (log ?in|access)|locked out/i.test(text)) return 'No'
  return null
}

function extractAccountPlatform(text: string): string | null {
  return ACCOUNT_PLATFORM_KEYWORDS.find(([pattern]) => pattern.test(text))?.[1] ?? null
}

export function AccountIdentityAssisted() {
  const { navigate } = useRouter()
  const { setReport } = useReport()
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)
  const canContinue = text.trim().length > 0

  const submit = () => {
    if (!canContinue || processing) return
    setProcessing(true)
    setTimeout(() => {
      const affectedType = extractAffectedType(text)
      const platform = extractAccountPlatform(text)
      const accessStatus = extractAccessStatus(text)
      const date = extractDate(text)

      const factsParts: string[] = []
      if (affectedType) factsParts.push(`issue ${affectedType}`)
      if (platform) factsParts.push(`platform ${platform}`)
      if (accessStatus) factsParts.push(`access ${accessStatus}`)
      if (date) factsParts.push(`date ${date}`)
      const factsLine = factsParts.length ? `${factsParts.join('; ')}.` : null

      setReport(current => ({
        ...current,
        category: 'account-identity',
        entryMode: 'assisted',
        incident: {
          ...current.incident,
          subType: affectedType,
          date,
          approximateTime: extractApproximateTime(text),
          description: generateStructuredDescription(text, factsLine),
        },
        accountIdentity: {
          ...current.accountIdentity,
          affectedType,
          accountPlatform: platform,
          accessStatus,
        },
      }))
      navigate('/report/account-identity/assisted/review')
    }, 700)
  }

  const appendSpeech = (chunk: string) => setText(current => (current.trim() ? `${current.trim()} ${chunk}` : chunk))

  return <main className="report-page report-page-wide">
    <ProgressSteps current="Start" />
    <VoiceAssistedEntry
      needed={{
        heading: 'What we’ll need from you',
        items: [
          { label: 'Which account or platform is affected', done: Boolean(extractAffectedType(text) || extractAccountPlatform(text)) },
          { label: 'Roughly when you noticed', done: Boolean(extractDate(text) || extractApproximateTime(text)) },
          { label: 'Whether you can still access the account', done: extractAccessStatus(text) != null },
          { label: 'How you found out', done: false },
        ],
      }}
      title="Tell us what happened"
      supportingText="Speak in your own words. We’ll turn it into text for your report."
      placeholder="My Instagram account was taken over yesterday. The person changed my email and started messaging my contacts."
      text={text}
      onTextChange={setText}
      onAppendSpeech={appendSpeech}
      onBack={() => navigate('/')}
      onSubmit={submit}
      canContinue={canContinue}
      processing={processing}
      onManual={() => navigate('/report/account-identity/manual')}
    />
  </main>
}

function SourceTag() {
  return <span className="source-tag">From your description</span>
}

export function AccountIdentityAssistedReview() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()

  useEffect(() => {
    if (report.entryMode !== 'assisted' || report.category !== 'account-identity') navigate('/report/account-identity/assisted')
  }, [report.entryMode, report.category, navigate])

  if (report.entryMode !== 'assisted' || report.category !== 'account-identity') return null

  const updateAccount = <K extends keyof typeof report.accountIdentity>(key: K, value: typeof report.accountIdentity[K]) =>
    setReport(current => ({ ...current, accountIdentity: { ...current.accountIdentity, [key]: value } }))
  const updateDate = (value: string) => setReport(current => ({ ...current, incident: { ...current.incident, date: value || null } }))

  return <main className="report-page">
    <ProgressSteps current="Details" />
    <div className="report-intro">
      <h1>Review what we understood</h1>
      <p className="lead">Check each field and make changes if anything looks wrong.</p>
    </div>
    <form className="review-form" onSubmit={event => event.preventDefault()}>
      <div className="field-grid">
        <label>Issue {report.accountIdentity.affectedType && <SourceTag />}
          <select value={report.accountIdentity.affectedType ?? ''} onChange={e => updateAccount('affectedType', e.target.value || null)}>
            <option value="">Not provided yet</option>
            {ACCOUNT_AFFECTED_TYPES.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>Platform {report.accountIdentity.accountPlatform && <SourceTag />}
          <select value={report.accountIdentity.accountPlatform ?? ''} onChange={e => updateAccount('accountPlatform', e.target.value || null)}>
            <option value="">Not provided yet</option>
            {ACCOUNT_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>Access {report.accountIdentity.accessStatus && <SourceTag />}
          <select value={report.accountIdentity.accessStatus ?? ''} onChange={e => updateAccount('accessStatus', e.target.value || null)}>
            <option value="">Not provided yet</option>
            {ACCESS_STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>Date {report.incident.date && <SourceTag />}
          <input value={report.incident.date ?? ''} onChange={e => updateDate(e.target.value)} placeholder="Not provided yet" />
        </label>
      </div>
      <DescriptionField
        value={report.incident.description}
        onChange={value => setReport(current => ({ ...current, incident: { ...current.incident, description: value } }))}
        generated
      />
    </form>
    <StepActionBar
      onBack={() => navigate('/report/account-identity/assisted')}
      primaryLabel="Continue"
      onPrimary={() => navigate('/report/account-identity/details')}
    />
  </main>
}

interface AccountManualDraft {
  affectedType: string
  accountPlatform: string
  accessStatus: string
  date: string
  approximateTime: string
  misuseType: string
  description: string
}

export function AccountIdentityManual() {
  const { navigate } = useRouter()
  const { report, setReport } = useReport()
  const [draft, setDraft] = useState<AccountManualDraft>(() => ({
    affectedType: report.accountIdentity.affectedType ?? '',
    accountPlatform: report.accountIdentity.accountPlatform ?? '',
    accessStatus: report.accountIdentity.accessStatus ?? '',
    date: report.incident.date ?? '',
    approximateTime: report.incident.approximateTime ?? '',
    misuseType: report.accountIdentity.misuseType ?? '',
    description: report.incident.description ?? '',
  }))

  const update = <K extends keyof AccountManualDraft>(key: K, value: AccountManualDraft[K]) => setDraft(current => ({ ...current, [key]: value }))
  const canContinue = draft.affectedType.length > 0

  const submit = () => {
    if (!canContinue) return
    setReport(current => ({
      ...current,
      category: 'account-identity',
      entryMode: 'manual',
      incident: {
        ...current.incident,
        subType: draft.affectedType,
        date: draft.affectedType === 'Hacked account' ? (draft.date || null) : current.incident.date,
        approximateTime: draft.affectedType === 'Hacked account' ? (draft.approximateTime || null) : current.incident.approximateTime,
        description: draft.description,
      },
      accountIdentity: {
        ...current.accountIdentity,
        affectedType: draft.affectedType,
        accountPlatform: draft.accountPlatform || null,
        accessStatus: accountShowsAccess(draft.affectedType) ? (draft.accessStatus || null) : null,
        misuseType: accountShowsMisuse(draft.affectedType) ? (draft.misuseType || null) : null,
      },
    }))
    navigate('/report/account-identity/details')
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
          <select value={draft.affectedType} onChange={e => update('affectedType', e.target.value)}>
            <option value="">Select an option</option>
            {ACCOUNT_AFFECTED_TYPES.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
      </div>

      {draft.affectedType && draft.affectedType !== 'Something else' && <div className="field-grid">
        <label>{accountPlatformFieldLabel(draft.affectedType)}
          <select value={draft.accountPlatform} onChange={e => update('accountPlatform', e.target.value)}>
            <option value="">Select an option</option>
            {ACCOUNT_PLATFORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>

        {accountShowsAccess(draft.affectedType) && <label>Can you still access the account?
          <select value={draft.accessStatus} onChange={e => update('accessStatus', e.target.value)}>
            <option value="">Select an option</option>
            {ACCESS_STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </label>}

        {draft.affectedType === 'Hacked account' && <>
          <label>When did you first notice? (date)
            <input value={draft.date} onChange={e => update('date', e.target.value)} placeholder="e.g. yesterday, 20 August" />
          </label>
          <label>Approximate time
            <input value={draft.approximateTime} onChange={e => update('approximateTime', e.target.value)} placeholder="e.g. evening, around 6 pm" />
          </label>
        </>}

        {accountShowsMisuse(draft.affectedType) && <label>{accountMisuseFieldLabel(draft.affectedType)}
          <select value={draft.misuseType} onChange={e => update('misuseType', e.target.value)}>
            <option value="">Select an option</option>
            {accountMisuseOptions(draft.affectedType).map(o => <option key={o}>{o}</option>)}
          </select>
        </label>}
      </div>}

      <DescriptionField value={draft.description} onChange={value => update('description', value)} />
    </form>
    <StepActionBar
      onBack={() => navigate('/report/account-identity/assisted')}
      primaryLabel="Continue"
      onPrimary={submit}
      primaryDisabled={!canContinue}
    />
  </main>
}
