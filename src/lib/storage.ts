import { defaultSession, instruments, LOOP_BEATS } from './music';
import type { Session } from './music';

export const STORAGE_KEY = 'raagroom.session.v2';
export function parseSession(raw: string | null): Session {
  if (!raw) return { ...defaultSession, layers: [] };
  try {
    const s = JSON.parse(raw);
    if (s.version !== 2 || typeof s.name !== 'string' || s.name.length > 80 ||
      !Number.isFinite(s.bpm) || s.bpm < 50 || s.bpm > 160 ||
      !Number.isFinite(s.volume) || s.volume < 0 || s.volume > 1 || !Array.isArray(s.layers) || s.layers.length > 8) throw new Error('Invalid session');
    const ids = new Set();
    for (const layer of s.layers) {
      if (typeof layer.id !== 'string' || ids.has(layer.id) || typeof layer.name !== 'string' || layer.name.length > 80 ||
        !instruments.some(i => i.id === layer.instrument) || typeof layer.muted !== 'boolean' || !Array.isArray(layer.events) || layer.events.length > 512) throw new Error('Invalid layer');
      ids.add(layer.id);
      for (const e of layer.events) {
        if (!Number.isFinite(e.beat) || e.beat < 0 || e.beat >= LOOP_BEATS || !Number.isInteger(e.note) ||
          e.note < 0 || e.note > 127 || !Number.isFinite(e.velocity) || e.velocity < 0 || e.velocity > 1 ||
          !Number.isFinite(e.duration) || e.duration <= 0 || e.duration > 16) throw new Error('Invalid event');
      }
    }
    return s as Session;
  } catch { return { ...defaultSession, layers: [] }; }
}
export function loadSession(): Session {
  try { return parseSession(localStorage.getItem(STORAGE_KEY)); } catch { return { ...defaultSession, layers: [] }; }
}
