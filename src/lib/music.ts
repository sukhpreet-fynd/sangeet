export const LOOP_BEATS = 8;
export const STEPS_PER_BEAT = 4;
export type InstrumentId = 'guitar' | 'bass' | 'violin' | 'xylophone' | 'keyboard' | 'drums';
export interface Instrument {
  id: InstrumentId; name: string; family: string; description: string; hint: string;
  color: string; sustained: boolean; transpose: number; notes: number[]; shortcuts: string[];
}
const natural = [60, 62, 64, 65, 67, 69, 71, 72];
export const instruments: Instrument[] = [
  { id: 'guitar', name: 'Guitar', family: 'STRINGS', description: 'A few strings. A thousand beginnings.', hint: 'Pluck a string, or drag across them to strum.', color: '#ead2b1', sustained: false, transpose: -12, notes: [40, 45, 50, 55, 59, 64], shortcuts: ['a', 's', 'd', 'f', 'g', 'h'] },
  { id: 'bass', name: 'Bass', family: 'LOW END', description: 'Give your day a little grounding.', hint: 'Four strings. Find the pulse underneath.', color: '#c7ddd0', sustained: false, transpose: -24, notes: [28, 33, 38, 43], shortcuts: ['a', 's', 'd', 'f'] },
  { id: 'violin', name: 'Violin', family: 'BOWED STRINGS', description: 'Let a single note take its time.', hint: 'Hold a note to bow. Release to let it fade.', color: '#e6c9bc', sustained: true, transpose: 0, notes: natural, shortcuts: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'] },
  { id: 'xylophone', name: 'Xylophone', family: 'MALLETS', description: 'Little notes. Bright possibilities.', hint: 'Tap a bar. Follow the happy accidents.', color: '#d8cdf1', sustained: false, transpose: 0, notes: natural, shortcuts: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'] },
  { id: 'keyboard', name: 'Keyboard', family: 'KEYS', description: 'Make room for a new melody.', hint: 'Hold the keys. Let your melody breathe.', color: '#c9d9ec', sustained: true, transpose: 0, notes: Array.from({ length: 13 }, (_, i) => 60 + i), shortcuts: ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k'] },
  { id: 'drums', name: 'Drums', family: 'PERCUSSION', description: 'A heartbeat for every idea.', hint: 'Tap a drum or cymbal. Build your own groove.', color: '#d5b985', sustained: false, transpose: 0, notes: [36, 38, 42, 46, 45, 48, 49, 51], shortcuts: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'] },
];
export const drumLabels: Record<number, string> = { 36: 'Kick', 38: 'Snare', 42: 'Closed hat', 46: 'Open hat', 45: 'Low tom', 48: 'High tom', 49: 'Crash', 51: 'Ride' };
export function instrumentNoteName(id: InstrumentId, pitch: number) { return id === 'drums' ? drumLabels[pitch] ?? 'Drum' : noteName(pitch); }
export function presetPitch(id: InstrumentId, pitch: number) {
  // A repeatable rhythmic interpretation when a pitched score is played on the kit.
  return id === 'drums' ? [36, 42, 42, 38, 38, 45, 46, 46, 48, 48, 49, 51][pitch % 12] : pitch + getInstrument(id).transpose;
}
export function getInstrument(id: InstrumentId) { return instruments.find(i => i.id === id)!; }
export function noteName(midi: number): string {
  return ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][midi % 12] + (Math.floor(midi / 12) - 1);
}
export function quantizeBeat(beat: number): number {
  return ((Math.round(beat * STEPS_PER_BEAT) / STEPS_PER_BEAT) % LOOP_BEATS + LOOP_BEATS) % LOOP_BEATS;
}
export function stringPosition(instrument: Instrument, pitch: number): { index: number; fret: number } | null {
  if (instrument.id !== 'guitar' && instrument.id !== 'bass') return null;
  for (let i = instrument.notes.length - 1; i >= 0; i--) {
    const fret = pitch - instrument.notes[i];
    if (fret >= 0 && fret <= 24) return { index: i, fret };
  }
  return null;
}
export interface NoteEvent { beat: number; note: number; velocity: number; duration: number }
export interface Layer { id: string; instrument: InstrumentId; name: string; events: NoteEvent[]; muted: boolean }
export interface Session { version: 2; name: string; bpm: number; volume: number; layers: Layer[] }
export const defaultSession: Session = { version: 2, name: 'An afternoon idea', bpm: 96, volume: 0.65, layers: [] };
export function starterLayers(): Layer[] {
  return [
    { id: crypto.randomUUID(), instrument: 'xylophone', name: 'Little daydream', muted: false, events: [0, 1.5, 2.5, 3, 4, 5.5, 6.5, 7].map((beat, i) => ({ beat, note: [60, 64, 67, 72, 69, 67, 64, 62][i], velocity: 0.65, duration: 0.4 })) },
    { id: crypto.randomUUID(), instrument: 'keyboard', name: 'A warm backdrop', muted: false, events: [0, 4].flatMap(beat => [48, beat === 0 ? 55 : 57, 64].map(note => ({ beat, note, velocity: 0.4, duration: 2.5 }))) },
    { id: crypto.randomUUID(), instrument: 'bass', name: 'Easy heartbeat', muted: false, events: [0, 2, 4, 6].map((beat, i) => ({ beat, note: i < 2 ? 36 : 33, velocity: 0.65, duration: 0.6 })) },
  ];
}
