// Small, warm synth voices. Audio is unlocked by the engine's Start gesture.
function tone(context, output, frequency, delay = 0, duration = 0.25, type = "sine") {
  const start = context.currentTime + delay;
  const voice = context.createOscillator();
  const envelope = context.createGain();
  voice.type = type;
  voice.frequency.setValueAtTime(frequency, start);
  voice.frequency.exponentialRampToValueAtTime(frequency * 0.7, start + duration);
  envelope.gain.setValueAtTime(0.001, start);
  envelope.gain.exponentialRampToValueAtTime(0.13, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
  voice.connect(envelope);
  envelope.connect(output);
  voice.start(start);
  voice.stop(start + duration + 0.02);
}
export const SOUNDS = {
  pick: (ctx, out) => { tone(ctx, out, 1046); tone(ctx, out, 1568, 0.06, 0.32); },
  dash: (ctx, out) => tone(ctx, out, 340, 0, 0.18, "triangle"),
  bump: (ctx, out) => tone(ctx, out, 130, 0, 0.3, "triangle"),
  stun: (ctx, out) => { tone(ctx, out, 330); tone(ctx, out, 660, 0.08); },
  lantern: (ctx, out) => [523, 659, 784, 1046].forEach((note, i) => tone(ctx, out, note, i * 0.1, 0.65)),
  win: (ctx, out) => [523, 659, 784, 1046, 1318, 1568].forEach((note, i) => tone(ctx, out, note, i * 0.15, 1)),
};
