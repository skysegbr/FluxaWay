#!/usr/bin/env python3
"""
FluxaWay chart-palette validator — pure stdlib, no dependencies, no Node.

Why this exists: dist/fluxaway-charts.css ships an eight-slot categorical
palette whose SLOT ORDER is a colorblind-safety mechanism, not a style choice.
Without a checker those hexes are magic numbers nobody can re-verify, and the
next person to "just tweak a color" silently breaks the guarantee documented in
the stylesheet. This reads the tokens straight out of the CSS and recomputes
every measurable check, so the docs can never drift from the shipped values.

What it checks (per mode, against that mode's real chart surface):
  1. Lightness band   — OKLCH L within 0.43-0.77 light / 0.48-0.67 dark
  2. Chroma floor     — OKLCH C >= 0.10 (below it a hue reads as gray)
  3. CVD separation   — OKLab dE x100 between ADJACENT slots under simulated
                        protanopia & deuteranopia (Machado, Oliveira &
                        Fernandes 2009, severity 1.0). Target >= 8.0,
                        floor >= 6.0 (floor legal only with secondary encoding).
  4. Normal-vision    — worst adjacent pair under unsimulated vision, >= 15.0.
                        A hard gate: full-colour readers must be able to tell
                        neighbours apart too.
  5. Contrast         — WCAG ratio of each slot against the chart surface,
                        >= 3:1 (sub-3:1 is legal only with visible labels or
                        the table view, which every chart here ships).

It also prints the series-count ladder — the worst adjacent pair for the first
N slots — because that is what tells an app author how many series are
comfortable before folding the tail into "Other".

Adjacent pairs are the right list for stacks, bars and lines, where only
neighbours touch. `--pairs all` is the harder test needed by scatter, bubble
and choropleth forms; the reported "all-pairs safe depth" is how many leading
slots survive it.

Usage:
    python3 scripts/validate_chart_palette.py             # both modes
    python3 scripts/validate_chart_palette.py --mode dark
    python3 scripts/validate_chart_palette.py --pairs all
    python3 scripts/validate_chart_palette.py --quiet      # CI: exit code only

Exit code 0 when nothing hard-FAILs, 1 otherwise.
"""

from __future__ import annotations

import argparse
import itertools
import math
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CSS = REPO_ROOT / "dist" / "fluxaway-charts.css"

SLOT_COUNT = 8
SEQ_COUNT = 7

# Thresholds. These mirror the data-viz method the palette was derived under;
# changing one is changing the guarantee, not tuning a lint rule.
BAND = {"light": (0.43, 0.77), "dark": (0.48, 0.67)}   # OKLCH L
CHROMA_FLOOR = 0.10                                     # OKLCH C
CVD_TARGET = 8.0
CVD_FLOOR = 6.0
NORMAL_FLOOR = 15.0
CONTRAST_MIN = 3.0
SEQ_MIN_DL = 0.06          # min OKLCH ΔL between adjacent ramp steps
SEQ_HUE_SPREAD = 40.0      # max OKLCH hue spread for a one-hue ramp (deg)
ORDINAL_LIGHT_FLOOR = 2.0  # discrete ordered marks must clear this vs surface

# The chart surface each mode actually renders on — FluxaWay's --m-surface.
# Contrast and band results are only meaningful against the real surface.
SURFACE = {"light": "#ffffff", "dark": "#1e293b"}

# Machado, Oliveira & Fernandes (2009) CVD transforms at severity 1.0, applied
# in LINEAR RGB. The simulation model is part of the standard the thresholds
# were calibrated against, so it must not be swapped for another.
MACHADO = {
    "protan": (
        (0.152286, 1.052583, -0.204868),
        (0.114503, 0.786281, 0.099216),
        (-0.003882, -0.048116, 1.051998),
    ),
    "deutan": (
        (0.367322, 0.860646, -0.227968),
        (0.280085, 0.672501, 0.047413),
        (-0.011820, 0.042940, 0.968881),
    ),
    "tritan": (
        (1.255528, -0.076749, -0.178779),
        (-0.078411, 0.930809, 0.147602),
        (0.004733, 0.691367, 0.303900),
    ),
}


# ── colour conversions ───────────────────────────────────────────────────────

def hex_to_srgb(value: str) -> tuple[float, float, float]:
    text = value.strip().lstrip("#")
    if len(text) != 6 or not re.fullmatch(r"[0-9a-fA-F]{6}", text):
        raise ValueError(f"not a 6-digit hex colour: {value!r}")
    return tuple(int(text[i:i + 2], 16) / 255 for i in (0, 2, 4))  # type: ignore[return-value]


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def linear(value: str) -> tuple[float, float, float]:
    return tuple(srgb_to_linear(c) for c in hex_to_srgb(value))  # type: ignore[return-value]


def relative_luminance(value: str) -> float:
    r, g, b = linear(value)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    hi, lo = sorted((relative_luminance(a), relative_luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def oklab_from_linear(rgb: tuple[float, float, float]) -> tuple[float, float, float]:
    r, g, b = rgb
    l = math.pow(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b, 1 / 3)
    m = math.pow(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b, 1 / 3)
    s = math.pow(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b, 1 / 3)
    return (
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    )


def oklch(value: str) -> tuple[float, float]:
    L, a, b = oklab_from_linear(linear(value))
    return L, math.hypot(a, b)


def okhue(value: str) -> float:
    _, a, b = oklab_from_linear(linear(value))
    return math.degrees(math.atan2(b, a)) % 360


def simulate(value: str, kind: str) -> tuple[float, float, float]:
    r, g, b = linear(value)
    matrix = MACHADO[kind]
    return tuple(  # type: ignore[return-value]
        min(1.0, max(0.0, row[0] * r + row[1] * g + row[2] * b)) for row in matrix
    )


def delta_e(c1: str, c2: str, kind: str | None = None) -> float:
    """Euclidean distance in OKLab, x100. kind=None is unsimulated vision."""
    a = oklab_from_linear(simulate(c1, kind) if kind else linear(c1))
    b = oklab_from_linear(simulate(c2, kind) if kind else linear(c2))
    return 100 * math.dist(a, b)


# ── reading the shipped tokens ───────────────────────────────────────────────

def read_palette(css_text: str) -> dict[str, list[str]]:
    """
    Pull --m-chart-1..8 for both modes out of the stylesheet.

    The light values come from the `:root` block and the dark ones from the
    `[data-theme="dark"]` block — those are the two the validator can check
    against a known surface. (The `@media (prefers-color-scheme: dark)` block
    and `[data-theme="light"]` restate the same values by design; a mismatch
    there is caught below.)
    """
    blocks: dict[str, str] = {}
    for selector, key in ((r":root", "light"), (r'\[data-theme="dark"\]', "dark"),
                          (r'\[data-theme="light"\]', "light-restate")):
        match = re.search(rf"(?<![\w\-]){selector}\s*\{{(.*?)\}}", css_text, re.S)
        if not match:
            raise SystemExit(f"could not find a `{selector}` block in {CSS}")
        blocks[key] = match.group(1)

    media = re.search(
        r"@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme=\"light\"\]\)\s*\{(.*?)\}",
        css_text, re.S,
    )
    if not media:
        raise SystemExit("could not find the prefers-color-scheme: dark block")
    blocks["dark-restate"] = media.group(1)

    def slots_of(body: str, key: str, prefix: str, count: int) -> list[str]:
        found = []
        for i in range(1, count + 1):
            hit = re.search(rf"--{prefix}-{i}\s*:\s*(#[0-9a-fA-F]{{6}})", body)
            if not hit:
                raise SystemExit(f"--{prefix}-{i} missing from the `{key}` block")
            found.append(hit.group(1).lower())
        return found

    out: dict[str, list[str]] = {}
    seq: dict[str, list[str]] = {}
    for key, body in blocks.items():
        out[key] = slots_of(body, key, "m-chart", SLOT_COUNT)
        seq[key] = slots_of(body, key, "m-seq", SEQ_COUNT)

    # The toggle scope and the media query must agree, or the theme switch and
    # the OS preference would paint different charts.
    for mode in ("light", "dark"):
        if out[mode] != out[f"{mode}-restate"]:
            raise SystemExit(
                f"the {mode} categorical palette differs between its two scopes:\n"
                f"  {out[mode]}\n  {out[f'{mode}-restate']}"
            )
        if seq[mode] != seq[f"{mode}-restate"]:
            raise SystemExit(
                f"the {mode} sequential ramp differs between its two scopes:\n"
                f"  {seq[mode]}\n  {seq[f'{mode}-restate']}"
            )

    # Every token declared in :root must be declared in all three theme scopes.
    # Without this, a token added to only some of them silently falls back to
    # the light value under the theme toggle — which is how --m-chart-muted got
    # duplicated in one block and dropped from another. Names only: the values
    # are meant to differ per mode.
    def names(body: str) -> set[str]:
        return set(re.findall(r"(--m-(?:chart|seq)-[\w-]+)\s*:", body))

    # Declared once in :root on purpose, because it forwards to a token that is
    # already theme-aware (--m-chart-surface is var(--m-surface)). Redeclaring
    # it per scope would just restate the same indirection.
    ROOT_ONLY = {"--m-chart-surface"}

    root_names = names(blocks["light"]) - ROOT_ONLY
    for key in ("dark", "light-restate", "dark-restate"):
        missing = root_names - names(blocks[key])
        if missing:
            raise SystemExit(
                f"the `{key}` scope is missing token(s) declared in :root: "
                f"{sorted(missing)}"
            )
        duplicated = [n for n in names(blocks[key])
                      if len(re.findall(rf"{re.escape(n)}\s*:", blocks[key])) > 1]
        if duplicated:
            raise SystemExit(f"the `{key}` scope declares {sorted(duplicated)} more than once")

    return {
        "light": out["light"], "dark": out["dark"],
        "seq-light": seq["light"], "seq-dark": seq["dark"],
    }


# ── checks ───────────────────────────────────────────────────────────────────

def pair_list(n: int, mode: str) -> list[tuple[int, int]]:
    if mode == "all":
        return list(itertools.combinations(range(n), 2))
    return [(i, i + 1) for i in range(n - 1)]


def validate(palette: list[str], mode: str, pairs: str) -> tuple[list[tuple[str, str, str]], bool]:
    surface = SURFACE[mode]
    lo, hi = BAND[mode]
    rows: list[tuple[str, str, str]] = []
    ok = True

    off_band = [(c, round(oklch(c)[0], 3)) for c in palette if not lo <= oklch(c)[0] <= hi]
    if off_band:
        ok = False
    rows.append(("Lightness band", "FAIL" if off_band else "PASS",
                 f"outside L {lo}-{hi}: {off_band}" if off_band
                 else f"all {len(palette)} inside L {lo}-{hi}"))

    low_chroma = [(c, round(oklch(c)[1], 3)) for c in palette if oklch(c)[1] < CHROMA_FLOOR]
    if low_chroma:
        ok = False
    rows.append(("Chroma floor", "FAIL" if low_chroma else "PASS",
                 f"below {CHROMA_FLOOR} (reads gray): {low_chroma}" if low_chroma
                 else f"all {len(palette)} >= {CHROMA_FLOOR}"))

    plist = pair_list(len(palette), pairs)
    label = "all-pairs" if pairs == "all" else "adjacent"

    worst = min(
        ((delta_e(palette[i], palette[j], kind), kind, palette[i], palette[j])
         for kind in ("protan", "deutan") for i, j in plist),
        default=(99.0, "-", "", ""),
    )
    tritan = min((delta_e(palette[i], palette[j], "tritan") for i, j in plist), default=99.0)
    state = "PASS" if worst[0] >= CVD_TARGET else "FLOOR" if worst[0] >= CVD_FLOOR else "FAIL"
    if state == "FAIL":
        ok = False
    rows.append(("CVD separation", state,
                 f"worst {label} {worst[2]}<->{worst[3]} dE {worst[0]:.1f} ({worst[1]}) "
                 f"- tritan {tritan:.1f}"))

    nworst = min(
        ((delta_e(palette[i], palette[j]), palette[i], palette[j]) for i, j in plist),
        default=(99.0, "", ""),
    )
    npass = nworst[0] >= NORMAL_FLOOR
    if not npass:
        ok = False
    rows.append(("Normal-vision floor", "PASS" if npass else "FAIL",
                 f"worst {label} {nworst[1]}<->{nworst[2]} dE {nworst[0]:.1f}"
                 + ("" if npass else f" - below {NORMAL_FLOOR:.0f}")))

    low_contrast = [(c, round(contrast(c, surface), 2))
                    for c in palette if contrast(c, surface) < CONTRAST_MIN]
    rows.append(("Contrast vs surface", "RELIEF" if low_contrast else "PASS",
                 f"below {CONTRAST_MIN}:1, needs visible labels or the table view: {low_contrast}"
                 if low_contrast else f"all {len(palette)} >= {CONTRAST_MIN}:1"))

    return rows, ok


def validate_sequential(ramp: list[str], mode: str) -> tuple[list[tuple[str, str, str]], bool]:
    """
    Check the one-hue magnitude ramp (--m-seq-1..7).

    A sequential ramp is judged on whether it reads AS a ramp: one hue, monotone
    lightness, and visible gaps between steps. The categorical checks would fail
    it by design — it spans the lightness band and its pale end drops under the
    chroma floor — so running them here would be meaningless.

    The 2:1 light-end floor is deliberately NOT a gate. That is an ORDINAL rule,
    where the palest step is a discrete mark that must stay visible; in a
    continuous ramp the palest step means "near zero" and is allowed to recede
    into the surface. The ordinal-safe subset is reported instead.
    """
    rows: list[tuple[str, str, str]] = []
    ok = True
    surface = SURFACE[mode]
    Ls = [oklch(c)[0] for c in ramp]

    # Monotone: sorted order must match the input order or its exact reverse.
    order = sorted(range(len(Ls)), key=lambda i: Ls[i])
    monotone = order == list(range(len(Ls))) or order == list(reversed(range(len(Ls))))
    if not monotone:
        ok = False
    rows.append(("Lightness monotone", "PASS" if monotone else "FAIL",
                 "steps read in one direction" if monotone
                 else f"out of order: {[round(l, 3) for l in Ls]}"))

    gaps = [abs(Ls[i + 1] - Ls[i]) for i in range(len(Ls) - 1)]
    thin = [(ramp[i], ramp[i + 1], round(g, 3)) for i, g in enumerate(gaps) if g < SEQ_MIN_DL]
    if thin:
        ok = False
    rows.append(("Adjacent ΔL", "FAIL" if thin else "PASS",
                 f"steps too close: {thin}" if thin
                 else f"worst gap {min(gaps):.3f} >= {SEQ_MIN_DL}"))

    hues = [okhue(c) for c in ramp]
    spread = max(hues) - min(hues)
    if spread > 180:
        spread = 360 - spread
    one_hue = spread <= SEQ_HUE_SPREAD
    if not one_hue:
        ok = False
    rows.append(("Single hue", "PASS" if one_hue else "FAIL",
                 f"hue spread {spread:.0f}°"
                 + ("" if one_hue else f" — above {SEQ_HUE_SPREAD}°, that is a categorical set")))

    ordinal_safe = [c for c in ramp if contrast(c, surface) >= ORDINAL_LIGHT_FLOOR]
    rows.append(("Ordinal-safe subset", "INFO",
                 f"{len(ordinal_safe)}/{len(ramp)} steps clear {ORDINAL_LIGHT_FLOOR}:1 "
                 f"— use these for discrete ordered marks: {ordinal_safe}"))

    return rows, ok


def ladder(palette: list[str]) -> list[tuple[int, float, float]]:
    """Worst adjacent pair for the first N slots — the series-count ladder."""
    out = []
    for n in range(2, len(palette) + 1):
        head = palette[:n]
        plist = pair_list(n, "adjacent")
        cvd = min(delta_e(head[i], head[j], k)
                  for k in ("protan", "deutan") for i, j in plist)
        nor = min(delta_e(head[i], head[j]) for i, j in plist)
        out.append((n, cvd, nor))
    return out


def all_pairs_depth(palette: list[str]) -> int:
    depth = 1
    for n in range(2, len(palette) + 1):
        head = palette[:n]
        plist = pair_list(n, "all")
        cvd = min(delta_e(head[i], head[j], k)
                  for k in ("protan", "deutan") for i, j in plist)
        nor = min(delta_e(head[i], head[j]) for i, j in plist)
        if cvd < CVD_TARGET or nor < NORMAL_FLOOR:
            break
        depth = n
    return depth


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--mode", choices=("light", "dark", "both"), default="both")
    parser.add_argument("--pairs", choices=("adjacent", "all"), default="adjacent")
    parser.add_argument("--sequential", action="store_true",
                        help="check only the --m-seq-* magnitude ramp")
    parser.add_argument("--quiet", action="store_true", help="exit code only")
    args = parser.parse_args()

    if not CSS.exists():
        print(f"missing {CSS}", file=sys.stderr)
        return 1

    palettes = read_palette(CSS.read_text(encoding="utf-8"))
    modes = ("light", "dark") if args.mode == "both" else (args.mode,)
    failed = False

    for mode in modes:
        if args.sequential:
            ramp = palettes[f"seq-{mode}"]
            rows, ok = validate_sequential(ramp, mode)
            failed = failed or not ok
            if not args.quiet:
                print(f"\n=== {mode} mode — sequential ramp — surface {SURFACE[mode]} ===")
                for i, hexval in enumerate(ramp, 1):
                    L, C = oklch(hexval)
                    print(f"  seq {i}  {hexval}   L {L:.3f}  C {C:.3f}  "
                          f"{contrast(hexval, SURFACE[mode]):.2f}:1")
                print()
                for name, state, detail in rows:
                    print(f"  {state:7} {name:22} {detail}")
            continue

        palette = palettes[mode]
        rows, ok = validate(palette, mode, args.pairs)
        failed = failed or not ok

        if args.quiet:
            continue

        print(f"\n=== {mode} mode - surface {SURFACE[mode]} - {args.pairs} pairs ===")
        for i, hexval in enumerate(palette, 1):
            L, C = oklch(hexval)
            print(f"  slot {i}  {hexval}   L {L:.3f}  C {C:.3f}  "
                  f"{contrast(hexval, SURFACE[mode]):.2f}:1")
        print()
        for name, state, detail in rows:
            print(f"  {state:7} {name:22} {detail}")
        print(f"\n  all-pairs safe depth: first {all_pairs_depth(palette)} slots "
              f"(scatter / bubble / choropleth cap)")
        print("  series-count ladder (worst adjacent CVD / normal-vision):")
        for n, cvd, nor in ladder(palette):
            note = "" if n <= 6 else "  <- past the comfortable range"
            print(f"    {n} series: {cvd:5.1f} / {nor:5.1f}{note}")

    if not args.quiet:
        print()
        print("FAILED - a hard gate is broken." if failed
              else "Chart palette validation passed.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
