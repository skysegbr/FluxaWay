// Turn a reference demo's render function back into the snippet shown under it.
//
// Every demo is a real component (`() => h(Button, ...)`), so its own source
// IS the example — deriving the code from Function.prototype.toString() means
// the snippet can never drift from the thing rendered above it. A demo can
// still set `code:` explicitly when a hand-written snippet teaches better.

const ARROW = /^\(\s*\)\s*=>\s*/;
// Deliberately bracket-free: validate_nexa.py's brace-balance lexer has no
// notion of regex character classes, so a literal like [^)] reads to it as an
// unbalanced paren and fails the whole file.
const NAMED = /^(?:async\s+)?function\b/;

export function sourceOf(fn) {
  const raw = String(fn).trim();

  if (ARROW.test(raw)) {
    const body = raw.replace(ARROW, "").trim();
    // `() => (expr)` and `() => { ... }` both wrap the interesting part.
    if (body.startsWith("(") && body.endsWith(")")) return dedent(body.slice(1, -1));
    if (body.startsWith("{") && body.endsWith("}")) return dedent(body.slice(1, -1));
    return dedent(body);
  }

  if (NAMED.test(raw) && raw.endsWith("}")) {
    return dedent(raw.slice(raw.indexOf("{") + 1, -1));
  }

  return dedent(raw);
}

const indentOf = (line) => line.match(/^ */)[0].length;

export function dedent(text) {
  const lines = text.replace(/\t/g, "  ").split("\n");

  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  if (!lines.length) return "";

  // `() =>\n  h(...)` leaves the first line already flush against column 0
  // while its continuation lines keep the source file's indentation. Measuring
  // the common indent over ALL lines would then find 0 and dedent nothing, so
  // a flush first line is excluded from the measurement and left untouched.
  const flushFirst = indentOf(lines[0]) === 0;
  const body = flushFirst ? lines.slice(1) : lines;
  const indents = body.filter((line) => line.trim()).map(indentOf);
  const pad = indents.length ? Math.min(...indents) : 0;

  const shifted = body.map((line) => line.slice(pad));
  return (flushFirst ? [lines[0], ...shifted] : shifted).join("\n");
}
