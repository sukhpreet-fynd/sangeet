import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Synth } from '../synth';
import { FakeAudioContext } from './audio-mock';
import { instruments } from '../../lib/music';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0); FakeAudioContext.instances = []; vi.stubGlobal('AudioContext', FakeAudioContext); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('synthesized voices', () => {
  it('does not initialize audio until explicitly unlocked by a gesture', async () => {
    const synth = new Synth(); synth.setVolume(0.4); synth.noteOn('guitar', 60);
    expect(FakeAudioContext.instances).toHaveLength(0);
    await synth.unlock(); expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].resume).toHaveBeenCalledTimes(1);
    await synth.unlock(); expect(FakeAudioContext.instances).toHaveLength(1);
  });
  it.each(instruments.filter(i => i.id !== 'drums'))('$name creates tuned oscillators and releases all resources', async instrument => {
    const synth = new Synth(); await synth.unlock();
    const release = synth.noteOn(instrument.id, 69); const context = FakeAudioContext.instances[0];
    expect(context.sources[0].frequency.value).toBe(440); expect(synth.activeVoices).toBe(1);
    if (instrument.sustained) expect(context.sources[0].stop.mock.calls[0][0]).toBeGreaterThan(100);
    else expect(context.sources[0].stop.mock.calls[0][0]).toBeLessThan(2);
    release(); vi.advanceTimersByTime(100); expect(synth.activeVoices).toBe(0);
    expect(context.sources.every(source => source.disconnect.mock.calls.length > 0)).toBe(true);
  });
  it.each([36, 38, 42, 46, 45, 48, 49, 51])('drum %i generates a percussive voice and cleans up', async pitch => {
    const synth = new Synth(); await synth.unlock();
    synth.noteOn('drums', pitch); expect(synth.activeVoices).toBe(1);
    expect(FakeAudioContext.instances[0].sources.length).toBeGreaterThan(0);
    vi.advanceTimersByTime(1400); expect(synth.activeVoices).toBe(0);
    expect(FakeAudioContext.instances[0].sources.every(source => source.disconnect.mock.calls.length > 0)).toBe(true);
  });
  it('cancels notes scheduled in the future before they become audible', async () => {
    const synth = new Synth(); await synth.unlock(); synth.noteOn('violin', 60, { when: 0.1, group: 'song' });
    synth.stopGroup('song'); const context = FakeAudioContext.instances[0];
    expect(context.sources[0].stop.mock.calls.at(-1)?.[0]).toBeCloseTo(0.065);
    expect(context.gains[1].gain.setValueAtTime).toHaveBeenLastCalledWith(0, 0);
    vi.advanceTimersByTime(100); expect(synth.activeVoices).toBe(0);
  });
  it('bounds polyphony and isolates song voices from live voices', async () => {
    const synth = new Synth(); await synth.unlock();
    for (let i = 0; i < 70; i++) synth.noteOn('keyboard', 60 + i % 12, { group: 'live' });
    expect(synth.activeVoices).toBe(64);
    synth.noteOn('keyboard', 65, { group: 'song' }); synth.stopGroup('song'); vi.advanceTimersByTime(100);
    expect(synth.activeVoices).toBe(63); synth.stopAll(); vi.advanceTimersByTime(100); expect(synth.activeVoices).toBe(0);
  });
});
