// ============================================================================
// MOTEUR AUDIO HYBRIDE : SYNTHÈSE MINÉRALE WEB AUDIO API + TTS MULTI-VOIX
// ============================================================================

export class SoundEffectsEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private cavernImpulse: AudioBuffer | null = null;

  init(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Génère une réponse impulsionnelle de caverne pour le ConvolverNode du Boss
  getCavernImpulse(): AudioBuffer | null {
    const ctx = this.init();
    if (!ctx) return null;
    if (this.cavernImpulse) return this.cavernImpulse;

    const rate = ctx.sampleRate;
    const length = Math.floor(rate * 1.15);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.8) * 0.32;
      }
    }
    this.cavernImpulse = impulse;
    return impulse;
  }

  // Bruit minéral sec quand on pose ou retire une brique sur la pierre
  playStoneClick(higherPitch = false): void {
    if (this.muted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = higherPitch ? 195 : 145;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.065);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);

      // Grain minéral (bruit blanc filtré très bref)
      const bufferSize = Math.floor(ctx.sampleRate * 0.035);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(higherPitch ? 1200 : 850, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);
    } catch {
      // Ignore audio errors on restricted contexts
    }
  }

  // Accord cristallin de réussite
  playSuccessRune(): void {
    if (this.muted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;
      const freqs = [330, 440, 554.37, 659.25];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.055);
        gain.gain.setValueAtTime(0.001, now + idx * 0.055);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.055 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.055 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.48);
      });
    } catch {}
  }

  // Grondement sourd + souffle d'extinction de torche lors d'une erreur
  playTorchExtinguish(): void {
    if (this.muted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(52, now + 0.38);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch {}
  }

  // Résonance solennelle lors du déblocage d'une Stèle ou victoire contre le Boss
  playSteleUnlock(): void {
    if (this.muted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;
      const chord = [220, 329.63, 440, 554.37, 880];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i < 2 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.001, now + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.07 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + i * 0.07 + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 1.15);
      });
    } catch {}
  }

  // Bourdonnement sourd de l'Antre du Gardien (0 Ko d'asset)
  startBossDrone(): void {
    if (this.muted || this.droneOsc) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now); // La grave (A1)
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(115, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);

      this.droneOsc = osc;
      this.droneGain = gain;
    } catch {}
  }

  stopBossDrone(): void {
    try {
      if (this.droneOsc && this.ctx && this.droneGain) {
        const now = this.ctx.currentTime;
        this.droneGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
        this.droneOsc.stop(now + 0.28);
      }
    } catch {}
    this.droneOsc = null;
    this.droneGain = null;
  }
}

export const sfx = new SoundEffectsEngine();

export interface SpeakOptions {
  accent?: 'uk' | 'us' | 'boss';
  slow?: boolean;
  audioUrl?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

// Lecture audio : tente d'abord le fichier Neural TTS pré-généré (s'il est présent) avec réverbération caverneuse pour le Boss,
// sinon bascule instantanément sur la synthèse vocale multi-voix (UK Sonia, US Guy, Boss Ryan).
export function speakEnglish(text: string, options: SpeakOptions = {}): void {
  const { accent = 'uk', slow = false, audioUrl, onStart, onEnd } = options;

  const fallbackSpeechSynthesis = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onStart) onStart();
      setTimeout(() => {
        if (onEnd) onEnd();
      }, 650);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[:]/g, ',');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();

      if (accent === 'boss') {
        const bossVoice =
          voices.find((v) => v.lang.includes('en-GB') && /ryan|male|daniel|george|oliver|arthur/i.test(v.name)) ||
          voices.find((v) => v.lang.includes('en-GB')) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (bossVoice) utterance.voice = bossVoice;
        utterance.lang = 'en-GB';
        utterance.pitch = 0.72; // Voix grave du Gardien (-5% à -15%)
        utterance.rate = slow ? 0.8 : 0.92;
      } else if (accent === 'us') {
        const usVoice =
          voices.find((v) => v.lang.includes('en-US') && /guy|david|mark|alex|google us/i.test(v.name)) ||
          voices.find((v) => v.lang.includes('en-US')) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (usVoice) utterance.voice = usVoice;
        utterance.lang = 'en-US';
        utterance.pitch = 0.96;
        utterance.rate = slow ? 0.75 : 0.95;
      } else {
        const ukVoice =
          voices.find((v) => v.lang.includes('en-GB') && /sonia|hazel|libby|serena|kate|google uk/i.test(v.name)) ||
          voices.find((v) => v.lang.includes('en-GB')) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (ukVoice) utterance.voice = ukVoice;
        utterance.lang = 'en-GB';
        utterance.pitch = 1.03;
        utterance.rate = slow ? 0.75 : 0.95;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };
      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  };

  if (audioUrl && typeof window !== 'undefined' && window.location.protocol !== 'file:') {
    const audio = new Audio(audioUrl);
    audio.playbackRate = slow ? 0.8 : 1.0;
    audio.onplay = () => {
      if (onStart) onStart();
    };
    audio.onended = () => {
      if (onEnd) onEnd();
    };
    audio.onerror = () => {
      fallbackSpeechSynthesis();
    };
    audio.play().catch(() => {
      fallbackSpeechSynthesis();
    });
    return;
  }

  fallbackSpeechSynthesis();
}
