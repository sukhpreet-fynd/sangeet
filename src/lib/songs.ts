import licensed from '../data/bollywood.json';
import originals from '../data/originals.json';

export interface SongNote { pitch: number; startTime: number; duration: number; velocity: number }
export interface PresetSong {
  id: string; title: string; collection: 'Original practice' | 'Original film-inspired' | 'Bollywood';
  difficulty: 'Easy' | 'Intermediate'; composer: string;
  license: { kind: 'original' | 'CC0' | 'CC-BY-4.0' | 'licensed'; attribution: string; source?: string };
  notes: SongNote[];
}
export interface SongLibrary { version: 1; songs: PresetSong[] }
export function songDuration(song: PresetSong) { return Math.max(...song.notes.map(n => n.startTime + n.duration)); }
export function validateLibrary(value: unknown): SongLibrary {
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('songs' in value) || !Array.isArray(value.songs)) throw new Error('Expected { version: 1, songs: [] }');
  const ids = new Set<string>();
  for (const s of value.songs) {
    if (!s || typeof s.id !== 'string' || !s.id || ids.has(s.id) || typeof s.title !== 'string' || !s.title || typeof s.composer !== 'string' ||
      !['Original practice', 'Original film-inspired', 'Bollywood'].includes(s.collection) || !['Easy', 'Intermediate'].includes(s.difficulty) ||
      !s.license || !['original', 'CC0', 'CC-BY-4.0', 'licensed'].includes(s.license.kind) || typeof s.license.attribution !== 'string' || !s.license.attribution.trim() ||
      !Array.isArray(s.notes) || !s.notes.length || s.notes.length > 10000) throw new Error(`Invalid song: ${s?.id ?? 'unknown'}`);
    if (s.collection === 'Bollywood' && (!s.license.source || s.license.kind === 'original')) throw new Error('Bollywood songs require a license source and licensed or public-domain rights');
    ids.add(s.id);
    let previous = -1;
    for (const n of s.notes) {
      if (!Number.isInteger(n.pitch) || n.pitch < 24 || n.pitch > 108 || !Number.isFinite(n.startTime) || n.startTime < 0 || n.startTime < previous ||
        !Number.isFinite(n.duration) || n.duration < 0.04 || n.duration > 30 || n.startTime + n.duration > 600 ||
        !Number.isFinite(n.velocity) || n.velocity <= 0 || n.velocity > 1) throw new Error(`Invalid note data in ${s.id}`);
      previous = n.startTime;
    }
  }
  return value as SongLibrary;
}
const practice: PresetSong = {
  id: 'first-light', title: 'First light', collection: 'Original practice', difficulty: 'Easy', composer: 'Raagroom',
  license: { kind: 'original', attribution: 'Original composition created for Raagroom. CC0.' },
  notes: [60, 64, 67, 72, 71, 67, 64, 62, 60].map((pitch, i) => ({ pitch, startTime: i * 0.6, duration: i === 8 ? 1.2 : 0.45, velocity: 0.65 })),
};
export const songs = [practice, ...validateLibrary(originals).songs, ...validateLibrary(licensed).songs];
if (new Set(songs.map(s => s.id)).size !== songs.length) throw new Error('Song IDs must be unique across collections');
export function formatTime(seconds: number) { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
