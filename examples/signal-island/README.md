# Signal Island

A first-person 3D island, and the reference app for a **free-roaming world** on
the `fluxaway-game` add-on. The story engine is the same one that runs the 2D
`lantern-keeper`; only the world is different.

It demonstrates:

- `GameViewport` hosting a renderer the app owns — here [Three.js](https://threejs.org/),
  vendored in `assets/three/` — with `createLoop` (fixed-step updates,
  interpolated rendering) and `createInput` (keys, drag-to-look, touch stick).
- Hotspots as **places** (`at: [x, z]`): walk into reach, and `GamePrompt`
  offers the thing; `E`, Enter or a tap uses it.
- The same async story scripts: lines, an item that must be in hand, a choice.
- `game.focus("mast")` turning the camera to a place, and a `fluxaway-motion`
  end card the story waits for with `game.play()`.
- A map on a `ZoomStage` with free zoom, filled in as places are found.
- The player's position saved with the game (`world.save()` / `world.load()`).
- Sound synthesised with the Web Audio API — no audio files.

Where things are:

| File | Holds |
|---|---|
| `data.js` | the story: state, items, journal, the places and their scripts |
| `terrain.js` | the island as math: ground height, what is walkable, where things stand |
| `world.js` | the `world` factory: renderer, camera, player, focus, save |
| `props.js` | the low-poly meshes |
| `components/Shell.js` | the layout: viewport, HUD, prompt, stick, panels, dialogue, title |
| `components/MapPanel.js` | the island chart on a ZoomStage |
| `components/EndCard.js` | the Motion timeline of the ending |

Controls: `W A S D` or the arrows walk and turn, drag looks around, `Shift`
runs, `E` uses what is within reach. On a touch screen a stick appears.

Three.js is a dependency of **this example**, not of FluxaWay: the add-on never
imports it, and a world drawn with Canvas 2D or raw WebGL plugs in the same way.
It needs WebGL; without it the viewport says so instead of showing a dead canvas.

Serve the repository with `python server.py`, then open
`http://localhost:8000/examples/signal-island/`.
