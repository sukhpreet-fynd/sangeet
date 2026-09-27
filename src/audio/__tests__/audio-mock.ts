import { vi } from 'vitest';
class Param {
  value = 0;
  setValueAtTime = vi.fn((value: number) => { this.value = value; });
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
  setTargetAtTime = vi.fn();
  cancelAndHoldAtTime = vi.fn();
  cancelScheduledValues = vi.fn();
}
class Node {
  connect = vi.fn((node: unknown) => node);
  disconnect = vi.fn();
}
export class Source extends Node {
  type = 'sine'; frequency = new Param(); detune = new Param();
  onended: (() => void) | null = null;
  start = vi.fn();
  private timer?: ReturnType<typeof setTimeout>;
  stop = vi.fn((time: number) => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.onended?.(), Math.max(0, time * 1000 - Date.now()));
  });
}
export class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state = 'suspended';
  sampleRate = 44100;
  createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
  createBufferSource() { const source = new Source(); this.sources.push(source); return source; }
  destination = new Node();
  sources: Source[] = [];
  gains: (Node & { gain: Param })[] = [];
  get currentTime() { return Date.now() / 1000; }
  constructor() { FakeAudioContext.instances.push(this); }
  resume = vi.fn(async () => { this.state = 'running'; });
  close = vi.fn(async () => { this.state = 'closed'; });
  createGain() { const gain = Object.assign(new Node(), { gain: new Param() }); this.gains.push(gain); return gain; }
  createOscillator() { const source = new Source(); this.sources.push(source); return source; }
  createBiquadFilter() { return Object.assign(new Node(), { type: '', frequency: new Param() }); }
  createDynamicsCompressor() { return Object.assign(new Node(), { threshold: new Param(), ratio: new Param() }); }
}
