let codeMirrorPromise;

export function loadCodeMirror() {
  if (globalThis.window?.CodeMirror) return Promise.resolve();
  if (codeMirrorPromise) return codeMirrorPromise;

  codeMirrorPromise = new Promise((resolve, reject) => {
    const src = "/assets/codemirror/codemirror.min.js";
    const existing = document.querySelector(`script[src="${src}"]`);
    const script = existing ?? document.createElement("script");

    const ready = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    const failed = () => {
      codeMirrorPromise = undefined;
      reject(new Error("Could not load the local CodeMirror asset."));
    };

    if (globalThis.window?.CodeMirror || existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    script.addEventListener("load", ready, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (!existing) {
      script.src = src;
      document.head.append(script);
    }
  });

  return codeMirrorPromise;
}
