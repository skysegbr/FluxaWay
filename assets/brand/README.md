# FluxaWay Brand Assets

These files are the production source of truth for the FluxaWay visual
identity.

`fluxaway-logo-approved-reference.png` preserves the approved concept sheet for
design reference only. Use the SVG files below in products and documentation.

## Logos

- `fluxaway-logo.svg` — primary horizontal logo for light backgrounds.
- `fluxaway-logo-dark.svg` — horizontal logo for dark backgrounds.
- `fluxaway-logo-mono.svg` — one-color black logo.
- `fluxaway-logo-inverse.svg` — one-color white logo.
- `fluxaway-symbol.svg` — primary two-color FW symbol.
- `fluxaway-symbol-mono.svg` — one-color black symbol.
- `fluxaway-symbol-inverse.svg` — one-color white symbol.

## Icons

- `fluxaway-app-icon.svg` — scalable application icon source.
- `favicon.svg` and `favicon.ico` — browser icons.
- `favicon-16x16.png`, `favicon-32x32.png`, and `icon-*.png` — generated
  raster sizes.
- `apple-touch-icon.png` — 180 × 180 Apple touch icon.
- `site.webmanifest` — installable web-app metadata.

## Colors

- Midnight navy: `#0f172a`
- Vivid teal: `#14b8a6`
- White: `#ffffff`

## Clear Space

Keep clear space around the logo equal to at least half the symbol's cap
height. Do not stretch, rotate, recolor, outline, shadow, or rearrange the
symbol and wordmark.

Use the symbol without the wordmark below 96 CSS pixels. Use the square app
icon for browser, launcher, and pinned-site surfaces.

## Regenerating PNG and ICO Files

Run:

```bash
python3 scripts/export_fluxaway_brand.py
```

The exporter uses Playwright's Chromium renderer and Pillow. It does not use
Node, npm, a bundler, or an external font.
