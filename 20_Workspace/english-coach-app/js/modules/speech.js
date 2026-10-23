/**
 * English Coach App - Web Speech API (音声認識 & 音声合成)
 */

export class SpeechService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.synthesis = window.speechSynthesis || null;
    this.selectedVoice = null;
    this.speechRate = 0.95; // 聞き取りやすい自然な速度

    this.initRecognition();
    this.initVoices();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech Recognition is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = true;
      this.recognition.continuous = false;
    } catch (err) {
      console.error('Failed to initialize SpeechRecognition:', err);
    }
  }

  initVoices() {
    if (!this.synthesis) return;

    const setVoice = () => {
      const voices = this.synthesis.getVoices();
      // 英語ネイティブボイスの選定 (Google US English, Samantha, Daniel, Karen など)
      const preferred = voices.find(v => (v.lang === 'en-US' || v.lang === 'en-GB') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
      this.selectedVoice = preferred || voices.find(v => v.lang.startsWith('en')) || voices[0];
    };

    setVoice();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = setVoice;
    }
  }

  isRecognitionSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  isSynthesisSupported() {
    return !!window.speechSynthesis;
  }

  startListening({ onStart, onResult, onEnd, onError }) {
    if (!this.recognition) {
      if (onError) onError(new Error('お使いのブラウザは音声認識をサポートしていません。'));
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      if (onStart) onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (onResult) {
        onResult({ final: finalTranscript, interim: interimTranscript });
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      if (onError) onError(new Error(`音声認識エラー: ${event.error}`));
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.error('Speech start error:', err);
      if (onError) onError(err);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
      this.isListening = false;
    }
  }

  speak(text, { onStart, onEnd } = {}) {
    if (!this.synthesis) return;

    this.stopSpeaking();

    // 不要な記号やMarkdownタグの除去
    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/---\s*💡.*/s, '') // Tip箇所の除外
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = this.speechRate;
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;

    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  setRate(rate) {
    this.speechRate = Math.max(0.5, Math.min(2.0, rate));
  }
}

export const speech = new SpeechService();
