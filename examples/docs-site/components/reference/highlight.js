// Minimal reference-domain syntax highlighter — no dependency or build.
//
// tokenize() runs ONE combined regex per language and maps each match back to
// its rule name by finding the first group that matched. Every rule source
// must therefore use non-capturing groups (?:...) internally, or the group
// indexes stop lining up.
//
// highlight() returns vnode children (spans), never an HTML string — the code
// on a docs page comes from our own content modules, but building it as vdom
// keeps it impossible for a snippet to inject markup.

import { h } from "/dist/nexa.js";

const KEYWORDS =
  "const|let|var|function|return|if|else|for|while|of|in|new|import|from|export|" +
  "default|class|extends|async|await|try|catch|finally|throw|typeof|instanceof|" +
  "switch|case|break|continue|do|delete|void|yield|null|true|false|undefined|this";

const RULES = {
  js: [
    ["com", "\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/"],
    ["str", "`(?:\\\\[\\s\\S]|[^\\\\`])*`|\"(?:\\\\[\\s\\S]|[^\\\\\"])*\"|'(?:\\\\[\\s\\S]|[^\\\\'])*'"],
    ["num", "\\b(?:0x[\\da-fA-F]+|\\d+(?:\\.\\d+)?)\\b"],
    ["key", `\\b(?:${KEYWORDS})\\b`],
    ["fn", "[A-Za-z_$][\\w$]*(?=\\s*\\()"],
    ["prop", "[A-Za-z_$][\\w$]*(?=\\s*:)"],
    ["punc", "=>|\\.\\.\\.|[{}()\\[\\],;:.]|[-+*/%<>=!&|?]+"],
  ],
  html: [
    ["com", "<!--[\\s\\S]*?-->"],
    ["str", "\"(?:[^\"]*)\"|'(?:[^']*)'"],
    ["tag", "<\\/?[\\w-]+|\\/?>"],
    ["attr", "[\\w-]+(?==)"],
  ],
  css: [
    ["com", "\\/\\*[\\s\\S]*?\\*\\/"],
    ["str", "\"(?:[^\"]*)\"|'(?:[^']*)'"],
    ["key", "@[\\w-]+"],
    ["sel", "[.#][\\w-]+|::?[\\w-]+"],
    ["prop", "[-\\w]+(?=\\s*:)"],
    ["num", "\\b\\d+(?:\\.\\d+)?(?:px|rem|em|%|s|ms|vh|vw)?\\b|#[\\da-fA-F]{3,8}"],
    ["punc", "[{}();:,]"],
  ],
};

const COMPILED = new Map();

function compiled(lang) {
  const key = RULES[lang] ? lang : "js";
  if (!COMPILED.has(key)) {
    const rules = RULES[key];
    COMPILED.set(key, {
      re: new RegExp(rules.map(([, src]) => `(${src})`).join("|"), "g"),
      types: rules.map(([type]) => type),
    });
  }
  return COMPILED.get(key);
}

// [{ type, text }] — `type` is null for plain text between tokens.
export function tokenize(code, lang = "js") {
  const { re, types } = compiled(lang);
  const out = [];
  let last = 0;
  re.lastIndex = 0;

  for (let m = re.exec(code); m; m = re.exec(code)) {
    if (m.index > last) out.push({ type: null, text: code.slice(last, m.index) });

    const groupIndex = types.findIndex((_, i) => m[i + 1] !== undefined);
    out.push({ type: types[groupIndex] ?? null, text: m[0] });
    last = m.index + m[0].length;
  }

  if (last < code.length) out.push({ type: null, text: code.slice(last) });
  return out;
}

export function highlight(code, lang = "js") {
  return tokenize(code, lang).map((token, i) =>
    token.type
      ? h("span", { key: i, className: `nd-t-${token.type}` }, token.text)
      : token.text,
  );
}
