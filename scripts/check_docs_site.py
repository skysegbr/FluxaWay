#!/usr/bin/env python3
"""Smoke-test examples/docs-site in a real browser."""

from __future__ import annotations

import argparse
import http.server
import sys
import threading
import traceback
from functools import partial
from pathlib import Path

from playwright.sync_api import sync_playwright


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve(root: Path) -> tuple[http.server.ThreadingHTTPServer, int]:
    handler = partial(QuietHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, server.server_address[1]


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def open_route(page, base: str, route: str, heading: str) -> None:
    page.goto(f"{base}#{route}", wait_until="load")
    page.wait_for_selector("h1")
    expect(page.locator("h1").inner_text() == heading, f"{route}: expected h1 {heading!r}")


def run(browser_type, base: str) -> list[str]:
    passed: list[str] = []

    desktop = browser_type.launch().new_page(viewport={"width": 1440, "height": 900})
    desktop.add_init_script("localStorage.setItem('nexa-theme', 'light')")
    errors: list[str] = []
    failed_responses: list[str] = []
    requests: list[str] = []
    desktop.on("pageerror", lambda error: errors.append(str(error)))
    desktop.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    desktop.on(
        "response",
        lambda response: failed_responses.append(f"{response.status} {response.url}")
        if response.status >= 400
        else None,
    )
    desktop.on("request", lambda request: requests.append(request.url))

    desktop.goto(base, wait_until="load")
    desktop.wait_for_selector("h1")
    expect(desktop.locator("h1").inner_text() == "Code flows. Your way.", "home did not render")
    expect(desktop.title().startswith("FluxaWay Docs"), "FluxaWay document title is missing")
    expect(
        desktop.locator('link[rel="manifest"][href="/assets/brand/site.webmanifest"]').count() == 1,
        "FluxaWay web manifest is missing",
    )
    expect(desktop.evaluate("document.documentElement.scrollWidth <= innerWidth"), "desktop overflow")
    expect(not any("/content/core/" in url for url in requests), "home eagerly loaded reference content")
    expect(not any("codemirror.min.js" in url for url in requests), "home eagerly loaded CodeMirror")
    expect(not any("/dist/fluxaway-ui.css" in url for url in requests), "home loaded monolithic UI CSS")
    passed.append("home renders without eager reference payload")

    expect(
        desktop.locator(".nd-header-logo-light").evaluate(
            "(logo) => getComputedStyle(logo).display !== 'none'"
        ),
        "light theme did not show the light-background logo",
    )
    expect(
        desktop.locator(".nd-header-logo-dark").evaluate(
            "(logo) => getComputedStyle(logo).display === 'none'"
        ),
        "light theme showed the dark-background logo",
    )
    desktop.locator('[aria-label="Switch to dark theme"]').click()
    desktop.wait_for_function("() => document.documentElement.dataset.theme === 'dark'")
    expect(
        desktop.locator(".nd-header-logo-light").evaluate(
            "(logo) => getComputedStyle(logo).display === 'none'"
        ),
        "dark theme showed the light-background logo",
    )
    expect(
        desktop.locator(".nd-header-logo-dark").evaluate(
            "(logo) => getComputedStyle(logo).display !== 'none'"
        ),
        "dark theme did not show the dark-background logo",
    )
    desktop.locator('[aria-label="Switch to light theme"]').click()
    desktop.wait_for_function("() => document.documentElement.dataset.theme === 'light'")
    passed.append("FluxaWay logo follows the active light and dark theme")

    desktop.locator('.nd-sidebar-link[href="#/getting-started"]').click()
    desktop.wait_for_function("() => document.querySelector('h1')?.textContent === 'Getting started'")
    desktop.wait_for_function(
        "() => document.activeElement === document.querySelector('#docs-content h1')"
    )
    passed.append("route navigation focuses the new page heading")

    desktop.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)")
    desktop.wait_for_function(
        """() => document.querySelector(
          ".nd-toc-list li:last-child .nd-toc-link"
        )?.getAttribute("aria-current") === "location" """
    )
    passed.append("scroll spy activates the final section at page end")

    desktop.keyboard.press("Control+k")
    desktop.wait_for_selector('[role="dialog"] input[role="combobox"]')
    expect(
        desktop.evaluate("document.activeElement?.getAttribute('role')") == "combobox",
        "search did not focus its combobox",
    )
    desktop.keyboard.type("Button")
    desktop.keyboard.press("Enter")
    desktop.wait_for_function("() => document.querySelector('h1')?.textContent === 'Button'")
    expect(desktop.locator("h1").inner_text() == "Button", "search did not navigate to Button")
    passed.append("Ctrl/Cmd+K search navigates")

    open_route(desktop, base, "/components/code-editor", "CodeEditor")
    desktop.wait_for_selector(".CodeMirror")
    expect(
        desktop.locator('script[src="/assets/codemirror/codemirror.min.js"]').count() == 1,
        "CodeMirror was not loaded exactly once",
    )
    expect(
        desktop.locator('link[href$="/dist/fluxaway-ui-forms.css"]').count() == 1,
        "forms category CSS was not loaded with CodeEditor",
    )
    passed.append("CodeMirror loads only on its route")

    open_route(desktop, base, "/components/data-table", "DataTable")
    expect(
        desktop.locator('link[href$="/dist/fluxaway-ui-data.css"]').count() == 1,
        "data category CSS was not loaded with DataTable",
    )
    passed.append("route content loads its matching category CSS")

    for route, heading in (
        ("/addons/fluxaway-motion", "useTimeline"),
        ("/addons/zoom-stage", "ZoomStage"),
        ("/addons/pipeline-canvas", "PipelineCanvas"),
        ("/addons/full-code-editor", "FullCodeEditor"),
    ):
        open_route(desktop, base, route, heading)
        expect(desktop.locator(".nd-demo-preview").count() == 1, f"{route}: live demo missing")
    passed.append("all four add-on pages render live demos")

    desktop.set_viewport_size({"width": 1440, "height": 520})
    open_route(desktop, base, "/addons/zoom-stage", "ZoomStage")
    active_link_visible = desktop.evaluate(
        """() => {
          const nav = document.querySelector(".nd-sidebar:not(.nd-sidebar-mobile)");
          const link = nav?.querySelector('[aria-current="page"]');
          if (!nav || !link) return false;
          const navRect = nav.getBoundingClientRect();
          const linkRect = link.getBoundingClientRect();
          return linkRect.top >= navRect.top && linkRect.bottom <= navRect.bottom;
        }"""
    )
    expect(active_link_visible, "sidebar did not reveal its active link")
    passed.append("sidebar keeps its active link visible")

    catalog = desktop.evaluate(
        """async () => {
          const data = await import("/examples/docs-site/content/catalogData.js");
          const loader = await import("/examples/docs-site/content/entryLoader.js");
          const expected = new Map();
          for (const entry of data.ENTRY_META) {
            if (!expected.has(entry.source)) expected.set(entry.source, []);
            expected.get(entry.source).push(entry);
          }
          const checks = await Promise.all([...expected].map(async ([source, meta]) => {
            const rows = await loader.loadSource(source);
            const wanted = meta.map((entry) => entry.slug).sort().join(",");
            const actual = rows.map((entry) => entry.slug).sort().join(",");
            return wanted === actual;
          }));
          return {
            count: data.ENTRY_META.length,
            mismatched: checks.filter((matches) => !matches).length,
            unique: new Set(data.ENTRY_META.map((entry) => entry.slug)).size,
          };
        }"""
    )
    expect(catalog["count"] == 98, f"expected 98 catalog entries, got {catalog['count']}")
    expect(catalog["mismatched"] == 0, f"{catalog['mismatched']} catalog modules do not match metadata")
    expect(catalog["unique"] == catalog["count"], "catalog contains duplicate slugs")
    passed.append("catalog metadata matches all 98 lazy entries")

    expect(not errors, "browser errors: " + " | ".join(errors))
    expect(not failed_responses, "failed responses: " + " | ".join(failed_responses))
    passed.append("desktop console and requests are clean")
    desktop.context.browser.close()

    mobile = browser_type.launch().new_page(viewport={"width": 390, "height": 844})
    mobile.add_init_script("localStorage.setItem('nexa-theme', 'light')")
    mobile_errors: list[str] = []
    mobile.on("pageerror", lambda error: mobile_errors.append(str(error)))
    mobile.on(
        "console",
        lambda msg: mobile_errors.append(msg.text) if msg.type == "error" else None,
    )
    mobile.goto(base, wait_until="load")
    mobile.wait_for_selector("h1")
    expect(mobile.evaluate("document.documentElement.scrollWidth <= innerWidth"), "mobile overflow")
    expect(
        mobile.locator(".nd-header-search").get_attribute("aria-label") == "Search documentation",
        "mobile search has no accessible name",
    )
    mobile.locator(".nd-header-burger").click()
    mobile.wait_for_selector(".m-drawer")
    expect(mobile.evaluate("getComputedStyle(document.body).overflow") == "hidden", "scroll not locked")
    mobile.keyboard.press("Escape")
    mobile.wait_for_timeout(100)
    expect(mobile.locator(".m-drawer").count() == 0, "Escape did not close the drawer")
    expect(
        "nd-header-burger" in (mobile.evaluate("document.activeElement?.className") or ""),
        "drawer did not restore focus",
    )

    mobile.locator(".nd-header-burger").click()
    mobile.wait_for_selector(".m-drawer")
    mobile.locator('.m-drawer a[href="#/getting-started"]').click()
    mobile.wait_for_function("() => document.querySelector('h1')?.textContent === 'Getting started'")
    mobile.wait_for_function(
        "() => document.activeElement === document.querySelector('#docs-content h1')"
    )
    expect(mobile.locator(".m-drawer").count() == 0, "route navigation did not close drawer")

    mobile.wait_for_selector(".nd-toc-mobile")
    summary = mobile.locator(".nd-toc-mobile summary")
    expect(summary.get_attribute("aria-expanded") != "true", "mobile TOC starts expanded")
    summary.click()
    expect(
        mobile.locator(".nd-toc-mobile .nd-toc-link").count() == 4,
        "mobile TOC does not list all sections",
    )
    mobile.locator(".nd-toc-mobile .nd-toc-link").last.click()
    mobile.wait_for_function(
        """() => document.querySelector(
          ".nd-toc-mobile .nd-toc-list li:last-child .nd-toc-link"
        )?.getAttribute("aria-current") === "location" """
    )
    expect(
        mobile.locator(".nd-toc-mobile details").get_attribute("open") is None,
        "mobile TOC did not collapse after navigation",
    )
    mobile.wait_for_function(
        """() => document.activeElement === document.querySelector(
          "#cdn h2"
        )"""
    )
    expect(
        mobile.evaluate("document.documentElement.scrollWidth <= innerWidth"),
        "mobile TOC caused overflow",
    )
    passed.append("mobile TOC and route focus are accessible")

    mobile.set_viewport_size({"width": 1024, "height": 768})
    mobile.wait_for_selector(".nd-sidebar:not(.nd-sidebar-mobile)")
    expect(mobile.locator(".nd-toc-mobile").count() == 1, "tablet TOC is missing")
    expect(
        mobile.evaluate("document.documentElement.scrollWidth <= innerWidth"),
        "tablet layout overflow",
    )
    passed.append("compact TOC works alongside the tablet sidebar")

    expect(not mobile_errors, "mobile browser errors: " + " | ".join(mobile_errors))
    passed.append("mobile header and drawer are accessible")
    mobile.context.browser.close()

    return passed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=".")
    parser.add_argument("--browser", choices=("chromium", "firefox", "webkit"), default="chromium")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    server, port = serve(root)

    try:
        with sync_playwright() as playwright:
            passed = run(getattr(playwright, args.browser), f"http://127.0.0.1:{port}/examples/docs-site/")
    except Exception as error:
        print(f"✗ docs-site smoke ({args.browser}) — {error}", file=sys.stderr)
        traceback.print_exc()
        return 1
    finally:
        server.shutdown()

    for result in passed:
        print(f"✓ {result}")
    print(f"\n{len(passed)}/{len(passed)} docs-site checks passed ({args.browser})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
