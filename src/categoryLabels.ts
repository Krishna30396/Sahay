export const ACCOUNT_AFFECTED_TYPES = [
  'Hacked account',
  'Someone is pretending to be me',
  'My personal information was misused',
  'Someone accessed my account without permission',
  'Something else',
] as const

export const ACCOUNT_PLATFORM_OPTIONS = ['WhatsApp', 'Instagram', 'Facebook', 'Email', 'Google account', 'Other']

export const ACCESS_STATUS_OPTIONS = ['Yes', 'No', "I'm not sure"]

export const DISCOVERY_OPTIONS = ['I was locked out', 'Something changed', 'I received a security alert', 'Someone contacted me', 'Someone I know told me', 'Other']

export const IMPERSONATION_TARGET_OPTIONS = ['Name / profile', 'Photos', 'Phone number', 'Email', 'Other']

export const INFO_MISUSE_OPTIONS = ['Personal details', 'Identity documents', 'Contact information', 'Account credentials', 'Other']

export function accountPlatformFieldLabel(affectedType: string | null): string {
  switch (affectedType) {
    case 'Hacked account': return 'Which account was affected?'
    case 'Someone accessed my account without permission': return 'Which account or service?'
    case 'Someone is pretending to be me': return 'Where is this happening?'
    case 'My personal information was misused': return 'Where was it used?'
    default: return 'Platform'
  }
}

export function accountMisuseFieldLabel(affectedType: string | null): string {
  switch (affectedType) {
    case 'Hacked account':
    case 'Someone accessed my account without permission':
      return 'How did you notice?'
    case 'Someone is pretending to be me':
      return 'What are they using?'
    case 'My personal information was misused':
      return 'What kind of information?'
    default:
      return 'Additional detail'
  }
}

export function accountMisuseOptions(affectedType: string | null): string[] {
  switch (affectedType) {
    case 'Someone is pretending to be me': return [...IMPERSONATION_TARGET_OPTIONS]
    case 'My personal information was misused': return [...INFO_MISUSE_OPTIONS]
    default: return [...DISCOVERY_OPTIONS]
  }
}

export function accountShowsAccess(affectedType: string | null): boolean {
  return affectedType === 'Hacked account' || affectedType === 'Someone accessed my account without permission'
}

export function accountShowsMisuse(affectedType: string | null): boolean {
  return affectedType !== null && affectedType !== 'Something else'
}

export const OTHER_ISSUE_TYPES = [
  'Threats or harassment',
  'Fake profile or impersonation',
  'Suspicious message, link or website',
  'Other',
] as const

export const OTHER_PLATFORM_OPTIONS = ['WhatsApp', 'Instagram', 'Facebook', 'Email', 'Phone/SMS', 'Other']

export const RECEIVED_VIA_OPTIONS = ['SMS', 'WhatsApp', 'Email', 'Social media', 'Website', 'Other']

export const IMMEDIATE_RISK_OPTIONS = ['No', "I'm not sure", 'Yes']
