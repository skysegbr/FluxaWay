# The Lantern Keeper

A three-scene point-and-click adventure, and the reference app for the
`fluxaway-game` add-on. It demonstrates:

- A world laid out as one map — the cove, the foot of the tower, the lamp room —
  with the `ZoomStage` camera climbing the lighthouse as the player does.
- Story scripts as plain `async` functions: lines, a choice, travel, a close-up.
- An item puzzle: the door and the lantern answer only to the item *in hand*.
- A journal with four entries, an inventory, and a save slot with **Continue**.
- A `fluxaway-motion` cutscene (`LampScene.js`) the story waits for with
  `game.play()`, and a looping swell that only runs while its scene is on screen.
- Sound synthesised with the Web Audio API — no audio files.
- A **Hints** toggle that marks every hotspot, for touch screens.

Where things are:

| File | Holds |
|---|---|
| `data.js` | the whole story: state, items, journal, scenes, hotspots and their scripts |
| `components/*Scene.js` | the art of each scene (inline SVG) |
| `components/Shell.js` | the layout: stage, HUD, inventory, journal, dialogue, title screen |
| `cutscenes.js` | where a scene registers a timeline so a script can wait for it |
| `sounds.js` | the synthesised sounds |

Serve the repository with `python server.py`, then open
`http://localhost:8000/examples/lantern-keeper/`.
