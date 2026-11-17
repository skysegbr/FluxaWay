# Lumen Run

A small, complete top-down action adventure built with **FluxaWay Game** and
Canvas 2D. Carry wandering lights through three moonlit gardens, dodge shadows,
and wake all nine lanterns. All illustration and sound are made locally with
Canvas and Web Audio; there are no external assets or runtime dependencies.

From the repository root:

```sh
python3 server.py
```

Open **http://localhost:8000/examples/lumen-run/** (use the port printed by the
server if 8000 is already occupied).

## Play

| Control | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Space / Shift | Dash; pass through shadows to stun them |
| E / Enter | Deliver three lights to a nearby lantern |
| Escape | Pause / resume |
| Touch | Left stick to move, right button to dash, tap the lantern prompt |

Walk over golden sparks to collect them. Your initial satchel holds three;
an arrow points towards an unlit lantern when you have enough. Collect within
five seconds of the last pickup to build a streak (up to ×5). Dash recharges
in 1.45 seconds and stuns a shadow for 2.8 seconds. Taking a hit breaks the
streak, but never removes collected lights. There are spare lights in every
garden, and no time limit.

Each completed garden restores your hearts and offers an upgrade: a larger
satchel, a faster dash recharge, or an extra heart. The last garden ends the
journey with a score, best streak and elapsed time. **Gentle journey** on the
title screen removes damage and slows shadows; every garden and upgrade is
still available.

The engine saves progress and the world's position to its localStorage slot,
`fluxaway-game:lumen-run`. Continue restores the run, including collected
lights, upgrades, enemies, elapsed time and sound preference. Starting over
asks before replacing a saved journey. Losing focus pauses active play.
Storage is optional: when the browser blocks it, the current session still
plays, but cannot be resumed after leaving.

## How it uses the engine

- `createGame` owns the three scenes, delivery scripts, progression, upgrade
  choices, sound and save slot. `useGame` subscribes the UI to discrete events.
- `GameViewport` owns the canvas, **the engine's fixed-step loop and input**,
  resizing, reach checks and the stage adapter. The application supplies its
  Canvas 2D renderer and simple movement/collision rules; the engine stays
  renderer-independent.
- `GamePrompt` exposes nearby lanterns. `GameDialogue` presents the upgrade
  choices and an explanation when a lantern needs more lights. `GameStick`
  supplies the mobile controls.
- `fluxaway-motion` animates the title and pause/result cards, respecting
  reduced-motion preferences. Simulation feedback is drawn inside the
  engine-owned loop, with no additional requestAnimationFrame loop.
- The landscape is cached per scene; live drawing handles characters, light,
  particles and the mobile camera/minimap. The DOM HUD samples transient
  timing at 10 Hz rather than persisting state on every frame.

`app.js` orchestrates; `data.js` holds the maps; `story.js` holds the scripts;
`world.js` implements the viewport adapter; `simulation.js` holds movement and
scoring; `paint.js`, `landscape.js`, `actors.js` and `renderer.js` draw the world.
Each UI component has its own sibling stylesheet under `components/`.

## Verify

```sh
python3 scripts/validate_fluxaway.py
python3 scripts/check_lumen_run.py --browser chromium --walkthrough
python3 scripts/check_lumen_run.py --browser firefox
python3 scripts/check_lumen_run.py --browser webkit
```

The app check serves the repository and exercises real keyboard and pointer
input, pickup, dash, pause, mute, save/resume, restart cancellation, and a
390px touch layout. Deterministic stage-save fixtures additionally check rock
and boundary collisions, dash stun, damage, invulnerability, defeat, the
gentle mode and reset. `--walkthrough` navigates all three gardens, collects
and delivers the required lights, chooses upgrades and reaches victory in
Gentle journey mode. It uses real movement rather than teleporting or
editing the game's progression. Screenshots go to ignored
`docs/qa-evidence/`.

The canvas is a visual action game: controls, objectives, dialogue and results
have semantic DOM labels, but this example does not implement a nonvisual
navigation mode for the world.
