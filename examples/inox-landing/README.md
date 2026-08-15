# FluxaWay — Inox Protocol Landing

An original product landing page built with the experimental Inox material
theme and `fluxaway-motion`. It uses `motion-landing` only as an architectural
reference: the composition, generated imagery and motion language are distinct.

Run `python server.py` at the repository root and open
`http://localhost:8000/examples/inox-landing/`.

## What to inspect

- `components/Hero.js` — asymmetric opening sequence, inspection scanner and
  small rotating reticle over original stainless-steel imagery; its primary
  action uses the official `Button effect="conductor"` API.
- `components/MaterialProof.js` — an in-view shutter reveal over the precision
  laboratory photograph.
- `components/AssemblyLab.js` — an interactive three-state mechanical assembly
  driven by a real `useTimeline` controller.
- `components/SystemsGrid.js` — alternating entrance directions and a restrained
  brushed-light hover reflection.
- `components/FinalCta.js` — a linear alloy seal, intentionally avoiding the
  orbital language used by the Motion landing, plus the same official
  Conductor action used in the hero.
- `components/SectionNext.js` — the shared underlined transition control used
  between every section, with one consistent metallic hover and focus state.

The two WebP images under `assets/` were generated specifically for this
example and compressed for browser delivery.
