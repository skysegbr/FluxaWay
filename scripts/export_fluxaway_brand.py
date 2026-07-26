#!/usr/bin/env python3
"""Export FluxaWay SVG brand sources to deterministic PNG and ICO assets."""

import asyncio
import base64
import json
from pathlib import Path
import xml.etree.ElementTree as ET

from PIL import Image
from playwright.async_api import async_playwright


ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "assets" / "brand"


def svg_data_uri(path):
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"


async def render_svg(page, source, target, width, height):
    await page.set_viewport_size({"width": width, "height": height})
    await page.set_content(
        f"""
        <!doctype html>
        <style>
          html, body {{
            width: {width}px;
            height: {height}px;
            margin: 0;
            overflow: hidden;
            background: transparent;
          }}
          img {{
            display: block;
            width: 100%;
            height: 100%;
          }}
        </style>
        <img src="{svg_data_uri(source)}" alt="">
        """
    )
    await page.locator("img").evaluate(
        "(image) => image.decode ? image.decode() : Promise.resolve()"
    )
    await page.screenshot(path=str(target), omit_background=True)


def validate_sources():
    svg_paths = sorted(BRAND.glob("*.svg"))
    if not svg_paths:
        raise RuntimeError("No FluxaWay SVG sources found.")
    for path in svg_paths:
        ET.parse(path)
        source = path.read_text(encoding="utf-8")
        if "<text" in source or "font-family" in source:
            raise RuntimeError(f"{path.name} depends on a font.")
    json.loads((BRAND / "site.webmanifest").read_text(encoding="utf-8"))


def validate_exports(jobs):
    for _, target_name, width, height in jobs:
        with Image.open(BRAND / target_name) as image:
            if image.size != (width, height):
                raise RuntimeError(
                    f"{target_name}: expected {width}x{height}, got {image.size}."
                )
            if image.mode != "RGBA":
                raise RuntimeError(f"{target_name}: expected RGBA, got {image.mode}.")
    with Image.open(BRAND / "favicon.ico") as favicon:
        sizes = favicon.ico.sizes()
        expected = {(16, 16), (32, 32), (48, 48)}
        if not expected.issubset(sizes):
            raise RuntimeError(f"favicon.ico: missing sizes, found {sorted(sizes)}.")


async def export_assets():
    validate_sources()
    jobs = [
        ("fluxaway-logo.svg", "fluxaway-logo.png", 1560, 360),
        ("fluxaway-logo-dark.svg", "fluxaway-logo-dark.png", 1560, 360),
        ("fluxaway-logo-mono.svg", "fluxaway-logo-mono.png", 1560, 360),
        ("fluxaway-logo-inverse.svg", "fluxaway-logo-inverse.png", 1560, 360),
        ("fluxaway-symbol.svg", "fluxaway-symbol-512.png", 512, 369),
        ("fluxaway-symbol-mono.svg", "fluxaway-symbol-mono-512.png", 512, 369),
        ("fluxaway-symbol-inverse.svg", "fluxaway-symbol-inverse-512.png", 512, 369),
    ]
    icon_sizes = [16, 32, 48, 64, 128, 192, 256, 512]
    jobs.extend(
        ("fluxaway-app-icon.svg", f"icon-{size}.png", size, size)
        for size in icon_sizes
    )
    jobs.extend(
        [
            ("fluxaway-app-icon.svg", "favicon-16x16.png", 16, 16),
            ("fluxaway-app-icon.svg", "favicon-32x32.png", 32, 32),
            ("fluxaway-app-icon.svg", "apple-touch-icon.png", 180, 180),
        ]
    )

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page()
        for source_name, target_name, width, height in jobs:
            await render_svg(
                page,
                BRAND / source_name,
                BRAND / target_name,
                width,
                height,
            )
            print(f"exported {target_name} ({width}x{height})")
        await browser.close()

    with Image.open(BRAND / "icon-512.png") as icon:
        icon.save(
            BRAND / "favicon.ico",
            format="ICO",
            sizes=[(16, 16), (32, 32), (48, 48)],
        )
    print("exported favicon.ico (16x16, 32x32, 48x48)")
    validate_exports(jobs)
    print("FluxaWay brand asset validation passed.")


if __name__ == "__main__":
    asyncio.run(export_assets())
