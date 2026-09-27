// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { songs, songDuration } from '../../lib/songs';
import { FakeAudioContext } from './audio-mock';

class TestPointerEvent extends MouseEvent {
  pointerType: string; pointerId: number;
  constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerType = init.pointerType ?? 'mouse'; this.pointerId = init.pointerId ?? 1; }
}
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(0); localStorage.clear(); FakeAudioContext.instances = [];
  vi.stubGlobal('AudioContext', FakeAudioContext); vi.stubGlobal('PointerEvent', TestPointerEvent);
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  HTMLElement.prototype.setPointerCapture = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
async function gesture(action: () => void) { await act(async () => { action(); await Promise.resolve(); }); }
function context() { return FakeAudioContext.instances[0]; }

describe('instrument inputs', () => {
  it('does not initialize audio on mount or hover before permission gesture', async () => {
    render(<App />); const note = screen.getByTestId('note-0');
    await gesture(() => fireEvent.pointerEnter(note, { pointerType: 'mouse' }));
    expect(FakeAudioContext.instances).toHaveLength(0);
    await gesture(() => fireEvent.click(screen.getByRole('button', { name: /Enable sound/ })));
    await gesture(() => fireEvent.pointerEnter(note, { pointerType: 'mouse' }));
    expect(context().sources.length).toBeGreaterThan(0); expect(note.className).toContain('sounding');
  });
  it.each(['Guitar', 'Bass', 'Violin', 'Xylophone', 'Keyboard', 'Drums'])('%s plays from pointer and keyboard with visible feedback', async name => {
    render(<App />); await gesture(() => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}$`) })));
    const note = screen.getByTestId('note-0');
    await gesture(() => fireEvent.pointerDown(note, { pointerType: 'touch', pointerId: 3, button: 0 }));
    expect(context().sources.length).toBeGreaterThan(0); expect(note.className).toContain('sounding');
    await gesture(() => fireEvent.pointerUp(note, { pointerType: 'touch', pointerId: 3 }));
    if (['Violin', 'Keyboard'].includes(name)) expect(note.className).not.toContain('sounding');
    const count = context().sources.length;
    await gesture(() => fireEvent.keyDown(document.body, { key: 'a' })); expect(context().sources.length).toBeGreaterThan(count);
    await gesture(() => fireEvent.keyUp(document.body, { key: 'a' }));
  });
  it('holds violin on hover and releases on leave, instrument switch, and pointer cancellation', async () => {
    render(<App />); await gesture(() => fireEvent.click(screen.getByRole('button', { name: /^Violin$/ })));
    await gesture(() => fireEvent.click(screen.getByRole('button', { name: /Enable sound/ })));
    const note = screen.getByTestId('note-0');
    await gesture(() => fireEvent.pointerEnter(note, { pointerType: 'mouse' })); expect(note.className).toContain('sounding');
    await gesture(() => fireEvent.pointerLeave(note, { pointerType: 'mouse' })); expect(note.className).not.toContain('sounding');
    await gesture(() => fireEvent.pointerDown(note, { pointerType: 'touch', pointerId: 4, button: 0 }));
    await gesture(() => fireEvent.pointerCancel(note, { pointerType: 'touch', pointerId: 4 })); expect(note.className).not.toContain('sounding');
    await gesture(() => fireEvent.keyDown(document.body, { key: 'a' }));
    const sources = [...context().sources];
    await gesture(() => fireEvent.click(screen.getByRole('button', { name: /^Bass$/ })));
    expect(sources.every(source => source.stop.mock.calls.at(-1)![0] < 1)).toBe(true);
    expect(document.querySelectorAll('.sounding')).toHaveLength(0);
  });
  it('strums six guitar and four bass strings with their correct pitches', async () => {
    render(<App />); await gesture(() => fireEvent.click(screen.getByRole('button', { name: 'Strum ↓' })));
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(context().sources).toHaveLength(18);
    await gesture(() => fireEvent.click(screen.getByRole('button', { name: /^Bass$/ })));
    const count = context().sources.length;
    await gesture(() => fireEvent.keyDown(document.body, { key: 'ArrowDown' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(context().sources.length - count).toBe(8);
  });
  it('does not play shortcuts while typing in session fields, and stops on page hide', async () => {
    render(<App />); await gesture(() => fireEvent.keyDown(screen.getByLabelText('Session name'), { key: 'a' }));
    expect(FakeAudioContext.instances).toHaveLength(0);
    await gesture(() => fireEvent.click(screen.getByRole('button', { name: /^Keyboard$/ })));
    await gesture(() => fireEvent.keyDown(document.body, { key: 'a' }));
    await gesture(() => fireEvent(window, new Event('pagehide')));
    expect(document.querySelectorAll('.sounding')).toHaveLength(0);
    expect(context().sources.every(source => source.stop.mock.calls.at(-1)![0] < 1)).toBe(true);
  });
});

describe('original songbook UI', () => {
  it.each(songs.filter(s => s.collection === 'Original film-inspired'))('$title plays, pauses, resumes, finishes, restarts and stops', async song => {
    render(<App />);
    expect(screen.queryByText(/note data needed/i)).toBeNull();
    await gesture(() => fireEvent.click(screen.getByRole('button', { name: /^Keyboard$/ })));
    await gesture(() => fireEvent.change(screen.getByLabelText('PRESET SONG'), { target: { value: song.id } }));
    await gesture(() => fireEvent.click(screen.getByRole('button', { name: 'Play Preset Song' })));
    expect(document.querySelectorAll('.song-note').length).toBeGreaterThan(0);
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    await gesture(() => fireEvent.click(screen.getByRole('button', { name: 'Pause preset song' })));
    const paused = screen.getByRole('progressbar').getAttribute('aria-valuenow');
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(paused);
    expect(document.querySelectorAll('.song-note')).toHaveLength(0);
    await gesture(() => fireEvent.change(screen.getByLabelText('Song tempo multiplier'), { target: { value: '1.5' } }));
    await gesture(() => fireEvent.click(screen.getByRole('button', { name: 'Resume preset song' })));
    await act(async () => { await vi.advanceTimersByTimeAsync(songDuration(song) / 1.5 * 1000 + 200); });
    expect(screen.getByText('Nicely played. Again?')).toBeTruthy();
    expect(Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'))).toBe(songDuration(song));
    await gesture(() => fireEvent.click(screen.getByRole('button', { name: 'Restart preset song' })));
    expect(document.querySelectorAll('.song-note').length).toBeGreaterThan(0);
    await gesture(() => fireEvent.click(screen.getByRole('button', { name: 'Stop preset song' })));
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    expect(document.querySelectorAll('.song-note')).toHaveLength(0);
  });
});
