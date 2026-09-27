import { Circle, CircleStop, Layers, Play, Plus, Square, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { instruments, LOOP_BEATS } from '../lib/music';
import type { Layer } from '../lib/music';

export function LoopStation({ layers, playing, position, recordState, onPlay, onRecord, onCancel, onMute, onDelete, onDemo }: {
  layers: Layer[]; playing: boolean; position: number; recordState: 'idle' | 'waiting' | 'recording';
  onPlay: () => void; onRecord: () => void; onCancel: () => void; onMute: (id: string) => void; onDelete: (id: string) => void; onDemo: () => void;
}) {
  const recording = recordState !== 'idle';
  return <section className="loop-station" aria-labelledby="loop-title">
    <div className="loop-heading"><div className="loop-title"><span className="loop-icon"><Layers size={18} /></span><div><h2 id="loop-title">A little on repeat</h2><p>Capture an idea. Give it some company.</p></div></div><span className="loop-length">2 bars <span>·</span> 4/4 <span>·</span> {layers.length}/8 layers</span></div>
    <div className="timeline-ruler"><span>YOUR LAYERS</span><div>{Array.from({ length: LOOP_BEATS }, (_, i) => <span key={i} className={playing && Math.floor(position) === i ? 'beat-current' : ''}>{i % 4 + 1}{i === 0 || i === 4 ? <small> / {i === 0 ? '01' : '02'}</small> : ''}</span>)}</div><span /></div>
    <div className={`layer-list ${layers.length === 0 ? 'is-empty' : ''}`}>
      {layers.length === 0 ? <div className="empty-layers"><div className="empty-wave" aria-hidden="true">{[12, 23, 36, 18, 28, 43, 24, 14, 31, 19, 10].map((h, i) => <i key={i} style={{ height: h }} />)}</div><div><strong>Your first loop starts with a note.</strong><p>Hit record, play for 2 bars, and we’ll keep it going.</p></div><button className="text-button" onClick={onDemo} disabled={recording}>Try a little inspiration <span>↗</span></button></div> : layers.map((layer, index) => {
        const instrument = instruments.find(i => i.id === layer.instrument)!;
        return <div className={`layer-row ${layer.muted ? 'muted' : ''}`} key={layer.id}>
          <div className="layer-name"><span className="layer-dot" style={{ background: instrument.color }}>{String(index + 1).padStart(2, '0')}</span><div><strong>{layer.name}</strong><small>{instrument.name}</small></div></div>
          <div className="layer-sequence" aria-label={`${layer.events.length} notes in a two-bar loop`}>
            {Array.from({ length: 8 }, (_, i) => <div className="grid-line" key={i} style={{ left: `${i * 12.5}%` }} />)}
            {layer.events.map((event, i) => <span className="sequence-note" key={i} style={{ left: `${event.beat / LOOP_BEATS * 100}%`, top: `${18 + (event.note % 5) * 7}%`, background: instrument.color }} />)}
            {playing && <span className="playhead" style={{ left: `${position / LOOP_BEATS * 100}%` }} />}
          </div>
          <div className="layer-actions"><button className="icon-button" aria-label={`${layer.muted ? 'Unmute' : 'Mute'} ${layer.name}`} aria-pressed={layer.muted} onClick={() => onMute(layer.id)}>{layer.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button><button className="icon-button delete-button" aria-label={`Delete ${layer.name}`} onClick={() => onDelete(layer.id)}><Trash2 size={15} /></button></div>
        </div>;
      })}
    </div>
    <div className="transport"><div className="transport-buttons"><button className={`record-button ${recording ? 'is-recording' : ''}`} onClick={recording ? onCancel : onRecord} disabled={!recording && layers.length >= 8}>{recording ? <CircleStop size={15} /> : <Circle size={12} fill="currentColor" />}{recordState === 'waiting' ? 'Cancel queued take' : recordState === 'recording' ? 'Cancel take' : 'Record a layer'}</button><button className="play-button" onClick={onPlay} disabled={!playing && layers.length === 0}>{playing ? <Square size={13} fill="currentColor" /> : <Play size={14} fill="currentColor" />}{playing ? 'Stop' : 'Play loops'}</button></div><div className="transport-status"><span className={`small-dot ${recording ? 'record-dot' : playing ? 'playing-dot' : ''}`} />{recordState === 'waiting' ? 'Your take starts at the next loop' : recordState === 'recording' ? 'Recording · play your notes' : playing ? 'Room in motion' : 'Ready when you are'}{playing && <span className="beat-counter">{Math.floor(position / 4) + 1}.{Math.floor(position % 4) + 1}</span>}</div><span className="quantize-label">{recording ? <X size={13} /> : <Plus size={13} />} {recording ? 'Esc to stop' : '1/16 note snap'}</span></div>
  </section>;
}
