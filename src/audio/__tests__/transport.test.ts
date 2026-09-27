import { afterEach, describe, expect, it, vi } from 'vitest';
import { SongPlayer } from '../song-player';
import { Looper } from '../looper';
import type { AudioOutput, SoundOptions } from '../synth';
import type { InstrumentId, Layer } from '../../lib/music';
import { songs, songDuration, validateLibrary } from '../../lib/songs';
import type { PresetSong } from '../../lib/songs';
import { defaultSession, instruments, presetPitch, getInstrument, quantizeBeat, stringPosition } from '../../lib/music';
import { parseSession } from '../../lib/storage';

class Clock implements AudioOutput {
  now = 0;
  calls: { instrument: InstrumentId; pitch: number; options: SoundOptions }[] = [];
  stopped: string[] = [];
  noteOn(instrument: InstrumentId, pitch: number, options: SoundOptions = {}) { this.calls.push({ instrument, pitch, options }); return () => {}; }
  stopGroup(group: string) { this.stopped.push(group); }
}
const song: PresetSong = {
  id: 'test', title: 'Timing fixture', collection: 'Original practice', difficulty: 'Easy', composer: 'Test',
  license: { kind: 'original', attribution: 'Test fixture' },
  notes: [{ pitch: 60, startTime: 0, duration: 2, velocity: 0.7 }, { pitch: 64, startTime: 2.5, duration: 1, velocity: 0.5 }],
};
afterEach(() => vi.useRealTimers());
function setup() { vi.useFakeTimers(); const clock = new Clock(); return { clock, player: new SongPlayer(clock, song, 'keyboard') }; }

describe('song transport', () => {
  it('schedules note events on the audio clock and highlights only sounding notes', () => {
    const { clock, player } = setup(); player.play();
    expect(clock.calls[0]).toEqual({ instrument: 'keyboard', pitch: 60, options: { when: 0, duration: 2, velocity: 0.7, group: 'song' } });
    expect(player.snapshot().activeNotes).toEqual([60]);
    clock.now = 2.1; player.tick(); expect(player.snapshot().activeNotes).toEqual([]);
    clock.now = 2.42; player.tick(); expect(clock.calls[1].options.when).toBeCloseTo(2.5);
    player.tick(); expect(clock.calls).toHaveLength(2);
    clock.now = 3.5; player.tick(); expect(player.status).toBe('complete'); expect(player.snapshot().activeNotes).toEqual([]);
  });
  it('freezes score time on pause and resumes a held note for only its remaining duration', () => {
    const { clock, player } = setup(); player.play(); clock.now = 0.75; player.pause();
    expect(clock.stopped).toContain('song'); clock.now = 30; expect(player.position).toBe(0.75);
    player.play(); expect(clock.calls.at(-1)?.options.duration).toBeCloseTo(1.25);
    clock.now = 30.5; expect(player.position).toBeCloseTo(1.25);
  });
  it('changes tempo without jumping score position and reschedules future notes', () => {
    const { clock, player } = setup(); player.play(); clock.now = 0.5; player.setSpeed(0.5);
    expect(player.position).toBe(0.5); expect(clock.calls.at(-1)?.options.duration).toBe(3);
    clock.now = 1.5; expect(player.position).toBe(1);
    player.setSpeed(1.5); expect(player.position).toBe(1);
    clock.now = 2; expect(player.position).toBe(1.75);
    player.pause(); clock.now = 10; player.setSpeed(1); expect(player.position).toBe(1.75);
  });
  it('cancels scheduled notes when changing instrument and preserves the melody position', () => {
    const { clock, player } = setup(); player.play(); clock.now = 0.2; player.setInstrument('bass');
    expect(clock.stopped).toContain('song'); expect(player.position).toBe(0.2);
    expect(clock.calls.at(-1)?.instrument).toBe('bass'); expect(clock.calls.at(-1)?.pitch).toBe(36);
    expect(player.snapshot().activeNotes).toEqual([36]);
  });
  it('resets cleanly on song changes, stop, and restart', () => {
    const { clock, player } = setup(); player.play(); clock.now = 1; player.setSong(songs[1]);
    expect(player.status).toBe('idle'); expect(player.position).toBe(0); expect(clock.stopped).toContain('song');
    player.play(); clock.now = 2; player.restart(); expect(player.position).toBe(0);
    player.stop(); expect(player.snapshot().activeNotes).toEqual([]); expect(player.status).toBe('idle');
  });
  it('practice waits indefinitely, rejects incorrect notes, and advances only on matching input', () => {
    const { clock, player } = setup(); player.setPractice(true); player.play(); clock.now = 60; player.tick();
    expect(clock.calls).toHaveLength(0); expect(player.position).toBe(0); expect(player.snapshot().target).toBe(60);
    expect(player.input(61)).toBe(false); expect(player.snapshot().practiceIndex).toBe(0);
    expect(player.input(60)).toBe(true); expect(player.snapshot().target).toBe(64);
    player.pause(); expect(player.input(64)).toBe(false); player.play();
    expect(player.input(64)).toBe(true); expect(player.status).toBe('complete'); expect(player.snapshot().target).toBeNull();
  });
  it('cancels notes already scheduled in the lookahead on pause', () => {
    const { clock, player } = setup(); player.play(); clock.now = 2.45; player.tick();
    expect(clock.calls.at(-1)?.options.when).toBe(2.5); player.pause(); expect(clock.stopped.at(-1)).toBe('song');
  });
});

describe('loop recording and layering', () => {
  it('quantizes at the wrap boundary', () => { expect(quantizeBeat(7.99)).toBe(0); expect(quantizeBeat(1.13)).toBe(1.25); });
  it('records note duration and schedules the first repeat before the boundary', () => {
    vi.useFakeTimers(); const clock = new Clock(); const looper = new Looper(clock); let recorded: Layer | undefined;
    looper.record('violin', 60, layer => { recorded = layer; looper.setLayers([layer]); });
    looper.noteDown('a', 60); clock.now = 0.8; looper.noteUp('a');
    clock.now = 7.92; looper.tick(); expect(clock.calls.at(-1)?.options.when).toBe(8);
    clock.now = 8.01; looper.tick(); expect(recorded?.events[0].duration).toBeCloseTo(0.8);
    expect(clock.calls.filter(c => c.options.when === 8)).toHaveLength(1); looper.stop();
  });
  it('queues an overdub at the next cycle and ignores notes before it', () => {
    vi.useFakeTimers(); const clock = new Clock(); const looper = new Looper(clock); let recorded: Layer | undefined;
    looper.start(60); clock.now = 2; looper.record('guitar', 60, l => { recorded = l; });
    expect(looper.recordState).toBe('waiting'); looper.noteDown('early', 50);
    clock.now = 8; expect(looper.recordState).toBe('recording'); looper.noteDown('good', 52);
    clock.now = 8.4; looper.noteUp('good'); clock.now = 16; looper.tick();
    expect(recorded?.events.map(e => e.note)).toEqual([52]); looper.stop();
  });
  it('mutes only the relevant layer and cancels unfinished takes', () => {
    vi.useFakeTimers(); const clock = new Clock(); const looper = new Looper(clock);
    const layer: Layer = { id: 'one', name: 'Test', instrument: 'keyboard', muted: false, events: [{ note: 60, beat: 0, velocity: 0.5, duration: 1 }] };
    looper.setLayers([layer]); looper.start(96); looper.setLayers([{ ...layer, muted: true }]);
    expect(clock.stopped).toContain('loop:one');
    const finish = vi.fn(); looper.record('bass', 96, finish); looper.cancelRecording(); clock.now = 100; looper.tick();
    expect(finish).not.toHaveBeenCalled(); looper.stop(); expect(looper.playing).toBe(false);
  });
});

describe('note data and storage', () => {
  it('bundles exactly four original film-inspired songs with rights labels', () => {
    const originals = songs.filter(s => s.collection === 'Original film-inspired'); expect(originals).toHaveLength(4);
    expect(originals.every(s => s.license.kind === 'original')).toBe(true);
    expect(songs.filter(s => s.collection === 'Bollywood')).toHaveLength(0);
  });
  it('rejects malformed events and unlicensed Bollywood records', () => {
    expect(() => validateLibrary({ version: 1, songs: [{ ...song, collection: 'Bollywood' }] })).toThrow(/license/);
    expect(() => validateLibrary({ version: 1, songs: [{ ...song, notes: [{ pitch: 60, startTime: 0, duration: -1, velocity: 1 }] }] })).toThrow(/note/);
    expect(() => validateLibrary({ version: 1, songs: [{ ...song, notes: [...song.notes].reverse() }] })).toThrow(/note/);
  });
  it('accepts properly attributed licensed Bollywood data', () => {
    const library = validateLibrary({ version: 1, songs: [{ ...song, collection: 'Bollywood', license: { kind: 'licensed', attribution: 'Used with written permission', source: 'rights/permission.pdf' } }] });
    expect(library.songs[0].collection).toBe('Bollywood');
  });
  it('rejects corrupt and duplicate-ID sessions without crashing', () => {
    expect(parseSession('bad')).toEqual(defaultSession); expect(parseSession('{"version":2}')).toEqual(defaultSession);
    const layer = { id: 'one', name: 'Test', instrument: 'bass', events: [], muted: false };
    expect(parseSession(JSON.stringify({ ...defaultSession, layers: [layer, layer] })).layers).toEqual([]);
    expect(parseSession(JSON.stringify({ ...defaultSession, name: 'Kept idea' })).name).toBe('Kept idea');
  });
  it('maps every string pitch to a real fret and keeps hints unique', () => {
    expect(stringPosition(getInstrument('guitar'), 60)).toEqual({ index: 4, fret: 1 });
    expect(stringPosition(getInstrument('bass'), 36)).toEqual({ index: 1, fret: 3 });
    for (const id of ['guitar', 'bass', 'violin', 'xylophone', 'keyboard'] as const) {
      const config = getInstrument(id); expect(config.notes.length).toBe(config.shortcuts.length);
      expect(new Set(config.shortcuts).size).toBe(config.shortcuts.length);
    }
  });
});

// Exercise every bundled melody across every available voice, including drum interpretation.
describe('complete preset performances', () => {
  it.each(songs.flatMap(song => instruments.map(instrument => ({ song, instrument, label: `${song.title} / ${instrument.name}` }))))('$label plays every event once with matching highlights', ({ song, instrument }) => {
    vi.useFakeTimers(); const clock = new Clock(); const player = new SongPlayer(clock, song, instrument.id);
    player.play();
    for (let time = 0; time < songDuration(song); time += 0.025) {
      clock.now = time; player.tick();
      expect(player.snapshot().activeNotes).toEqual(song.notes.filter(n => n.startTime <= time && n.startTime + n.duration > time).map(n => presetPitch(instrument.id, n.pitch)));
    }
    expect(clock.calls).toHaveLength(song.notes.length);
    clock.calls.forEach((call, i) => {
      expect(call.instrument).toBe(instrument.id); expect(call.pitch).toBe(presetPitch(instrument.id, song.notes[i].pitch));
      expect(call.options.when).toBeCloseTo(song.notes[i].startTime);
      expect(call.options.duration).toBeCloseTo(song.notes[i].duration);
    });
    clock.now = songDuration(song); player.tick(); expect(player.status).toBe('complete');
    expect(player.snapshot().activeNotes).toEqual([]); player.stop(); expect(player.position).toBe(0);
  });
});
