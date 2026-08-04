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
    desktop.add_init_script("localStorage.setItem('fluxaway-theme', 'light')")
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
    expect(
        desktop.locator('.nd-hero-actions a[href="#/ai-security"]').count() == 1,
        "home does not introduce the AI and security guide",
    )
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

    expected_examples = [
        "/examples/basic/",
        "/examples/complete-page/",
        "/examples/components/",
        "/examples/designer/",
        "/examples/drug-recalls/",
        "/examples/fluxaway-architecture/",
        "/examples/fluxaway-atlas/",
        "/examples/fluxaway-motion/",
        "/examples/form/",
        "/examples/gallery/",
        "/examples/landing/",
        "/examples/mindmap/",
        "/examples/minified/",
        "/examples/mobile/",
        "/examples/motion-editor/",
        "/examples/motion-landing/",
        "/examples/palate-journey/",
        "/examples/ssr/",
        "/examples/star-atlas/",
        "/examples/storefront/",
    ]
    examples_trigger = desktop.locator(".nd-header-examples-trigger")
    examples_trigger.click()
    desktop.wait_for_selector('#docs-examples-menu[role="menu"]')
    example_links = desktop.locator(".nd-header-example-link")
    expect(example_links.count() == len(expected_examples), "examples menu has the wrong link count")
    found_examples = example_links.evaluate_all(
        "(links) => links.map((link) => link.getAttribute('href'))"
    )
    expect(found_examples == expected_examples, "examples menu does not match the build package")
    desktop.wait_for_function(
        "() => document.activeElement === document.querySelector('.nd-header-example-link')"
    )
    desktop.keyboard.press("End")
    expect(example_links.last.evaluate("(link) => document.activeElement === link"), "End missed last example")
    desktop.keyboard.press("Escape")
    expect(desktop.locator("#docs-examples-menu").count() == 0, "Escape did not close examples")
    expect(examples_trigger.evaluate("(button) => document.activeElement === button"), "focus not restored")
    passed.append("examples menu matches all 20 build links and supports keyboard navigation")

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

    open_route(desktop, base, "/ai-security", "AI & security")
    expect(desktop.locator('a[href="#/source/ai-spec"]').count() == 1, "AI_SPEC viewer link is missing")
    expect(desktop.locator('a[href="#/source/ai-qa"]').count() == 1, "AI QA viewer link is missing")
    expect(desktop.locator(".nd-ai-security-grid .nd-ai-card").count() == 3, "security pillars are missing")
    expect(desktop.locator(".nd-ai-workflow li").count() == 4, "prompt workflow is incomplete")
    expect(desktop.locator(".nd-ai-section .nd-code").count() == 2, "prompt examples are missing")
    expect(
        "Read docs/AI_SPEC.md completely" in desktop.locator(".nd-code-pre").first.inner_text(),
        "prompt template does not require AI_SPEC",
    )
    expect(desktop.locator(".nd-ai-checklist li").count() == 6, "AI review checklist is incomplete")
    passed.append("AI and security guide documents AI_SPEC, prompting and review")

    desktop.locator('a[href="#/source/ai-spec"]').click()
    desktop.wait_for_function("() => document.querySelector('h1')?.textContent === 'AI Reference Spec'")
    desktop.wait_for_selector(".nd-source-editor .CodeMirror")
    expect(
        "# FluxaWay — AI Reference Spec" in desktop.locator(".CodeMirror-code").inner_text(),
        "CodeEditor did not load the AI_SPEC contents",
    )
    expect(
        desktop.locator('.nd-source-editor[aria-label="AI Reference Spec, read only"]').count() == 1,
        "source CodeEditor is missing its read-only accessible name",
    )
    expect(
        desktop.locator('script[src="/assets/codemirror/codemirror.min.js"]').count() == 1,
        "source viewer did not load CodeMirror exactly once",
    )
    source_catalog = desktop.evaluate(
        """async () => {
          const { SOURCE_DOCUMENTS } = await import(
            "/examples/docs-site/content/sourceDocuments.js"
          );
          const { ENTRY_META } = await import(
            "/examples/docs-site/content/catalogData.js"
          );
          const { loadSource } = await import(
            "/examples/docs-site/content/entryLoader.js"
          );
          const results = await Promise.all(Object.values(SOURCE_DOCUMENTS).map(async (entry) => ({
            path: entry.path,
            status: (await fetch(entry.path)).status,
          })));
          const addonSources = [...new Set(
            ENTRY_META.filter((entry) => entry.category === "addons").map((entry) => entry.source)
          )];
          const addonEntries = (await Promise.all(addonSources.map(loadSource))).flat();
          const resources = addonEntries.flatMap((entry) => entry.resources ?? []);
          const missingResources = resources.filter((resource) => {
            if (!resource.href.startsWith("#/source/")) return true;
            return !SOURCE_DOCUMENTS[resource.href.slice("#/source/".length)];
          });
          return {
            count: results.length,
            failed: results.filter((entry) => entry.status !== 200),
            resourceCount: resources.length,
            missingResources,
            previewCount: Object.values(SOURCE_DOCUMENTS).filter((entry) => entry.previewPath).length,
          };
        }"""
    )
    expect(source_catalog["count"] == 15, "source viewer catalog is incomplete")
    expect(not source_catalog["failed"], f"source viewer files failed: {source_catalog['failed']}")
    expect(source_catalog["resourceCount"] == 13, "add-on resource catalog is incomplete")
    expect(
        not source_catalog["missingResources"],
        f"resources outside CodeEditor: {source_catalog['missingResources']}",
    )
    expect(source_catalog["previewCount"] == 7, "example viewers are missing demo actions")

    open_route(desktop, base, "/source/motion-runtime-example", "Runtime showcase source")
    desktop.wait_for_selector(".nd-source-editor .CodeMirror")
    expect(
        desktop.locator('a[href="/examples/fluxaway-motion/"]').count() == 1,
        "runtime source viewer does not preserve access to the live demo",
    )
    passed.append("CodeEditor renders every resource and preserves live example actions")

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

    desktop.keyboard.press("Control+k")
    desktop.wait_for_selector('[role="dialog"] input[role="combobox"]')
    desktop.keyboard.type("breakpoints")
    desktop.keyboard.press("Enter")
    desktop.wait_for_function(
        "() => document.querySelector('h1')?.textContent === 'Grid & breakpoints'"
    )
    expect(desktop.locator("h1").inner_text() == "Grid & breakpoints", "search omitted CSS docs")

    desktop.keyboard.press("Control+k")
    desktop.wait_for_selector('[role="dialog"] input[role="combobox"]')
    desktop.keyboard.type("AI_SPEC")
    desktop.keyboard.press("Enter")
    desktop.wait_for_function("() => document.querySelector('h1')?.textContent === 'AI & security'")
    expect(desktop.locator("h1").inner_text() == "AI & security", "search omitted AI_SPEC guide")
    passed.append("Ctrl/Cmd+K search navigates to component, CSS and AI references")

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
    passed.append("CodeMirror is shared once across routes that need it")

    open_route(desktop, base, "/components/data-table", "DataTable")
    expect(
        desktop.locator('link[href$="/dist/fluxaway-ui-data.css"]').count() == 1,
        "data category CSS was not loaded with DataTable",
    )
    passed.append("route content loads its matching category CSS")

    for route, heading in (
        ("/css/installation", "Installation & bundles"),
        ("/css/tokens-themes", "Tokens, themes & palettes"),
        ("/css/grid-breakpoints", "Grid & breakpoints"),
        ("/css/layout-flex", "Layout & flex"),
        ("/css/spacing", "Spacing"),
        ("/css/typography", "Typography"),
        ("/css/display-utilities", "Display & utilities"),
        ("/css/animations", "Animations"),
    ):
        open_route(desktop, base, route, heading)
        expect(desktop.locator(".nd-demo").count() > 0, f"{route}: expected documented examples")
        expect(desktop.locator(".nd-props-table").count() > 0, f"{route}: expected reference tables")
    expect(
        desktop.locator('link[href$="/components/reference/CssReference.css"]').count() == 1,
        "CSS reference presentation stylesheet was not loaded exactly once",
    )
    expect(
        desktop.locator(".nd-code-lang").first.inner_text() == "Stylesheet",
        "CSS reference did not present its stylesheet include",
    )
    passed.append("all eight CSS reference pages render examples and tables")

    # (route, heading, how many live demos that page ships)
    for route, heading, demos in (
        ("/addons/fluxaway-motion", "FluxaWay Motion", 1),
        ("/addons/zoom-stage", "ZoomStage", 1),
        ("/addons/pipeline-canvas", "PipelineCanvas", 1),
        ("/addons/full-code-editor", "FullCodeEditor", 1),
        ("/addons/fluxaway-charts", "FluxaWay Charts", 10),
    ):
        open_route(desktop, base, route, heading)
        found = desktop.locator(".nd-demo-preview").count()
        expect(found == demos, f"{route}: expected {demos} live demo(s), found {found}")
    passed.append("all five add-on pages render live demos")

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
    expect(catalog["count"] == 107, f"expected 107 catalog entries, got {catalog['count']}")
    expect(catalog["mismatched"] == 0, f"{catalog['mismatched']} catalog modules do not match metadata")
    expect(catalog["unique"] == catalog["count"], "catalog contains duplicate slugs")
    passed.append("catalog metadata matches all 107 lazy entries")

    expect(not errors, "browser errors: " + " | ".join(errors))
    expect(not failed_responses, "failed responses: " + " | ".join(failed_responses))
    passed.append("desktop console and requests are clean")
    desktop.context.browser.close()

    mobile = browser_type.launch().new_page(viewport={"width": 390, "height": 844})
    mobile.add_init_script("localStorage.setItem('fluxaway-theme', 'light')")
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
    menu = mobile.locator(".nd-mobile-navbar .m-navbar-toggle")
    shell_top = mobile.locator(".nd-shell").bounding_box()["y"]
    menu.click()
    mobile.wait_for_selector(".nd-mobile-navbar.m-navbar-open")
    mobile.wait_for_timeout(250)
    expect(menu.get_attribute("aria-expanded") == "true", "mobile Navbar did not expand")
    expect(
        mobile.locator(".nd-shell").bounding_box()["y"] > shell_top,
        "inline Navbar did not push the docs content down",
    )
    expect(
        mobile.evaluate("getComputedStyle(document.body).overflow") != "hidden",
        "inline Navbar unexpectedly locked page scroll",
    )
    mobile.keyboard.press("Escape")
    mobile.wait_for_function(
        "() => document.querySelector('.nd-mobile-navbar .m-navbar-toggle')?.getAttribute('aria-expanded') === 'false'"
    )

    menu.click()
    mobile.wait_for_selector(".nd-mobile-navbar.m-navbar-open")
    mobile.locator('.nd-mobile-navigation a[href="#/getting-started"]').click()
    mobile.wait_for_function("() => document.querySelector('h1')?.textContent === 'Getting started'")
    mobile.wait_for_function(
        "() => document.activeElement === document.querySelector('#docs-content h1')"
    )
    expect(menu.get_attribute("aria-expanded") == "false", "route navigation did not close Navbar")

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
    passed.append("mobile inline Navbar is accessible")
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
