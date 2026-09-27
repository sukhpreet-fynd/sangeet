import { useCallback, useEffect, useRef, useState } from 'react';
import { Synth } from '../audio/synth';
import { Looper } from '../audio/looper';
import { SongPlayer } from '../audio/song-player';
import { getInstrument, starterLayers } from '../lib/music';
import type { InstrumentId, Session } from '../lib/music';
import { loadSession, STORAGE_KEY } from '../lib/storage';
import { songs } from '../lib/songs';

type Room = { synth: Synth; looper: Looper; player: SongPlayer };
type Held = { pitch: number; release?: () => void; sustained: boolean };
export function useRoom() {
  const [session, setSession] = useState(loadSession);
  const sessionRef = useRef(session);
  const roomRef = useRef<Room | null>(null);
  const [instrument, setInstrument] = useState<InstrumentId>('guitar');
  const instrumentRef = useRef(instrument);
  const [fret, setFret] = useState(0);
  const [octave, setOctave] = useState(0);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [recordState, setRecordState] = useState<'idle' | 'waiting' | 'recording'>('idle');
  const [metronome, setMetronome] = useState(false);
  const [song, setSong] = useState(songs[0]);
  const [speed, setSpeed] = useState(1);
  const [practice, setPractice] = useState(false);
  const [songState, setSongState] = useState(() => new SongPlayer({ now: 0, noteOn: () => () => {}, stopGroup: () => {} }, songs[0], 'guitar').snapshot());
  const held = useRef(new Map<string, Held>());
  const flashes = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const strumTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const generation = useRef(0);
  const pending = useRef(false);
  const getRoom = useCallback(() => {
    if (!roomRef.current) {
      const synth = new Synth();
      const looper = new Looper(synth); looper.setLayers(sessionRef.current.layers);
      roomRef.current = { synth, looper, player: new SongPlayer(synth, songs[0], instrumentRef.current) };
    }
    return roomRef.current;
  }, []);
  const sync = useCallback(() => {
    const room = getRoom(); setPlaying(room.looper.playing); setPosition(room.looper.position);
    setRecordState(room.looper.recordState); setSongState(room.player.snapshot());
  }, [getRoom]);
  const updateSession = useCallback((update: (s: Session) => Session) => {
    const next = update(sessionRef.current); sessionRef.current = next; setSession(next);
    getRoom().looper.setLayers(next.layers); getRoom().synth.setVolume(next.volume);
  }, [getRoom]);
  const enable = useCallback(async () => {
    const room = getRoom();
    try { await room.synth.unlock(); room.synth.setVolume(sessionRef.current.volume); setReady(true); return room; }
    catch { setMessage('Sound could not start. Try Enable sound again.'); return null; }
  }, [getRoom]);
  const releaseAll = useCallback(() => {
    generation.current++;
    strumTimers.current.forEach(clearTimeout); strumTimers.current = [];
    for (const [token, note] of held.current) { note.release?.(); roomRef.current?.looper.noteUp(token); }
    held.current.clear();
    for (const timer of flashes.current.values()) clearTimeout(timer);
    flashes.current.clear(); roomRef.current?.synth.stopGroup('live'); setActive(new Set());
  }, []);
  const stop = useCallback(() => {
    releaseAll(); const room = getRoom(); room.looper.stop(); room.player.stop(); room.synth.stopAll(); sync();
  }, [getRoom, releaseAll, sync]);
  const down = useCallback(async (pitch: number, token: string) => {
    if (held.current.has(token)) return;
    const config = getInstrument(instrumentRef.current);
    const note: Held = { pitch, sustained: config.sustained }; held.current.set(token, note);
    const hoverOrScheduled = token.startsWith('hover:') || token.startsWith('strum:');
    const existing = getRoom();
    const room = hoverOrScheduled ? (existing.synth.running ? existing : null) : await enable();
    if (!room || held.current.get(token) !== note) { if (!room) held.current.delete(token); return; }
    note.release = room.synth.noteOn(config.id, pitch);
    room.looper.noteDown(token, pitch); room.player.input(pitch); sync();
    setActive(current => new Set(current).add(pitch));
    if (!config.sustained) {
      clearTimeout(flashes.current.get(pitch));
      flashes.current.set(pitch, setTimeout(() => { setActive(current => { const next = new Set(current); next.delete(pitch); return next; }); flashes.current.delete(pitch); }, 260));
    }
  }, [enable, getRoom, sync]);
  const up = useCallback((token: string) => {
    const note = held.current.get(token); if (!note) return;
    held.current.delete(token); getRoom().looper.noteUp(token);
    if (note.sustained) {
      note.release?.();
      if (![...held.current.values()].some(n => n.pitch === note.pitch)) setActive(current => { const next = new Set(current); next.delete(note.pitch); return next; });
    }
  }, [getRoom]);
  const strum = useCallback(async (reverse: boolean) => {
    const config = getInstrument(instrumentRef.current);
    if (!['guitar', 'bass'].includes(config.id)) return;
    const tokenGeneration = generation.current;
    if (!await enable() || tokenGeneration !== generation.current) return;
    const notes = config.notes.map(p => p + fret); if (reverse) notes.reverse();
    notes.forEach((pitch, i) => {
      const token = `strum:${crypto.randomUUID()}`;
      strumTimers.current.push(setTimeout(() => { void down(pitch, token); strumTimers.current.push(setTimeout(() => up(token), 100)); }, i * 45));
    });
  }, [down, enable, fret, up]);
  const selectInstrument = (id: InstrumentId) => {
    releaseAll(); setInstrument(id); instrumentRef.current = id; setFret(0); setOctave(0);
    getRoom().player.setInstrument(id); sync();
  };
  const setMapping = (value: number, kind: 'fret' | 'octave') => { releaseAll(); if (kind === 'fret') setFret(value); else setOctave(value); };
  const action = async (run: (room: Room) => void) => {
    if (pending.current) return; pending.current = true;
    const version = generation.current;
    try { const room = await enable(); if (room && version === generation.current) { run(room); sync(); } }
    finally { pending.current = false; }
  };
  const playSong = () => action(room => { room.looper.stop(); releaseAll(); room.player.play(); });
  const restartSong = () => action(room => { room.looper.stop(); releaseAll(); room.player.restart(); });
  const record = () => action(room => {
    if (room.looper.recordState !== 'idle' || sessionRef.current.layers.length >= 8) return;
    room.player.stop(); releaseAll(); const config = getInstrument(instrumentRef.current);
    room.looper.record(config.id, sessionRef.current.bpm, layer => {
      if (layer.events.length) {
        layer.name = `${config.name} take ${sessionRef.current.layers.length + 1}`;
        updateSession(s => ({ ...s, layers: [...s.layers, layer] })); setMessage(`${config.name} layer added.`);
      } else setMessage('No notes in that take. Record again and play a few notes.');
      sync();
    });
  });
  const toggleLoops = () => {
    if (getRoom().looper.playing) { getRoom().looper.stop(); releaseAll(); sync(); }
    else void action(room => { room.player.stop(); room.looper.start(sessionRef.current.bpm); });
  };
  const demo = () => action(room => {
    room.player.stop(); updateSession(s => ({ ...s, layers: starterLayers() })); room.looper.start(sessionRef.current.bpm);
    setMessage('Three original loops. Make them yours.');
  });
  const targetDown = () => { const target = getRoom().player.snapshot().target; if (target !== null) void down(target, 'practice-target'); };
  const targetUp = () => up('practice-target');
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); setSaved(true); } catch { setSaved(false); }
  }, [session]);
  useEffect(() => {
    if (!playing && songState.status !== 'playing') return;
    const timer = setInterval(sync, 32); return () => clearInterval(timer);
  }, [playing, songState.status, sync]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { stop(); setMessage('Playback stopped while you were away.'); } };
    document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', stop); window.addEventListener('blur', releaseAll);
    return () => {
      document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', stop); window.removeEventListener('blur', releaseAll);
      releaseAll(); roomRef.current?.looper.stop(); roomRef.current?.player.stop(); roomRef.current?.synth.dispose(); roomRef.current = null;
    };
  }, [releaseAll, stop]);
  const exportSession = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(sessionRef.current, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'raagroom-session.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage('Session JSON exported.');
  };
  return {
    session, updateSession, instrument, selectInstrument, fret, octave, setMapping, ready, enable, active, down, up, releaseAll, strum,
    message, saved, playing, position, recordState, metronome, setMetronome: (v: boolean) => { setMetronome(v); getRoom().looper.metronome = v; if (!v) getRoom().synth.stopGroup('click'); },
    song, songState, speed, practice, stop, record, toggleLoops, demo, exportSession, playSong, restartSong, targetDown, targetUp,
    pauseSong: () => { getRoom().player.pause(); releaseAll(); sync(); }, stopSong: () => { getRoom().player.stop(); releaseAll(); sync(); },
    selectSong: (id: string) => { const next = songs.find(s => s.id === id)!; releaseAll(); getRoom().player.setSong(next); setSong(next); sync(); },
    setSpeed: (value: number) => { setSpeed(value); getRoom().player.setSpeed(value); sync(); },
    setPractice: (value: boolean) => { releaseAll(); setPractice(value); getRoom().player.setPractice(value); sync(); },
    cancelRecord: () => { getRoom().looper.cancelRecording(); sync(); },
  };
}
