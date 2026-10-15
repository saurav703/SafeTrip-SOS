class SoundSystem {
  private ctx: AudioContext | null = null;
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenInterval: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Discreet haptic vibration or subtle tick
  playDiscreetPulse() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);

      // Hardware vibration if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 80, 100]);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  // Warning chime for the 30-second check-in countdown
  playCheckInChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(587.33, now + 0.15); // A4 -> D5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.5);

      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch {
      // ignore
    }
  }

  // Loud Deterrent Emergency Siren (European / American dual-tone emergency sweep)
  startSiren() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.sirenOsc1) return; // already playing

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      gain.connect(this.ctx.destination);
      this.sirenGain = gain;

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.connect(gain);
      osc.start();
      this.sirenOsc1 = osc;

      let high = false;
      this.sirenInterval = window.setInterval(() => {
        if (!this.ctx || !this.sirenOsc1) return;
        high = !high;
        const targetFreq = high ? 960 : 650;
        this.sirenOsc1.frequency.exponentialRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.35);
      }, 450);

      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }
    } catch {
      // ignore
    }
  }

  stopSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc1) {
      try {
        this.sirenOsc1.stop();
        this.sirenOsc1.disconnect();
      } catch {
        // ignore
      }
      this.sirenOsc1 = null;
    }
    if (this.sirenGain) {
      try {
        this.sirenGain.disconnect();
      } catch {
        // ignore
      }
      this.sirenGain = null;
    }
  }

  private ringOsc1: OscillatorNode | null = null;
  private ringOsc2: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private ringTimer: number | null = null;

  // Realistic telephone ringback tone (440Hz + 480Hz cadence)
  playPhoneRing() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ringOsc1) return;

      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.connect(this.ctx.destination);
      this.ringGain = gain;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.setValueAtTime(480, now); // 480Hz
      osc1.connect(gain);
      osc2.connect(gain);
      osc1.start();
      osc2.start();
      this.ringOsc1 = osc1;
      this.ringOsc2 = osc2;

      // Cadence: 1.5s ring, 2s silence
      let isRinging = true;
      this.ringTimer = window.setInterval(() => {
        if (!this.ctx || !this.ringGain) return;
        isRinging = !isRinging;
        const t = this.ctx.currentTime;
        if (isRinging) {
          this.ringGain.gain.setValueAtTime(0.25, t);
        } else {
          this.ringGain.gain.setValueAtTime(0.001, t);
        }
      }, 1600);

      if ('vibrate' in navigator) {
        navigator.vibrate([1000, 1000, 1000]);
      }
    } catch {
      // ignore
    }
  }

  stopPhoneRing() {
    if (this.ringTimer) {
      clearInterval(this.ringTimer);
      this.ringTimer = null;
    }
    if (this.ringOsc1) {
      try {
        this.ringOsc1.stop();
        this.ringOsc1.disconnect();
      } catch {}
      this.ringOsc1 = null;
    }
    if (this.ringOsc2) {
      try {
        this.ringOsc2.stop();
        this.ringOsc2.disconnect();
      } catch {}
      this.ringOsc2 = null;
    }
    if (this.ringGain) {
      try {
        this.ringGain.disconnect();
      } catch {}
      this.ringGain = null;
    }
  }

  // Text-To-Speech reader for offline first aid
  speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const soundSystem = new SoundSystem();
