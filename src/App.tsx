import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, AudioLines, Check, CircleHelp, Headphones, Pencil, SlidersHorizontal, Volume2 } from 'lucide-react';
import { InstrumentPicker } from './components/InstrumentPicker';
import { PlaySurface } from './components/PlaySurface';
const LoopStation = lazy(() => import('./components/LoopStation').then(module => ({ default: module.LoopStation })));
import { PresetPlayer } from './components/PresetPlayer';
const Guide = lazy(() => import('./components/Guide').then(module => ({ default: module.Guide })));
import { NameModal } from './components/NameModal';
import { LikeButton } from './components/LikeButton';
import { useRoom } from './hooks/useRoom';
import { getInstrument } from './lib/music';

const NAME_KEY = 'raagroom.userName';
const LIKED_KEY = 'raagroom.liked';

export default function App() {
  const room = useRoom();
  const [guide, setGuide] = useState(false);
  const [hover, setHover] = useState(true);
  const [showLoops, setShowLoops] = useState(false);
  const [userName, setUserName] = useState<string | null>(() => {
    try { return localStorage.getItem(NAME_KEY); } catch { return null; }
  });
  const [greeting, setGreeting] = useState<string | null>(null);
  const [liked, setLiked] = useState<boolean>(() => {
    try { return localStorage.getItem(LIKED_KEY) === '1'; } catch { return false; }
  });
  const handleName = (name: string) => {
    try { localStorage.setItem(NAME_KEY, name); } catch {}
    setUserName(name);
    setGreeting(`Hi ${name} — welcome to your little corner.`);
    window.setTimeout(() => setGreeting(null), 4200);
  };
  const handleLiked = () => {
    setLiked(true);
    try { localStorage.setItem(LIKED_KEY, '1'); } catch {}
  };
  const loopsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setShowLoops(true); observer.disconnect(); }
    }, { rootMargin: '300px' });
    if (loopsRef.current) observer.observe(loopsRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { room.stop(); return; }
      if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey || guide) return;
      if (event.target instanceof Element && event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
      if (event.key === ' ' && room.practice && room.songState.target !== null) { event.preventDefault(); room.targetDown(); return; }
      const config = getInstrument(room.instrument);
      if (['guitar', 'bass'].includes(config.id) && ['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); void room.strum(event.key === 'ArrowUp'); return; }
      const index = config.shortcuts.indexOf(event.key.toLowerCase());
      if (index >= 0) { event.preventDefault(); void room.down(config.notes[index] + (['guitar', 'bass'].includes(config.id) ? room.fret : config.id === 'drums' ? 0 : room.octave * 12), `key:${event.key.toLowerCase()}`); }
    };
    const keyup = (event: KeyboardEvent) => { room.up(`key:${event.key.toLowerCase()}`); if (event.key === ' ') room.targetUp(); };
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup);
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); };
  }, [room, guide]);
  const { session } = room;
  return <>
    <a className="skip-link" href="#play-room">Skip to instruments</a>
    <header className="site-header"><a href="./" className="brand" aria-label="Raagroom home"><span className="brand-symbol"><AudioLines size={24} strokeWidth={2} /></span>raagroom<span className="brand-period">.</span></a><nav className="main-nav" aria-label="Main navigation"><a href="#play-room">Play</a><a href="#songbook">Songbook</a><a href="#loops">Loops</a></nav><div className="header-actions"><span className="local-badge"><span className="small-dot" /> YOUR OWN LITTLE SPACE</span><button className="guide-button" onClick={() => { room.releaseAll(); setGuide(true); }}><CircleHelp size={16} /> Quick guide</button></div></header>
    <main>
      <section className="welcome"><span className="creator-watermark" aria-hidden="true">SUKHPREET</span><div className="welcome-content"><div className="welcome-eyebrow"><span className="mini-line" /> {userName ? `HELLO, ${userName.toUpperCase()}` : 'YOUR LITTLE CORNER OF SOUND'}</div><h1>A little play.<span> A world of sound.</span></h1><p>Hover, touch, or use your keys. Six instruments, one space to make something yours.</p>{userName && <div className="welcome-like"><LikeButton name={userName} initiallyLiked={liked} onLiked={handleLiked} /></div>}</div><div className="headphone-note"><Headphones size={23} strokeWidth={1.3} /><span>A little better<br />with headphones.</span><span className="note-spark">✳</span></div></section>
      <div className="session-bar"><div className="session-name"><span className="session-marker" /><input aria-label="Session name" maxLength={80} value={session.name} onChange={e => room.updateSession(s => ({ ...s, name: e.target.value }))} /><Pencil size={11} aria-hidden="true" /><span className="save-status"><Check size={12} />{room.saved ? 'Saved on this device' : 'Saving unavailable · export to keep'}</span></div><button className="export-button" onClick={room.exportSession}><ArrowDownToLine size={15} /> Export session</button></div>
      <div className="studio" id="play-room" tabIndex={-1}><InstrumentPicker selected={room.instrument} onSelect={room.selectInstrument} locked={room.recordState !== 'idle'} /><div className="workspace"><PlaySurface hover={hover} audioReady={room.ready} onHover={() => { room.releaseAll(); setHover(!hover); }} instrument={room.instrument} active={room.active} highlighted={room.songState.activeNotes} target={room.songState.target} fret={room.fret} octave={room.octave} onFret={v => room.setMapping(v, 'fret')} onOctave={v => room.setMapping(v, 'octave')} onDown={(p, t) => void room.down(p, t)} onUp={room.up} onStrum={v => void room.strum(v)} locked={room.recordState !== 'idle'} /><div className="mixer-bar"><div className="mixer-group"><SlidersHorizontal size={15} /><label className="tempo-control">Loop tempo <input type="number" aria-label="Loop tempo in beats per minute" min={50} max={160} value={session.bpm} disabled={room.playing} onChange={e => room.updateSession(s => ({ ...s, bpm: Math.min(160, Math.max(50, Number(e.target.value) || 50)) }))} /><span>BPM</span></label><span className="control-separator" /><button className={`metronome-button ${room.metronome ? 'enabled' : ''}`} aria-pressed={room.metronome} onClick={() => room.setMetronome(!room.metronome)}><span className="metronome-icon">♩</span>Click track<span className="toggle-track"><span /></span></button></div><div className="volume-control"><Volume2 size={16} /><label className="sr-only" htmlFor="volume">Master volume</label><input id="volume" type="range" min="0" max="1" step="0.01" value={session.volume} onChange={e => room.updateSession(s => ({ ...s, volume: Number(e.target.value) }))} /><span>{Math.round(session.volume * 100)}%</span></div></div></div></div>
      <div id="songbook"><PresetPlayer instrument={room.instrument} song={room.song} state={room.songState} speed={room.speed} practice={room.practice} onSong={room.selectSong} onPlay={() => void room.playSong()} onPause={room.pauseSong} onStop={room.stopSong} onRestart={() => void room.restartSong()} onSpeed={room.setSpeed} onPractice={room.setPractice} onTargetDown={room.targetDown} onTargetUp={room.targetUp} /></div>
      <div ref={loopsRef} id="loops">{showLoops ? <Suspense fallback={<div className="section-placeholder">Opening your loop station…</div>}><LoopStation layers={session.layers} playing={room.playing} position={room.position} recordState={room.recordState} onPlay={room.toggleLoops} onRecord={() => void room.record()} onCancel={room.cancelRecord} onMute={id => room.updateSession(s => ({ ...s, layers: s.layers.map(l => l.id === id ? { ...l, muted: !l.muted } : l) }))} onDelete={id => room.updateSession(s => ({ ...s, layers: s.layers.filter(l => l.id !== id) }))} onDemo={() => void room.demo()} /></Suspense> : <div className="section-placeholder" aria-label="Loop station loading" />}</div>
      <footer><span><span className="footer-flower">✳</span> MADE FOR THE JOY OF MAKING.</span><span>Nothing to get right. Something to make your own.</span><span>MADE BY SUKHPREET SINGH LOHIYA</span></footer>
    </main>
    {!room.ready && <div className="audio-banner"><span><Headphones size={15} /> Enable sound, then hover, tap, or play your keys.</span><button onClick={() => void room.enable()}>Enable sound <span>↗</span></button></div>}
    <div className={`announcement ${room.message ? 'has-message' : ''}`} role="status" aria-live="polite">{room.message}</div>
    {guide && <Suspense fallback={<div className="loading-toast" role="status">Opening guide…</div>}><Guide onClose={() => setGuide(false)} /></Suspense>}
    {!userName && <NameModal onSubmit={handleName} />}
    {greeting && <div className="greeting-toast" role="status" aria-live="polite">{greeting}</div>}
  </>;
}
