let codeMirrorPromise;

// Every `mode:` value CodeEditor is ever given across the docs-site is
// "javascript" or "markdown" (see content/sourceDocuments.js). xml is loaded
// too because markdown mode delegates to it for embedded/fenced HTML.
const MODE_SCRIPTS = [
  "/assets/codemirror/mode/javascript/javascript.min.js",
  "/assets/codemirror/mode/xml/xml.min.js",
  "/assets/codemirror/mode/markdown/markdown.min.js",
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existing ?? document.createElement("script");
    const ready = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    const failed = () => reject(new Error(`Could not load the local CodeMirror asset: ${src}`));

    script.addEventListener("load", ready, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (!existing) {
      script.src = src;
      document.head.append(script);
    }
  });
}

export function loadCodeMirror() {
  if (codeMirrorPromise) return codeMirrorPromise;

  codeMirrorPromise = loadScript("/assets/codemirror/codemirror.min.js")
    .then(() => Promise.all(MODE_SCRIPTS.map(loadScript)))
    .catch((error) => {
      codeMirrorPromise = undefined;
      throw error;
    });

  return codeMirrorPromise;
}
