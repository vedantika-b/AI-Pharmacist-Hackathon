'use client';

import { useState, useCallback, useRef } from 'react';

interface UseTextToSpeechOptions {
  rate?: number; // 0.1 - 10
  pitch?: number; // 0 - 2
  volume?: number; // 0 - 1
  language?: string;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const { rate = 1, pitch = 1, volume = 1, language = 'en-IN' } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(
    (text: string) => {
      // Check browser support
      const synth = window.speechSynthesis;
      if (!synth) {
        console.error('Speech Synthesis not supported');
        return;
      }

      // Cancel any ongoing speech
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.lang = language;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);
    },
    [rate, pitch, volume, language]
  );

  const stop = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const pause = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth && isSpeaking) {
      synth.pause();
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth) {
      synth.resume();
    }
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    pause,
    resume,
  };
}
