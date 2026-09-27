import { presetPitch } from '../lib/music';
import type { InstrumentId } from '../lib/music';
import { songDuration } from '../lib/songs';
import type { PresetSong } from '../lib/songs';
import type { AudioOutput } from './synth';

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'complete';
export interface PlayerSnapshot { status: PlayerStatus; position: number; duration: number; activeNotes: number[]; target: number | null; practiceIndex: number }
/** Score time in seconds, audio-clock anchor, and a 100ms scheduling horizon. */
export class SongPlayer {
  status: PlayerStatus = 'idle';
  speed = 1;
  practice = false;
  private anchor = 0;
  private offset = 0;
  private nextIndex = 0;
  private practiceIndex = 0;
  private timer?: ReturnType<typeof setInterval>;
  constructor(private audio: AudioOutput, public song: PresetSong, public instrument: InstrumentId) {}
  get position() {
    if (this.practice) return this.offset;
    return Math.min(songDuration(this.song), this.offset + (this.status === 'playing' ? (this.audio.now - this.anchor) * this.speed : 0));
  }
  pitch(pitch: number) { return presetPitch(this.instrument, pitch); }
  private scheduleFromPosition() {
    const position = this.offset;
    this.nextIndex = this.song.notes.findIndex(note => note.startTime + note.duration > position + 0.00001);
    if (this.nextIndex < 0) this.nextIndex = this.song.notes.length;
    this.anchor = this.audio.now;
  }
  play() {
    if (this.status === 'playing') return;
    if (this.status === 'complete') { this.offset = 0; this.practiceIndex = 0; }
    this.status = 'playing'; this.scheduleFromPosition();
    this.tick(); this.timer = setInterval(() => this.tick(), 25);
  }
  pause() {
    if (this.status !== 'playing') return;
    this.offset = this.position; this.status = 'paused';
    clearInterval(this.timer); this.audio.stopGroup('song');
  }
  stop() {
    clearInterval(this.timer); this.audio.stopGroup('song');
    this.status = 'idle'; this.offset = 0; this.practiceIndex = 0; this.nextIndex = 0;
  }
  restart() { this.stop(); this.play(); }
  setSong(song: PresetSong) { this.stop(); this.song = song; }
  setSpeed(speed: number) {
    this.offset = this.position;
    this.speed = Math.min(1.5, Math.max(0.5, speed));
    this.audio.stopGroup('song'); this.scheduleFromPosition();
    if (this.status === 'playing') this.tick();
  }
  setInstrument(instrument: InstrumentId) {
    this.offset = this.position; this.audio.stopGroup('song'); this.instrument = instrument;
    this.scheduleFromPosition(); if (this.status === 'playing') this.tick();
  }
  setPractice(value: boolean) { this.stop(); this.practice = value; }
  input(pitch: number) {
    if (!this.practice || this.status !== 'playing') return false;
    const target = this.song.notes[this.practiceIndex];
    if (!target || this.pitch(target.pitch) !== pitch) return false;
    this.practiceIndex++;
    if (this.practiceIndex >= this.song.notes.length) { this.offset = songDuration(this.song); this.status = 'complete'; clearInterval(this.timer); }
    else this.offset = this.song.notes[this.practiceIndex].startTime;
    return true;
  }
  tick() {
    if (this.status !== 'playing' || this.practice) return;
    const position = this.position;
    if (position >= songDuration(this.song)) {
      this.offset = songDuration(this.song); this.status = 'complete';
      clearInterval(this.timer); this.audio.stopGroup('song'); return;
    }
    const horizon = position + 0.1 * this.speed;
    while (this.nextIndex < this.song.notes.length) {
      const note = this.song.notes[this.nextIndex];
      if (note.startTime > horizon) break;
      this.nextIndex++;
      const remaining = note.startTime + note.duration - Math.max(position, note.startTime);
      if (remaining <= 0) continue;
      this.audio.noteOn(this.instrument, this.pitch(note.pitch), {
        when: this.audio.now + Math.max(0, note.startTime - position) / this.speed,
        duration: remaining / this.speed, velocity: note.velocity, group: 'song',
      });
    }
  }
  snapshot(): PlayerSnapshot {
    const position = this.position;
    const target = this.practice && this.status === 'playing' ? this.pitch(this.song.notes[this.practiceIndex]?.pitch ?? 60) : null;
    const activeNotes = this.status !== 'playing' ? [] : this.practice ? [target!] : this.song.notes.filter(note => note.startTime <= position && note.startTime + note.duration > position).map(note => this.pitch(note.pitch));
    return { status: this.status, position, duration: songDuration(this.song), activeNotes, target, practiceIndex: this.practiceIndex };
  }
}
