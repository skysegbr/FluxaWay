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
  // a footfall: a short low thud
  step: (ctx, out) => tone(ctx, out, { type: "triangle", from: 95, to: 48, length: 0.09, peak: 0.1 }),
  // a journal entry found
  chime: (ctx, out) => {
    tone(ctx, out, { from: 784, length: 1.1, peak: 0.15 });
    tone(ctx, out, { from: 1175, at: 0.14, length: 1.3, peak: 0.1 });
  },
  // something picked up
  pick: (ctx, out) => tone(ctx, out, { type: "triangle", from: 520, to: 780, length: 0.16, peak: 0.18 }),
  // the generator catching
  hum: (ctx, out) => {
    tone(ctx, out, { type: "sawtooth", from: 40, to: 110, length: 1.6, peak: 0.09 });
    tone(ctx, out, { type: "square", from: 220, at: 1.2, length: 0.5, peak: 0.05 });
  },
  // the signal going out: three rising pips
  signal: (ctx, out) => {
    for (let pip = 0; pip < 3; pip += 1) {
      tone(ctx, out, { from: 660 + pip * 220, at: pip * 0.28, length: 0.22, peak: 0.16 });
    }
  },
};
