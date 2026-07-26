/*! Nexa compatibility alias — use fluxaway-hmr.js. */
(() => {
  const current = document.currentScript;
  const script = document.createElement("script");
  script.src = new URL("./fluxaway-hmr.js", current?.src ?? document.baseURI).href;
  document.head.append(script);
})();
