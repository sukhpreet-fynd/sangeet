import { getInstrument } from '../lib/music';
import type { InstrumentId } from '../lib/music';

export interface SoundOptions { when?: number; duration?: number; velocity?: number; group?: string }
export interface AudioOutput {
  readonly now: number;
  noteOn: (instrument: InstrumentId, pitch: number, options?: SoundOptions) => () => void;
  stopGroup: (group: string) => void;
}
type Voice = { release: () => void; group: string };

export class Synth implements AudioOutput {
  private context?: AudioContext;
  private master?: GainNode;
  private noise?: AudioBuffer;
  private openHat?: () => void;
  private voices = new Set<Voice>();
  private volume = 0.65;
  get now() { return this.context?.currentTime ?? 0; }
  get running() { return this.context?.state === 'running'; }
  get activeVoices() { return this.voices.size; }
  // Called exclusively by gesture handlers, never mount effects or timers.
  async unlock() {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' });
      this.master = this.context.createGain();
      const limiter = this.context.createDynamicsCompressor();
      limiter.threshold.value = -14; limiter.ratio.value = 8;
      this.master.gain.value = this.volume * 0.6;
      this.master.connect(limiter).connect(this.context.destination);
    }
    if (this.context.state !== 'running') await this.context.resume();
    if (this.context.state !== 'running') throw new Error('Audio unavailable');
  }
  setVolume(value: number) {
    this.volume = value;
    this.master?.gain.setTargetAtTime(value * 0.6, this.now, 0.02);
  }
  noteOn(instrument: InstrumentId, pitch: number, options: SoundOptions = {}): () => void {
    const context = this.context;
    if (!context || !this.master) return () => {};
    if (instrument === 'drums') return this.drum(pitch, options);
    const when = Math.max(options.when ?? this.now, this.now);
    const velocity = Math.min(1, Math.max(0, options.velocity ?? 0.65));
    const sustained = getInstrument(instrument).sustained;
    const duration = options.duration ?? (sustained ? 120 : instrument === 'xylophone' ? 0.65 : 1.3);
    const attack = instrument === 'violin' ? 0.085 : 0.005;
    const releaseTime = instrument === 'violin' ? 0.14 : 0.065;
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = instrument === 'bass' ? 1100 : instrument === 'violin' ? 3400 : 7000;
    envelope.connect(filter).connect(this.master);
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(velocity * 0.45, when + Math.min(attack, duration / 2));
    if (sustained) {
      envelope.gain.setTargetAtTime(velocity * 0.3, when + attack, 0.18);
      envelope.gain.setTargetAtTime(0, when + duration, releaseTime / 3);
    } else envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    const frequency = 440 * 2 ** ((pitch - 69) / 12);
    const profiles: Record<Exclude<InstrumentId, 'drums'>, { partials: number[]; weights: number[]; type: OscillatorType }> = {
      guitar: { partials: [1, 2, 3], weights: [0.75, 0.2, 0.07], type: 'triangle' },
      bass: { partials: [1, 2], weights: [1, 0.22], type: 'sine' },
      violin: { partials: [1, 1.002], weights: [0.45, 0.25], type: 'sawtooth' },
      xylophone: { partials: [1, 3.99, 10], weights: [0.9, 0.22, 0.06], type: 'sine' },
      keyboard: { partials: [1, 2, 3], weights: [0.75, 0.17, 0.055], type: 'triangle' },
    };
    const profile = profiles[instrument];
    const nodes: AudioNode[] = [envelope, filter];
    const sources: OscillatorNode[] = [];
    for (let i = 0; i < profile.partials.length; i++) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = profile.type;
      oscillator.frequency.value = frequency * profile.partials[i];
      gain.gain.setValueAtTime(profile.weights[i], when);
      if (!sustained && i > 0) gain.gain.exponentialRampToValueAtTime(0.0001, when + Math.min(duration, 0.22));
      oscillator.connect(gain).connect(envelope);
      sources.push(oscillator); nodes.push(oscillator, gain);
    }
    if (instrument === 'violin') {
      const vibrato = context.createOscillator(); const depth = context.createGain();
      vibrato.frequency.value = 5.2; depth.gain.value = 7;
      vibrato.connect(depth); sources.forEach(source => depth.connect(source.detune));
      sources.push(vibrato); nodes.push(vibrato, depth);
    }
    return this.startVoice(sources, nodes, envelope, when, when + duration + releaseTime * 2, options.group);
  }
  private drum(pitch: number, options: SoundOptions): () => void {
    const context = this.context!;
    const when = Math.max(options.when ?? this.now, this.now);
    const velocity = Math.min(1, Math.max(0, options.velocity ?? 0.7));
    const tonal = [36, 45, 48].includes(pitch);
    const decay = pitch === 36 ? 0.48 : pitch === 38 ? 0.2 : pitch === 42 ? 0.075 : pitch === 46 ? 0.4 : pitch === 49 ? 1.2 : pitch === 51 ? 0.75 : 0.35;
    const duration = Math.min(decay, options.duration ?? decay);
    const envelope = context.createGain();
    envelope.connect(this.master!);
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(velocity * (tonal ? 0.85 : 0.4), when + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.008, duration));
    const sources: AudioScheduledSourceNode[] = [];
    const nodes: AudioNode[] = [envelope];
    if (tonal || pitch === 38) {
      const body = context.createOscillator(); const gain = context.createGain();
      const frequency = pitch === 36 ? 145 : pitch === 45 ? 180 : pitch === 48 ? 280 : 190;
      body.frequency.setValueAtTime(frequency, when);
      body.frequency.exponentialRampToValueAtTime(pitch === 36 ? 46 : frequency * 0.55, when + Math.min(0.15, duration));
      body.type = 'sine'; gain.gain.value = pitch === 38 ? 0.4 : 1;
      body.connect(gain).connect(envelope); sources.push(body); nodes.push(body, gain);
    }
    if (!tonal) {
      if (!this.noise) {
        this.noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      const noise = context.createBufferSource(); noise.buffer = this.noise;
      const filter = context.createBiquadFilter(); filter.type = 'highpass';
      filter.frequency.value = pitch === 38 ? 1300 : pitch === 51 ? 4500 : 7000;
      noise.connect(filter).connect(envelope); sources.push(noise); nodes.push(noise, filter);
      if ([46, 49, 51].includes(pitch)) {
        // Inharmonic partials give the cymbals a metallic body beneath their noise.
        for (const frequency of [317, 503, 811, 1423]) {
          const metal = context.createOscillator(); const gain = context.createGain();
          metal.type = 'square'; metal.frequency.value = frequency * (pitch === 51 ? 1.5 : 1);
          gain.gain.value = 0.045; metal.connect(gain).connect(envelope);
          sources.push(metal); nodes.push(metal, gain);
        }
      }
    }
    if (pitch === 42 && when <= this.now) this.openHat?.();
    const release = this.startVoice(sources, nodes, envelope, when, when + duration + 0.03, options.group);
    if (pitch === 46) this.openHat = release;
    return release;
  }
  private startVoice(sources: AudioScheduledSourceNode[], nodes: AudioNode[], envelope: GainNode, when: number, end: number, group = 'live'): () => void {
    let released = false;
    const voice: Voice = { group: group, release: () => {
      if (released) return;
      released = true;
      const now = this.now;
      if (typeof envelope.gain.cancelAndHoldAtTime === 'function') envelope.gain.cancelAndHoldAtTime(now);
      else { const value = envelope.gain.value; envelope.gain.cancelScheduledValues(now); envelope.gain.setValueAtTime(value, now); }
      if (when > now) envelope.gain.setValueAtTime(0, now);
      envelope.gain.setTargetAtTime(0, now, 0.012);
      sources.forEach(source => { try { source.stop(now + 0.065); } catch { /* Ended. */ } });
    } };
    if (this.voices.size >= 64) {
      const oldest = this.voices.values().next().value;
      if (oldest) { oldest.release(); this.voices.delete(oldest); }
    }
    this.voices.add(voice);
    sources[0].onended = () => { nodes.forEach(node => node.disconnect()); this.voices.delete(voice); };
    sources.forEach(source => { source.start(when); source.stop(end); });
    return voice.release;
  }
  stopGroup(group: string) { for (const voice of this.voices) if (voice.group === group) voice.release(); }
  stopAll() { for (const voice of this.voices) voice.release(); }
  dispose() { this.stopAll(); void this.context?.close(); }
}
