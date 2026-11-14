# Three.js (vendored)

`three.module.min.js` and `three.core.min.js` are the official ES-module builds
of [Three.js](https://threejs.org/) **r185** (`three@0.185.1` on npm,
`build/` folder), unmodified. MIT licence — see `LICENSE`.

They are here for `examples/signal-island` only. **FluxaWay does not depend on
Three.js**: nothing under `dist/` imports it. The example shows how a renderer
the app owns plugs into the `fluxaway-game` add-on.

Import the module build; it loads the core file next to it:

```js
import * as THREE from "/assets/three/three.module.min.js";
```

To update: download the two files and `LICENSE` from the same release on npm
(for example through `https://cdn.jsdelivr.net/npm/three@<version>/build/`),
replace them together, and check the checksums against a second mirror.

| File | SHA-256 |
|---|---|
| `three.module.min.js` | `86bcee248b64f44bcfc23c331ae74619061957d59cab040171dcb6fb5900beb6` |
| `three.core.min.js` | `05b2609338c76cd65daf74f3ac515bc9a5045e1b3b33edc07d8c9bd55250fa90` |
