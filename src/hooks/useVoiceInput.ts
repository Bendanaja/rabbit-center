'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Web Speech API types (not in all TS libs)
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  length: number;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript: string; confidence: number };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

interface UseVoiceInputOptions {
  onTranscript?: (transcript: string) => void;
  lang?: string;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  interimTranscript: string;
  isSupported: boolean;
  toggleListening: () => void;
}

export function useVoiceInput({
  onTranscript,
  lang = 'th-TH',
}: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const finalTranscriptRef = useRef('');

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Deliver accumulated final transcript
    const text = finalTranscriptRef.current.trim();
    if (text && onTranscript) {
      onTranscript(text);
    }
    finalTranscriptRef.current = '';
  }, [onTranscript]);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    // Reset state
    finalTranscriptRef.current = '';
    setInterimTranscript('');

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();

    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onend = () => {
      // Chrome stops recognition after silence — auto-restart if still listening
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started or other error — stop gracefully
          stopListening();
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        stopListening();
        return;
      }
      // Ignore no-speech and aborted — they happen normally
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      stopListening();
    };

    recognitionRef.current = recognition;
    isListeningRef.current = true;
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      stopListening();
    }
  }, [isSupported, lang, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        isListeningRef.current = false;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isListening, interimTranscript, isSupported, toggleListening };
}
