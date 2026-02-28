'use client';

import { useState, useCallback, useRef } from 'react';

interface UseTextToSpeechOptions {
  rate?: number; // 0.1 - 10
  pitch?: number; // 0 - 2
  volume?: number; // 0 - 1
  language?: string;
}

// Detect if text is Hinglish (Hindi words in Roman script)
function detectHinglish(text: string): boolean {
  // Common Hinglish patterns
  const hinglishPatterns = [
    /\b(hai|hain|ho|kya|kaise|kyun|kab|kahan|kitna|mujhe|tumhe|aap|hum|tum|yeh|woh|isko|usko)\b/i,
    /\b(chahiye|chahie|lena|dena|karna|hona|jana|aana|dekho|suno|bolo|samjha|samjhe)\b/i,
    /\b(thik|theek|accha|acha|arre|arrey|yaar|dost|bhai|didi|ji)\b/i,
    /\b(bukhar|dard|dawai|medicine|tablet|doctor|hospital)\b/i,
    /\b(nahi|nahin|mat|mujko|tujhe|usse|isse|jaise|waise|aise)\b/i,
  ];
  
  // Check if text matches Hinglish patterns
  return hinglishPatterns.some(pattern => pattern.test(text));
}

// Select best voice for the language
function selectBestVoice(synth: SpeechSynthesis, targetLang: string): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  if (voices.length === 0) return null;

  // For Hindi/Hinglish, prefer Hindi voices
  if (targetLang === 'hi-IN') {
    // Try to find Google Hindi voice (best quality)
    const googleHindi = voices.find(v => 
      v.lang === 'hi-IN' && v.name.includes('Google')
    );
    if (googleHindi) return googleHindi;

    // Fallback to any Hindi voice
    const anyHindi = voices.find(v => v.lang === 'hi-IN');
    if (anyHindi) return anyHindi;
  }

  // For Marathi
  if (targetLang === 'mr-IN') {
    const marathi = voices.find(v => v.lang === 'mr-IN');
    if (marathi) return marathi;
  }

  // For English, prefer Indian English voices
  if (targetLang === 'en-IN') {
    const googleEnIN = voices.find(v => 
      v.lang === 'en-IN' && v.name.includes('Google')
    );
    if (googleEnIN) return googleEnIN;

    const anyEnIN = voices.find(v => v.lang === 'en-IN');
    if (anyEnIN) return anyEnIN;
  }

  return null;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const { rate = 0.9, pitch = 1.05, volume = 1, language = 'en-IN' } = options;
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
      
      // Auto-detect Hinglish and use Hindi voice for better pronunciation
      let effectiveLang = language;
      if (language === 'en-IN' && detectHinglish(text)) {
        effectiveLang = 'hi-IN';
        console.log('Detected Hinglish - using Hindi voice');
      }

      // Natural speaking parameters
      utterance.rate = rate; // Slightly slower for clarity
      utterance.pitch = pitch; // Slightly higher for warmth
      utterance.volume = volume;
      utterance.lang = effectiveLang;

      // Select best available voice
      const bestVoice = selectBestVoice(synth, effectiveLang);
      if (bestVoice) {
        utterance.voice = bestVoice;
        console.log(`Using voice: ${bestVoice.name} (${bestVoice.lang})`);
      }

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
