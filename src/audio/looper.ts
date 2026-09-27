import { getInstrument, LOOP_BEATS, quantizeBeat } from '../lib/music';
import type { InstrumentId, Layer, NoteEvent } from '../lib/music';
import type { AudioOutput } from './synth';

interface Take { layer: Layer; start: number; finish: (layer: Layer) => void }
export class Looper {
  private origin = 0;
  private scheduledUntil = 0;
  private bpm = 96;
  private layers: Layer[] = [];
  private timer?: ReturnType<typeof setInterval>;
  private take?: Take;
  private pendingNotes = new Map<string, { event: NoteEvent; start: number }>();
  metronome = false;
  playing = false;
  constructor(private audio: AudioOutput) {}
  get beat() { return this.playing ? Math.max(0, (this.audio.now - this.origin) * this.bpm / 60) : 0; }
  get position() { return this.beat % LOOP_BEATS; }
  get recordState(): 'idle' | 'waiting' | 'recording' { return !this.take ? 'idle' : this.audio.now < this.origin + this.take.start * 60 / this.bpm ? 'waiting' : 'recording'; }
  setLayers(layers: Layer[]) {
    for (const layer of this.layers) if (!layers.some(l => l.id === layer.id && !l.muted)) this.audio.stopGroup(`loop:${layer.id}`);
    this.layers = layers;
  }
  start(bpm: number) {
    if (this.playing) return;
    this.bpm = bpm; this.origin = this.audio.now; this.scheduledUntil = this.origin; this.playing = true;
    this.tick(); this.timer = setInterval(() => this.tick(), 25);
  }
  record(instrument: InstrumentId, bpm: number, finish: Take['finish']) {
    const start = this.playing ? (Math.floor(this.beat / LOOP_BEATS) + 1) * LOOP_BEATS : 0;
    this.start(bpm);
    this.take = { start, finish, layer: { id: crypto.randomUUID(), name: '', instrument, events: [], muted: false } };
  }
  noteDown(token: string, note: number) {
    const take = this.take;
    if (!take || this.recordState !== 'recording' || this.beat >= take.start + LOOP_BEATS || take.layer.events.length >= 512) return;
    const event = { beat: quantizeBeat(this.beat - take.start), note, velocity: 0.65, duration: 0.3 };
    take.layer.events.push(event); this.pendingNotes.set(token, { event, start: this.beat });
  }
  noteUp(token: string) {
    const pending = this.pendingNotes.get(token);
    if (pending) {
      pending.event.duration = this.take && !getInstrument(this.take.layer.instrument).sustained
        ? (this.take.layer.instrument === 'xylophone' ? 0.65 : 1.3) * this.bpm / 60
        : Math.max(0.08, Math.min(LOOP_BEATS, this.beat - pending.start));
      this.pendingNotes.delete(token);
    }
  }
  cancelRecording() {
    if (this.take) this.audio.stopGroup(`loop:${this.take.layer.id}`);
    this.take = undefined; this.pendingNotes.clear();
  }
  tick() {
    if (!this.playing) return;
    if (this.take && this.beat >= this.take.start + LOOP_BEATS) {
      for (const token of this.pendingNotes.keys()) this.noteUp(token);
      const take = this.take; this.take = undefined;
      take.finish(take.layer);
    }
    const from = Math.max(this.scheduledUntil, this.audio.now - 0.002);
    const to = this.audio.now + 0.1;
    const secondsPerBeat = 60 / this.bpm;
    const first = Math.max(0, Math.floor((from - this.origin) / (LOOP_BEATS * secondsPerBeat)));
    const last = Math.floor((to - this.origin) / (LOOP_BEATS * secondsPerBeat));
    for (let cycle = first; cycle <= last; cycle++) {
      const layers = [...this.layers];
      if (this.take && cycle * LOOP_BEATS >= this.take.start + LOOP_BEATS) layers.push(this.take.layer);
      for (const layer of layers) {
        if (layer.muted) continue;
        for (const event of layer.events) {
          const when = this.origin + (cycle * LOOP_BEATS + event.beat) * secondsPerBeat;
          if (when >= from && when < to) this.audio.noteOn(layer.instrument, event.note, { when, duration: event.duration * secondsPerBeat, velocity: event.velocity, group: `loop:${layer.id}` });
        }
      }
      if (this.metronome) for (let beat = 0; beat < LOOP_BEATS; beat++) {
        const when = this.origin + (cycle * LOOP_BEATS + beat) * secondsPerBeat;
        if (when >= from && when < to) this.audio.noteOn('xylophone', beat % 4 === 0 ? 96 : 89, { when, duration: 0.04, velocity: 0.2, group: 'click' });
      }
    }
    this.scheduledUntil = to;
  }
  stop() {
    clearInterval(this.timer); this.cancelRecording(); this.playing = false;
    this.layers.forEach(layer => this.audio.stopGroup(`loop:${layer.id}`)); this.audio.stopGroup('click');
  }
}
