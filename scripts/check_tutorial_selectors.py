#!/usr/bin/env python3
"""Verify every selector the tutorial recorders drive still exists in the source.

Nothing in CI executes ``tutorials/*/record.py`` — they are only run by hand
when a video is regenerated. So when an example is refactored and a class it
renders is renamed, the recorder keeps targeting the old name and nobody finds
out until the next recording attempt times out. That is exactly how
``tutorials/fluxaway-motion/record.py`` came to target ``.me-row`` long after
the Motion Editor's timeline rows became ``.me-row-lane``.

This gate is deliberately **static** — it never opens a browser. Many tutorial
selectors only resolve after an interaction (an actor must be selected before
``.me-transform-outline`` exists; the light-theme button only appears once the
theme is dark), so "does it render on load" would be a false negative. What is
always true is that a live selector's class, id, aria-label or button text
appears *somewhere* in the source. A token that appears nowhere is dead.

Usage:
    python3 scripts/check_tutorial_selectors.py
    python3 scripts/check_tutorial_selectors.py --list
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TUTORIALS = ROOT / "tutorials"

# Where a rendered token may legitimately come from.
SEARCH_DIRS = ("examples", "tutorials", "dist")
SEARCH_SUFFIXES = {".js", ".css", ".html"}

# Selector fragments, in the order we peel them off a locator string.
CLASS_RE = re.compile(r"\.([A-Za-z_][\w-]*)")
ID_RE = re.compile(r"#([A-Za-z_][\w-]*)")
ARIA_RE = re.compile(r"\[aria-label=['\"]([^'\"]+)['\"]\]")
TEXT_RE = re.compile(r":has-text\(['\"]([^'\"]+)['\"]\)")
# Capture up to the *matching* outer quote, so nested quotes survive:
# locator(".fx-deck-scenes button:has-text('Finale loop')") must yield the
# whole selector, not stop dead at the first inner apostrophe.
LOCATOR_RE = re.compile(r"(?:frame_)?locator\(\s*(['\"])((?:(?!\1).)+)\1")


def selectors_for(record: Path) -> list[str]:
    """Every locator string the recorder drives, in source order, deduped."""
    seen, out = set(), []
    for match in LOCATOR_RE.finditer(record.read_text()):
        sel = match.group(2)
        if sel not in seen:
            seen.add(sel)
            out.append(sel)
    return out


def tokens_for(selector: str) -> list[tuple[str, str]]:
    """Break a selector into (kind, token) pairs we can look for in the source."""
    tokens: list[tuple[str, str]] = []
    rest = selector

    for kind, pattern in (("text", TEXT_RE), ("aria-label", ARIA_RE)):
        for value in pattern.findall(rest):
            tokens.append((kind, value))
        rest = pattern.sub(" ", rest)

    tokens += [("class", name) for name in CLASS_RE.findall(rest)]
    tokens += [("id", name) for name in ID_RE.findall(rest)]
    return tokens


def appears(token: str, haystack: str) -> bool:
    """True when the token appears as a *whole* class/id/text, not as a prefix.

    A plain substring test is useless here: ``me-row`` is a substring of
    ``me-row-lane``, ``me-row-label`` and ``me-row-active``, so the dead
    selector this gate exists to catch would sail straight through. Require a
    boundary on both sides so only a complete name counts.
    """
    return re.search(rf"(?<![\w-]){re.escape(token)}(?![\w-])", haystack) is not None


def is_composed(token: str, haystack: str) -> bool:
    """True when the token is built at runtime, e.g. ``me-actor-${actor.id}``.

    ``.me-actor-rect-1`` is a real, reachable element, but ``rect-1`` is an
    actor created during the tutorial — the literal class never appears in the
    source. Accept the token when a prefix of it is interpolated instead.
    """
    parts = token.split("-")
    for cut in range(len(parts) - 1, 0, -1):
        prefix = "-".join(parts[:cut])
        if f"{prefix}-${{" in haystack or f"{prefix}${{" in haystack:
            return True
    return False


def build_haystack() -> str:
    parts = []
    for directory in SEARCH_DIRS:
        base = ROOT / directory
        if not base.is_dir():
            continue
        for path in base.rglob("*"):
            if path.suffix in SEARCH_SUFFIXES and path.is_file():
                try:
                    parts.append(path.read_text(errors="ignore"))
                except OSError:
                    continue
    return "\n".join(parts)


def main() -> int:
    listing = "--list" in sys.argv
    haystack = build_haystack()
    records = sorted(TUTORIALS.glob("*/record.py"))
    if not records:
        print("no tutorials/*/record.py found", file=sys.stderr)
        return 1

    dead: list[str] = []
    checked = 0

    for record in records:
        name = record.parent.name
        rows = []
        for selector in selectors_for(record):
            for kind, token in tokens_for(selector):
                checked += 1
                if appears(token, haystack):
                    rows.append(("ok", kind, token, selector))
                elif kind == "class" and is_composed(token, haystack):
                    rows.append(("dyn", kind, token, selector))
                else:
                    rows.append(("DEAD", kind, token, selector))
                    dead.append(f"{name}: {kind} {token!r} (in {selector!r}) matches nothing")
        if listing:
            print(f"\n{name}")
            for status, kind, token, selector in rows:
                mark = {"ok": "  ", "dyn": "~ "}.get(status, "✗ ")
                print(f"  {mark}{kind:11} {token:32} {selector}")

    if dead:
        print(f"\nTutorial selector check FAILED — {len(dead)} dead reference(s):\n")
        for line in dead:
            print(f"  - {line}")
        print(
            "\nThe recorder targets something the source no longer renders. Fix the "
            "selector in record.py (and re-record), or restore the token."
        )
        return 1

    print(
        f"Tutorial selectors OK — {checked} token(s) across "
        f"{len(records)} recorder(s) all present in the source."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
