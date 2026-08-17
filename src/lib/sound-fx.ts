// Centralized Web Audio API Sound Generator (Zero-latency, no external file dependencies needed)

class SoundFXManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private musicInterval: number | null = null;
  private bgmGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const savedSfx = localStorage.getItem("academia_sfx_muted");
      const savedMusic = localStorage.getItem("academia_music_muted");
      this.isMuted = savedSfx === "true";
      this.isMusicMuted = savedMusic === "true";
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public getSfxMuted(): boolean {
    return this.isMuted;
  }

  public getMusicMuted(): boolean {
    return this.isMusicMuted;
  }

  public toggleSfx(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("academia_sfx_muted", String(this.isMuted));
    }
    return this.isMuted;
  }

  public toggleMusic(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("academia_music_muted", String(this.isMusicMuted));
    }
    if (this.isMusicMuted) {
      this.stopAmbientMusic();
    } else {
      this.startAmbientMusic();
    }
    return this.isMusicMuted;
  }

  // ─── SFX Procedurales ──────────────────────────────────────────────

  // Aleteo suave de pájaro / viento
  public flap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, t);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Campanilla brillante / Arpa al recoger orbe de sabiduría
  public collectWisdom() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // Do, Mi, Sol, Do alto
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  // Absorción del Escudo Estoico (resistencia y serenidad)
  public shieldAbsorb() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.25);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.26);

    // Chime armónico de rescate
    setTimeout(() => {
      if (this.isMuted || !this.ctx) return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, t2);
      osc2.frequency.exponentialRampToValueAtTime(1100, t2 + 0.2);
      gain2.gain.setValueAtTime(0.2, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t2);
      osc2.stop(t2 + 0.26);
    }, 80);
  }

  // Tropezón leve con distracción
  public distractionBump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  // Golpe a la paleta / escudo de mármol
  public paddleHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.09);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Impacto y destrucción de bloque (arpegio musical ascendente según combo)
  public brickHit(combo: number = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Escala pentatónica luminosa
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = scale[Math.min(scale.length - 1, combo)];

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.14);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Recolección de Poder Estoico
  public powerupCollect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [440, 554.37, 659.25, 880];
    const base = this.ctx.currentTime;
    chords.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = base + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.29);
    });
  }

  // Rebote en barrera protectora de Atenas
  public laserBarrier() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.18);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.19);
  }

  // Sonido de punto / paso de columna limpio
  public passPillar() {

    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.08);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Sonido de caída / derrota reflexiva
  public gameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [330, 293.66, 261.63, 220]; // Mi, Re, Do, La (melancólico estoico)
    freqs.forEach((f, i) => {
      if (!this.ctx) return;
      const tSub = t + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, tSub);
      gain.gain.setValueAtTime(0.18, tSub);
      gain.gain.exponentialRampToValueAtTime(0.001, tSub + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(tSub);
      osc.stop(tSub + 0.36);
    });
  }

  // Fanfarria de logro / récord
  public victory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [
      { f: 523.25, t: 0 },
      { f: 659.25, t: 0.1 },
      { f: 783.99, t: 0.2 },
      { f: 1046.5, t: 0.35 },
      { f: 1318.5, t: 0.5 },
    ];
    const base = this.ctx.currentTime;
    chords.forEach(({ f, t }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, base + t);
      gain.gain.setValueAtTime(0.2, base + t);
      gain.gain.exponentialRampToValueAtTime(0.001, base + t + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(base + t);
      osc.stop(base + t + 0.45);
    });
  }

  // ─── Música Ambiental Procedural Estoica (Lira / Arpa de Templo) ────
  public startAmbientMusic() {
    if (this.isMusicMuted || this.isMusicPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isMusicPlaying = true;

    // Escala pentatónica serena inspirada en liras clásicas: Re menor dórico (D, E, F, G, A, C)
    const scale = [293.66, 329.63, 349.23, 392.0, 440.0, 523.25, 587.33, 659.25];

    const playHarmonicNote = () => {
      if (!this.ctx || !this.isMusicPlaying || this.isMusicMuted) return;
      const noteFreq = scale[Math.floor(Math.random() * scale.length)];
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(noteFreq, t);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, t);

      // Entrada suave y decaimiento resonante estilo cuerda pulsada
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 2.3);
    };

    // Arpegio continuo relajante
    if (this.musicInterval) window.clearInterval(this.musicInterval);
    playHarmonicNote();
    this.musicInterval = window.setInterval(() => {
      playHarmonicNote();
      if (Math.random() > 0.4) {
        setTimeout(playHarmonicNote, 400 + Math.random() * 300);
      }
    }, 1800);
  }

  public stopAmbientMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundFX = new SoundFXManager();
