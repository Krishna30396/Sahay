import { ReportState } from './reportState'

// Characters NCRP-style complaint forms typically reject in free-text fields.
export const PROHIBITED_CHARS_REGEX = /[<>{}[\]\\^~`|]/g

export function sanitizeDescription(text: string): string {
  return text.replace(PROHIBITED_CHARS_REGEX, '')
}

export function containsProhibitedCharacters(text: string): boolean {
  PROHIBITED_CHARS_REGEX.lastIndex = 0
  return PROHIBITED_CHARS_REGEX.test(text)
}

// Rejects values that are just symbols/punctuation with no real letters or
// digits in them, so a field can't be "filled" with irrelevant noise.
export function isMeaningfulInput(value: string): boolean {
  return /[a-zA-Z0-9]/.test(value)
}

/**
 * Builds a structured description from the citizen's own words plus a
 * "Reported details" recap line assembled only from facts already
 * extracted from that same text — never invents new information.
 */
export function generateStructuredDescription(rawText: string, factsLine: string | null): string {
  const cleanedRaw = sanitizeDescription(rawText.trim())
  const trimmedFacts = factsLine?.trim()
  if (!trimmedFacts || cleanedRaw.includes(trimmedFacts)) return cleanedRaw
  return `${cleanedRaw}\n\nReported details: ${trimmedFacts}`
}

export function financialRequiredErrors(state: Pick<ReportState, 'incident' | 'transaction'>): string[] {
  const errors: string[] = []
  if (!state.transaction.merchantName || !isMeaningfulInput(state.transaction.merchantName)) {
    errors.push('Bank / wallet / merchant name is required for this complaint type.')
  }
  if (!state.transaction.transactionId || !/^\d{12}$/.test(state.transaction.transactionId)) {
    errors.push('Transaction ID / UTR is required and must be exactly 12 digits.')
  }
  if (!state.transaction.transactionDate || !isMeaningfulInput(state.transaction.transactionDate)) {
    errors.push('Transaction date is required for this complaint type.')
  }
  if (state.incident.amount == null || state.incident.amount <= 0) errors.push('Fraud amount is required for this complaint type.')
  return errors
}
