// Every sound is synthesised: (audioContext, output) => void. No audio files.

function tone(ctx, out, { type = "sine", from, to = from, at = 0, length = 0.4, peak = 0.2 }) {
  const start = ctx.currentTime + at;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(to, start + length);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(gain);
  gain.connect(out);
  oscillator.start(start);
  oscillator.stop(start + length + 0.05);
}

export const SOUNDS = {
  // a journal entry found: two soft bells, a fifth apart
  chime: (ctx, out) => {
    tone(ctx, out, { from: 880, length: 1.1, peak: 0.16 });
    tone(ctx, out, { from: 1320, at: 0.12, length: 1.3, peak: 0.1 });
  },
  // something picked up
  pick: (ctx, out) => tone(ctx, out, { type: "triangle", from: 520, to: 780, length: 0.16, peak: 0.18 }),
  // the lock giving way
  latch: (ctx, out) => {
    tone(ctx, out, { type: "square", from: 140, to: 70, length: 0.12, peak: 0.12 });
    tone(ctx, out, { type: "square", from: 110, to: 55, at: 0.16, length: 0.18, peak: 0.12 });
  },
  // the flame catching
  ignite: (ctx, out) => {
    tone(ctx, out, { type: "sawtooth", from: 90, to: 420, length: 1.4, peak: 0.07 });
    tone(ctx, out, { from: 660, at: 1.1, length: 1.6, peak: 0.14 });
  },
};
