import { useRef } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { ArrowDown, ArrowUp, Keyboard, Sparkles } from 'lucide-react';
import { getInstrument, instrumentNoteName, noteName, stringPosition } from '../lib/music';
import type { InstrumentId } from '../lib/music';
import { InstrumentArt } from './InstrumentArt';

export function PlaySurface({ instrument, active, highlighted, target, fret, octave, onFret, onOctave, onDown, onUp, onStrum, locked, hover, audioReady, onHover }: {
  instrument: InstrumentId; active: Set<number>; highlighted: number[]; target: number | null; fret: number; octave: number;
  onFret: (value: number) => void; onOctave: (value: number) => void;
  onDown: (pitch: number, token: string) => void; onUp: (token: string) => void; onStrum: (up: boolean) => void; locked: boolean; hover: boolean; audioReady: boolean; onHover: () => void;
}) {
  const current = getInstrument(instrument);
  const strings = instrument === 'guitar' || instrument === 'bass';
  const pitches = current.notes.map(n => n + (strings ? fret : instrument === 'drums' ? 0 : octave * 12));
  const pointerNotes = useRef(new Map<number, number>());
  const root = useRef<HTMLDivElement>(null);
  const positions = highlighted.map(pitch => stringPosition(current, pitch)).filter(p => p !== null);
  const pointerDown = (event: PointerEvent<HTMLButtonElement>, pitch: number) => {
    if (event.button !== 0) return;
    onUp(`hover:${pitch}`);
    event.preventDefault(); event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId); pointerNotes.current.set(event.pointerId, pitch);
    onDown(pitch, `pointer:${event.pointerId}`);
  };
  const pointerUp = (event: PointerEvent<HTMLButtonElement>) => { pointerNotes.current.delete(event.pointerId); onUp(`pointer:${event.pointerId}`); };
  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!strings || !pointerNotes.current.has(event.pointerId)) return;
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLButtonElement>('button[data-pitch]');
    if (!element || !root.current?.contains(element)) return;
    const pitch = Number(element.dataset.pitch);
    if (pointerNotes.current.get(event.pointerId) !== pitch) {
      onUp(`pointer:${event.pointerId}`); onDown(pitch, `pointer:${event.pointerId}`); pointerNotes.current.set(event.pointerId, pitch);
    }
  };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>, pitch: number) => {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) { event.preventDefault(); onDown(pitch, `button:${pitch}`); }
  };
  const keyUp = (event: KeyboardEvent<HTMLButtonElement>, pitch: number) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onUp(`button:${pitch}`); }
  };
  let whiteIndex = -1;
  return <section className={`play-surface surface-${instrument}`} style={{ '--instrument-color': current.color } as CSSProperties} aria-labelledby="instrument-title">
    <div className="surface-topline"><span><span className="small-dot" /> THE PLAY ROOM</span><span>01 — EXPLORE</span></div>
    <div className="instrument-heading"><div><p className="eyebrow">{current.family} / CURIOSITY ENCOURAGED</p><h2 id="instrument-title">{current.name}<span>✳</span></h2><p className="instrument-description">{current.description}</p></div><div className="orbit-mark" aria-hidden="true"><Sparkles size={28} strokeWidth={1} /></div></div>
    <div className="sound-settings"><span className="sound-chip"><span className="small-dot" /> {current.sustained ? 'Hold to sustain' : strings ? 'Pluck & strum' : 'Tap to play'}</span>{instrument !== 'drums' && <label className="root-control">{strings ? 'Fret' : 'Octave'} <select aria-label={strings ? 'Fret' : 'Octave shift'} value={strings ? fret : octave} disabled={locked} onChange={e => strings ? onFret(Number(e.target.value)) : onOctave(Number(e.target.value))}>{strings ? Array.from({ length: 25 }, (_, i) => <option key={i} value={i}>{i === 0 ? 'Open' : i}</option>) : [-2, -1, 0, 1, 2].map(n => <option key={n} value={n}>{n > 0 ? '+' : ''}{n}</option>)}</select></label>}<button className={`hover-control ${hover ? 'enabled' : ''}`} aria-pressed={hover} onClick={onHover}>Hover play <span className="toggle-track"><span /></span></button><span className="tuning-label">{instrument === 'drums' ? '8-piece kit · presets become rhythms' : strings ? 'Standard tuning' : instrument === 'keyboard' ? 'Chromatic · 13 keys' : 'C major · 8 notes'}</span></div>
    <div ref={root} className={`instrument-stage ${strings ? 'strings-stage' : ''} ${instrument === 'violin' ? 'violin-stage' : ''} ${instrument === 'keyboard' ? 'keyboard-stage' : ''} ${instrument === 'xylophone' ? 'xylophone-stage' : ''} ${instrument === 'drums' ? 'drums-stage' : ''}`} role="group" aria-label={`${current.name} playable notes`}>
      <InstrumentArt instrument={instrument} active={active.size > 0 || highlighted.length > 0} />
      <div className={`playable-notes ${strings ? 'string-notes' : ''}`}>
        {pitches.map((pitch, index) => {
          const black = instrument === 'keyboard' && [1, 3, 6, 8, 10].includes(pitch % 12);
          if (!black) whiteIndex++;
          const lit = highlighted.includes(pitch) || (strings && positions.some(p => p!.index === index));
          return <button key={`${instrument}-${index}`} data-pitch={pitch} data-testid={`note-${index}`} aria-label={`Play ${instrumentNoteName(instrument, pitch)}, keyboard ${current.shortcuts[index].toUpperCase()}`} aria-keyshortcuts={current.shortcuts[index].toUpperCase()} className={`note-pad ${instrument === 'drums' ? `drum-${pitch}` : ''} ${black ? 'black-key' : ''} ${active.has(pitch) ? 'sounding' : ''} ${lit ? 'song-note' : ''}`} style={{ '--pad-index': index, '--pad-height': `${186 - index * 10}px`, '--key-left': `${(whiteIndex + 0.68) * 12.5}%` } as CSSProperties}
            onPointerEnter={e => { if (hover && audioReady && e.pointerType === 'mouse' && e.buttons === 0) onDown(pitch, `hover:${pitch}`); }} onPointerLeave={() => onUp(`hover:${pitch}`)}
            onPointerDown={e => pointerDown(e, pitch)} onPointerUp={pointerUp} onPointerCancel={pointerUp} onLostPointerCapture={pointerUp} onPointerMove={pointerMove}
            onKeyDown={e => keyDown(e, pitch)} onKeyUp={e => keyUp(e, pitch)} onBlur={() => onUp(`button:${pitch}`)}
            onClick={e => { if (e.detail === 0 && !active.has(pitch)) { onDown(pitch, `accessible:${pitch}`); setTimeout(() => onUp(`accessible:${pitch}`), 250); } }}>
            <span className="pad-note">{instrumentNoteName(instrument, pitch)}</span><span className="pad-string" aria-hidden="true" /><span className="pad-pin" aria-hidden="true" /><kbd>{current.shortcuts[index].toUpperCase()}</kbd>
          </button>;
        })}
      </div>
    </div>
    {strings && <div className="touch-string-controls" aria-label="Large string controls">{pitches.map((pitch, index) => <button key={pitch} className={active.has(pitch) ? 'sounding' : ''} onPointerDown={e => pointerDown(e, pitch)} onPointerUp={pointerUp} onPointerCancel={pointerUp} onLostPointerCapture={pointerUp} onKeyDown={e => keyDown(e, pitch)} onKeyUp={e => keyUp(e, pitch)} aria-label={`Pluck ${noteName(pitch)} string`}><span>{noteName(pitch)}</span><kbd>{current.shortcuts[index].toUpperCase()}</kbd></button>)}</div>}
    <div className="surface-bottom"><span className="shortcut-line"><Keyboard size={15} />{current.shortcuts.map(k => <kbd key={k}>{k.toUpperCase()}</kbd>)}</span>{strings ? <div className="strum-buttons"><button onClick={() => onStrum(false)}><ArrowDown size={14} /> Strum <kbd>↓</kbd></button><button aria-label="Strum up" onClick={() => onStrum(true)}><ArrowUp size={14} /><kbd>↑</kbd></button></div> : <span className="surface-hint">{current.hint}</span>}</div>
    {highlighted.length > 0 && <div className="note-readout">{target === null ? 'Now playing' : 'Your next note'} <strong>{highlighted.map(pitch => instrumentNoteName(instrument, pitch)).join(' + ')}</strong>{strings && positions[0] && <span>String {positions[0].index + 1} · fret {positions[0].fret}</span>}</div>}
  </section>;
}
