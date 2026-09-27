import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface NameModalProps {
  onSubmit: (name: string) => void;
}

export function NameModal({ onSubmit }: NameModalProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed.slice(0, 40));
  };

  return (
    <div className="name-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="name-modal-title">
      <form className="name-modal" onSubmit={submit}>
        <div className="name-modal-spark"><Sparkles size={22} /></div>
        <h2 id="name-modal-title">Hey — what should I call you?</h2>
        <p>Just a friendly name for your little corner of sound.</p>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="your name"
          maxLength={40}
          aria-label="Your name"
        />
        <button type="submit" className="primary-button" disabled={!value.trim()}>
          Let's go <span>↗</span>
        </button>
      </form>
    </div>
  );
}
