import { useEffect, useRef, useState } from 'react'

export interface SpeechLanguage { code: string; label: string }

export const SPEECH_LANGUAGES: SpeechLanguage[] = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml-IN', label: 'മലയാളം (Malayalam)' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ (Punjabi)' },
]

export type RecognitionState = 'idle' | 'listening' | 'unsupported' | 'error'

function getSpeechRecognitionCtor(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access was blocked. Allow microphone access for this site in your browser settings and try again.',
  'permission-denied': 'Microphone access was blocked. Allow microphone access for this site in your browser settings and try again.',
  'service-not-allowed': 'This browser is blocking the speech-recognition service. Some privacy-focused browsers (e.g. Brave) disable it by default — check your browser’s privacy/shields settings for a speech recognition or "Google services" toggle, or try Chrome/Edge with default settings.',
  network: 'The speech-recognition service couldn’t be reached. Some privacy-focused browsers (e.g. Brave) block it by default, or your network/VPN may be blocking it. Check your browser’s privacy settings, or try Chrome/Edge.',
  'no-speech': 'We didn’t hear anything. Try again, a little closer to the microphone.',
  'audio-capture': 'No microphone was found. Check that one is connected and try again.',
  aborted: 'Voice input was stopped.',
}

export function messageForSpeechError(code: string | null): string {
  if (!code) return 'Something went wrong with voice input. Please try again or type your description below.'
  return ERROR_MESSAGES[code] ?? `Voice input failed (${code}). Please try again or type your description below.`
}

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const [state, setState] = useState<RecognitionState>(() => (getSpeechRecognitionCtor() ? 'idle' : 'unsupported'))
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [language, setLanguage] = useState('en-IN')
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const start = () => {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor()
    if (!SpeechRecognitionCtor) { setState('unsupported'); return }
    setErrorCode(null)
    const recognition = new SpeechRecognitionCtor()
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event: any) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) final += transcript
        else interim += transcript
      }
      if (final.trim()) onTranscript(final.trim())
      setInterimText(interim)
    }
    recognition.onerror = (event: any) => {
      setErrorCode(event.error ?? 'unknown')
      setState('error')
      setInterimText('')
    }
    recognition.onend = () => {
      setInterimText('')
      setState(current => (current === 'listening' ? 'idle' : current))
    }
    recognitionRef.current = recognition
    setState('listening')
    recognition.start()
  }

  const stop = () => {
    recognitionRef.current?.stop()
    setState('idle')
    setInterimText('')
  }

  const dismissError = () => {
    setState(current => (current === 'error' ? 'idle' : current))
    setErrorCode(null)
  }

  return { state, start, stop, dismissError, interimText, errorCode, language, setLanguage, supported: state !== 'unsupported' }
}
