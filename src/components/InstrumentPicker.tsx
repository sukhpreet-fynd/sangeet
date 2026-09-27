import { AudioLines, Guitar, Piano, Waves, Music2, Drum } from 'lucide-react';
import { instruments } from '../lib/music';
import type { InstrumentId } from '../lib/music';

const icons = { guitar: Guitar, bass: Waves, violin: Music2, xylophone: AudioLines, keyboard: Piano, drums: Drum };
export function InstrumentPicker({ selected, onSelect, locked }: { selected: InstrumentId; onSelect: (id: InstrumentId) => void; locked: boolean }) {
  return <aside className="instrument-rail" aria-label="Instrument selection">
    <div className="rail-label"><span>YOUR SOUNDS</span><span>06</span></div>
    <div className="instrument-options">{instruments.map((instrument, index) => {
      const Icon = icons[instrument.id];
      return <button key={instrument.id} className={`instrument-option ${selected === instrument.id ? 'selected' : ''}`} aria-label={instrument.name} aria-pressed={selected === instrument.id} disabled={locked} onClick={() => onSelect(instrument.id)}>
        <span className="instrument-icon" style={{ background: instrument.color }}><Icon size={23} strokeWidth={1.5} /></span>
        <span className="instrument-copy"><strong>{instrument.name}</strong><small>{instrument.family}</small></span>
        <span className="instrument-number">0{index + 1}</span>
      </button>;
    })}</div>
    <div className="rail-note"><span className="tiny-spark">✳</span><p>No wrong notes.<br />Just new directions.</p></div>
    <div className="rail-foot"><span className="small-dot" /> SYNTHESIZED WITH CARE</div>
  </aside>;
}
