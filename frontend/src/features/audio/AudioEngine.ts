import { INITIAL_STATE, type AudioTrack, type PlayerState } from "./types";

type Listener = (state: PlayerState) => void;

/**
 * Moteur audio unique de la plateforme (feuille de route, phase 3).
 *
 * Encapsule un seul élément <audio> hors DOM, ses événements, l'analyse fréquentielle
 * (AudioContext + AnalyserNode) et le nettoyage. Une seule instance vit dans
 * AudioPlayerProvider : une seule piste peut jouer à la fois.
 */
export class AudioEngine {
  private el: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freq: Uint8Array | null = null;
  private analyserFailed = false;
  private pendingSeek: number | null = null;
  private state: PlayerState = INITIAL_STATE;
  private readonly listeners = new Set<Listener>();
  private readonly handlers: Array<[string, EventListener]> = [];

  constructor() {
    if (typeof window === "undefined") return;
    const el = document.createElement("audio");
    el.preload = "metadata";
    el.crossOrigin = "anonymous"; // requis par l'AnalyserNode ; les fichiers doivent être servis avec CORS
    el.setAttribute("playsinline", "");
    this.el = el;
    this.bind();
  }

  // ---------- abonnement ----------

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => { this.listeners.delete(listener); };
  }

  getState(): PlayerState {
    return this.state;
  }

  private set(patch: Partial<PlayerState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  // ---------- chargement ----------

  /** Charge une piste (sans la lancer). Même identifiant → aucun rechargement. */
  load(track: AudioTrack, startAt = 0) {
    if (!this.el) return;
    if (this.state.track?.id === track.id) {
      if (startAt > 0) this.seek(startAt);
      return;
    }
    this.pendingSeek = startAt > 0 ? startAt : null;
    this.set({
      track,
      status: track.src ? "loading" : "unavailable",
      currentTime: startAt,
      duration: track.durationSec ?? 0,
      error: null,
    });
    if (!track.src) {
      this.el.removeAttribute("src");
      this.el.load();
      return;
    }
    this.el.src = track.src;
    this.el.load();
  }

  /** Décharge la piste courante et coupe le son. */
  unload() {
    if (!this.el) return;
    this.el.pause();
    this.el.removeAttribute("src");
    this.el.load();
    this.pendingSeek = null;
    this.set({ ...INITIAL_STATE, volume: this.state.volume, rate: this.state.rate, muted: this.state.muted });
  }

  // ---------- transport ----------

  async play() {
    const el = this.el;
    const track = this.state.track;
    if (!el || !track?.src) return;
    if (this.state.status === "limit" || this.state.status === "ended") {
      this.seek(0);
    }
    this.ensureAnalyser();
    try {
      if (this.ctx && this.ctx.state === "suspended") await this.ctx.resume();
      await el.play();
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      if (name === "AbortError") return; // play() interrompu par un load()/pause() : sans conséquence
      if (name === "NotAllowedError") {
        this.set({ status: "blocked", error: "Le navigateur a bloqué la lecture automatique. Appuyez sur lecture pour démarrer." });
        return;
      }
      if (name === "NotSupportedError") {
        this.set({ status: "error", error: "Format audio non pris en charge par ce navigateur." });
        return;
      }
      this.set({ status: "error", error: "Lecture impossible pour le moment." });
    }
  }

  pause() {
    this.el?.pause();
  }

  toggle() {
    if (this.state.status === "playing") this.pause();
    else void this.play();
  }

  seek(seconds: number) {
    const el = this.el;
    if (!el || !this.state.track?.src) return;
    const max = this.maxTime();
    const t = Math.max(0, Math.min(max > 0 ? max : Number.MAX_SAFE_INTEGER, seconds));
    if (!Number.isFinite(el.duration) || el.readyState < 1) {
      this.pendingSeek = t;
      this.set({ currentTime: t });
      return;
    }
    el.currentTime = t;
    const status = this.state.status === "limit" || this.state.status === "ended" ? "paused" : this.state.status;
    this.set({ currentTime: t, status });
  }

  setVolume(v: number) {
    if (!this.el) return;
    this.el.volume = Math.max(0, Math.min(1, v));
  }

  setMuted(m: boolean) {
    if (!this.el) return;
    this.el.muted = m;
  }

  setRate(r: number) {
    if (!this.el) return;
    this.el.playbackRate = Math.max(0.5, Math.min(2, r));
  }

  /** Durée exploitable : plafond de l'extrait si défini, sinon durée du média. */
  maxTime(): number {
    const { track, duration } = this.state;
    if (track?.limitSec) return duration > 0 ? Math.min(track.limitSec, duration) : track.limitSec;
    return duration;
  }

  // ---------- analyse ----------

  /**
   * Niveaux fréquentiels normalisés (0..1) répartis sur `bars` barres.
   * null si l'analyse n'est pas disponible (avant la première lecture, ou source sans CORS).
   */
  levels(bars: number): number[] | null {
    if (!this.analyser || !this.freq || this.analyserFailed) return null;
    this.analyser.getByteFrequencyData(this.freq);
    const usable = Math.floor(this.freq.length * 0.7); // les bins les plus aigus sont vides sur de la voix
    const per = Math.max(1, Math.floor(usable / bars));
    const out = new Array<number>(bars);
    let silent = true;
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < per; j++) sum += this.freq[i * per + j] ?? 0;
      const v = sum / per / 255;
      if (v > 0) silent = false;
      out[i] = v;
    }
    // Source « tainted » (pas d'en-têtes CORS) : l'analyseur ne renvoie que des zéros pendant la lecture.
    if (silent && this.state.status === "playing" && this.el && this.el.currentTime > 1) {
      this.analyserFailed = true;
      return null;
    }
    return out;
  }

  private ensureAnalyser() {
    if (this.ctx || !this.el || this.analyserFailed) return;
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) { this.analyserFailed = true; return; }
      const ctx = new Ctor();
      const source = ctx.createMediaElementSource(this.el);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      this.ctx = ctx;
      this.analyser = analyser;
      this.freq = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      this.analyserFailed = true;
    }
  }

  // ---------- événements média ----------

  private on(type: string, fn: EventListener) {
    this.el?.addEventListener(type, fn);
    this.handlers.push([type, fn]);
  }

  private bind() {
    const el = this.el;
    if (!el) return;

    this.on("loadedmetadata", () => {
      const duration = Number.isFinite(el.duration) ? el.duration : this.state.duration;
      this.set({ duration });
      if (this.pendingSeek !== null) {
        el.currentTime = Math.min(this.pendingSeek, duration || this.pendingSeek);
        this.pendingSeek = null;
      }
    });
    this.on("canplay", () => {
      if (this.state.status === "loading") this.set({ status: el.paused ? "ready" : "playing" });
    });
    this.on("waiting", () => {
      if (this.state.status === "playing") this.set({ status: "loading" });
    });
    this.on("playing", () => this.set({ status: "playing", error: null }));
    this.on("play", () => { if (this.state.status !== "loading") this.set({ status: "playing", error: null }); });
    this.on("pause", () => {
      if (el.ended || this.state.status === "limit" || this.state.status === "error") return;
      this.set({ status: "paused" });
    });
    this.on("ended", () => this.set({ status: "ended", currentTime: this.state.duration || el.currentTime }));
    this.on("timeupdate", () => {
      const limit = this.state.track?.limitSec;
      if (limit && el.currentTime >= limit) {
        el.pause();
        this.set({ status: "limit", currentTime: limit });
        return;
      }
      this.set({ currentTime: el.currentTime });
    });
    this.on("durationchange", () => {
      if (Number.isFinite(el.duration)) this.set({ duration: el.duration });
    });
    this.on("volumechange", () => this.set({ volume: el.volume, muted: el.muted }));
    this.on("ratechange", () => this.set({ rate: el.playbackRate }));
    this.on("error", () => {
      const code = el.error?.code;
      const message =
        code === MediaError.MEDIA_ERR_NETWORK ? "Connexion interrompue pendant le chargement de l'audio." :
        code === MediaError.MEDIA_ERR_DECODE ? "Fichier audio illisible." :
        code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ? "Extrait audio introuvable ou format non pris en charge." :
        "Chargement de l'audio impossible.";
      if (this.state.track?.src) this.set({ status: "error", error: message });
    });
  }

  destroy() {
    if (this.el) {
      this.handlers.forEach(([type, fn]) => this.el?.removeEventListener(type, fn));
      this.el.pause();
      this.el.removeAttribute("src");
      this.el.load();
    }
    this.handlers.length = 0;
    this.listeners.clear();
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.analyser = null;
    this.freq = null;
    this.el = null;
  }
}
