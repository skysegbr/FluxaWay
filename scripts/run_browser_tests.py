#!/usr/bin/env python3
"""Run the FluxaWay browser test suite headlessly.

The suite itself stays exactly as it is — tests/index.html imports
dist/fluxaway.js and asserts against the real DOM, no test framework, no build
step. This script only automates what a human would do by hand: serve the
repo root, open tests/ in a browser, and read the results.

A second, short phase drives tests/trusted-input.html with a real mouse and
keyboard. A script inside the page can only dispatch untrusted events, which
move no focus and leave no pause between mousedown and mouseup — and that
pause is exactly where a layout shift eats a click.

The only dependency beyond the standard library is playwright
(`pip install playwright && playwright install chromium`), keeping the
project's no-Node rule intact.

Usage:
    python3 scripts/run_browser_tests.py [repo-root] [--browser chromium|firefox|webkit]

Exit code 0 when every test passes, 1 otherwise.
"""

from __future__ import annotations

import argparse
import http.server
import sys
import threading
from functools import partial
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print(
        "playwright is required: pip install playwright && playwright install chromium",
        file=sys.stderr,
    )
    sys.exit(2)

RESULTS_TIMEOUT_MS = 30_000
BROWSERS = ("chromium", "firefox", "webkit")
# A person holds the button for about this long; page.click() holds it for 0 ms.
HUMAN_PRESS_MS = 120


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):  # silence per-request logging
        pass


def serve(root: Path) -> tuple[http.server.ThreadingHTTPServer, int]:
    handler = partial(QuietHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, server.server_address[1]


def slow_click(page, selector: str) -> float:
    """Press, pause, release. Returns how far the target moved during the press."""
    before = page.locator(selector).bounding_box()
    page.mouse.move(before["x"] + before["width"] / 2, before["y"] + before["height"] / 2)
    page.mouse.down()
    page.wait_for_timeout(HUMAN_PRESS_MS)
    shift = page.locator(selector).bounding_box()["y"] - before["y"]
    page.mouse.up()
    page.wait_for_timeout(150)
    return shift


def count_clicks(page, selector: str) -> None:
    page.evaluate(
        """(selector) => {
            window.__clicks = 0;
            document.querySelector(selector).addEventListener("click", () => { window.__clicks += 1; });
        }""",
        selector,
    )


def error_texts(page, scope: str) -> list[str]:
    return page.evaluate(
        "(scope) => [...document.querySelectorAll(scope + ' .m-error')].map((e) => e.textContent)",
        scope,
    )


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def submit_with_invalid_focused_field(page) -> None:
    page.click("#t-name")
    page.keyboard.type("Ana")
    page.keyboard.press("Tab")
    page.keyboard.type("oi")  # invalid, and focus stays in the field
    count_clicks(page, "#t-submit")
    shift = slow_click(page, "#t-submit")
    expect(shift == 0, f"the submit button moved {shift}px while pressed")
    expect(page.evaluate("window.__clicks") == 1, "the click never reached the submit button")
    expect(page.evaluate("window.__submits") == 0, "an invalid form was submitted")
    expect("Message too short" in error_texts(page, "#s-submit"), "submit did not show the field's error")


def handle_submit_button_outside_a_form(page) -> None:
    page.click("#t-email")
    page.keyboard.type("nobody")
    count_clicks(page, "#t-send")
    shift = slow_click(page, "#t-send")
    expect(shift == 0, f"the button moved {shift}px while pressed")
    expect(page.evaluate("window.__clicks") == 1, "the click never reached the button")
    expect(error_texts(page, "#s-click") == ["Invalid e-mail"], "handleSubmit() did not show the error")
    page.click("#t-email")
    page.keyboard.type("@example.com")
    slow_click(page, "#t-send")
    expect(page.evaluate("window.__sends") == 1, "the valid form was not sent")


def checkbox_below_an_invalid_field(page) -> None:
    page.click("#t-name")
    page.keyboard.type("Ana")
    page.keyboard.press("Tab")
    page.keyboard.type("oi")
    shift = slow_click(page, "#t-terms")
    expect(shift == 0, f"the checkbox moved {shift}px while pressed")
    expect(page.evaluate("document.querySelector('#t-terms').checked"), "the click never toggled the checkbox")
    # The blur work was deferred, not dropped — and it saw the toggled value.
    expect("Message too short" in error_texts(page, "#s-submit"), "blur validation never ran after the release")
    expect(page.evaluate("window.__form.errors.terms") == "", "blur validated the values from before the click")


def keyboard_blur_validates_at_once(page) -> None:
    page.click("#t-name")
    page.keyboard.type("A")
    page.keyboard.press("Tab")
    page.wait_for_timeout(50)
    expect(error_texts(page, "#s-submit") == ["Name too short"], "Tab out of an invalid field showed no error")


def reset_supersedes_a_pending_blur(page) -> None:
    page.click("#t-name")
    page.keyboard.type("A")
    slow_click(page, "#t-reset")
    expect(error_texts(page, "#s-submit") == [], "an error appeared on a form that was just reset")
    expect(page.evaluate("Object.keys(window.__form.touched).length") == 0, "a field was touched after the reset")
    expect(page.evaluate("window.__form.values.name") == "", "reset did not clear the value")


PHONE = {"width": 390, "height": 800}
DESKTOP = {"width": 1280, "height": 720}

FOCUSED = """() => {
    const el = document.activeElement;
    return { id: el.id, text: el.textContent.trim(), inMenu: Boolean(el.closest(".m-navbar-menu")) };
}"""

NAVBAR_BOX = """(scope) => {
    const nav = document.querySelector(scope + " .m-navbar");
    const bar = nav.getBoundingClientRect();
    const box = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top - bar.top, bottom: r.bottom - bar.top, left: r.left - bar.left };
    };
    return {
        height: bar.height,
        toggle: box(nav.querySelector(".m-navbar-toggle")),
        brand: box(nav.querySelector(".m-navbar-brand")),
    };
}"""


def collapsed_navbar_menu_is_out_of_the_tab_order(page) -> None:
    page.focus("#s-navbar .m-navbar-toggle")
    page.keyboard.press("Tab")
    focused = page.evaluate(FOCUSED)
    expect(not focused["inMenu"], f"Tab from the toggle landed on hidden \"{focused['text']}\" inside the collapsed menu")

    page.focus("#s-navbar .m-navbar-toggle")
    page.keyboard.press("Enter")
    page.wait_for_timeout(350)
    walked = []
    for _ in range(3):
        page.keyboard.press("Tab")
        walked.append(page.evaluate(FOCUSED))
    expect([f["text"] for f in walked] == ["One", "Two", "Action"], f"open menu tab order was {[f['text'] for f in walked]}")

    page.keyboard.press("Escape")
    page.wait_for_timeout(350)
    page.focus("#s-navbar .m-navbar-toggle")
    page.keyboard.press("Tab")
    expect(not page.evaluate(FOCUSED)["inMenu"], "the menu stayed in the tab order after it closed")


def navbar_first_line_is_centred_and_does_not_move(page) -> None:
    for scope in ("#s-navbar", "#s-navbar-bare"):
        closed = page.evaluate(NAVBAR_BOX, scope)
        expect(closed["height"] == 60, f"{scope}: the collapsed bar is {closed['height']}px tall, not 60")
        centre = (closed["toggle"]["top"] + closed["toggle"]["bottom"]) / 2
        expect(abs(centre - closed["height"] / 2) <= 1, f"{scope}: the toggle is {centre - closed['height'] / 2:+.1f}px off the centre of the bar")

        page.click(scope + " .m-navbar-toggle")
        page.wait_for_timeout(350)
        opened = page.evaluate(NAVBAR_BOX, scope)
        expect(opened["height"] > 60, f"{scope}: the menu did not open")
        expect(opened["toggle"]["top"] == closed["toggle"]["top"], f"{scope}: the toggle moved {opened['toggle']['top'] - closed['toggle']['top']:+.1f}px when the menu opened")
        if closed["brand"]:
            expect(opened["brand"]["top"] == closed["brand"]["top"], f"{scope}: the brand moved when the menu opened")
            expect(closed["brand"]["left"] == 16, f"{scope}: the brand starts {closed['brand']['left']}px from the edge, not at the 16px padding")
        page.click(scope + " .m-navbar-toggle")
        page.wait_for_timeout(350)


def navbar_menu_is_inline_and_focusable_on_desktop(page) -> None:
    box = page.evaluate(NAVBAR_BOX, "#s-navbar")
    expect(box["height"] == 60, f"the desktop bar is {box['height']}px tall, not 60")
    expect(box["brand"]["left"] == 24, f"the brand starts {box['brand']['left']}px from the edge, not at the 24px padding")
    page.focus("#s-navbar .m-navbar-link")
    expect(page.evaluate(FOCUSED)["text"] == "One", "a desktop nav link could not take focus")


# (name, viewport, scenario). The page loads at its viewport: resizing a loaded
# page across the 768px breakpoint would start the Navbar's own transitions.
TRUSTED_INPUT_TESTS = (
    ("useForm (real mouse): a slow click on Submit lands while the focused field is invalid",
     DESKTOP, submit_with_invalid_focused_field),
    ("useForm (real mouse): a slow click on a handleSubmit() button outside a <form> lands",
     DESKTOP, handle_submit_button_outside_a_form),
    ("useForm (real mouse): a slow click on a checkbox below an invalid field toggles it, then blur validation runs",
     DESKTOP, checkbox_below_an_invalid_field),
    ("useForm (keyboard): Tab out of an invalid field shows its error at once",
     DESKTOP, keyboard_blur_validates_at_once),
    ("useForm (real mouse): Reset pressed over a pending blur leaves the form clean",
     DESKTOP, reset_supersedes_a_pending_blur),
    ("Navbar (keyboard, 390px): Tab skips the collapsed menu and walks it in order when open",
     PHONE, collapsed_navbar_menu_is_out_of_the_tab_order),
    ("Navbar (390px): the toggle is centred in the bar and the first line does not move when the menu opens",
     PHONE, navbar_first_line_is_centred_and_does_not_move),
    ("Navbar (1280px): the menu is inline, focusable, and the bar keeps its height",
     DESKTOP, navbar_menu_is_inline_and_focusable_on_desktop),
)


def run_trusted_input_tests(page, port: int) -> list[dict]:
    results = []
    for name, viewport, scenario in TRUSTED_INPUT_TESTS:
        try:
            page.set_viewport_size(viewport)
            page.goto(f"http://127.0.0.1:{port}/tests/trusted-input.html")
            page.wait_for_function("() => window.__ready === true", timeout=RESULTS_TIMEOUT_MS)
            scenario(page)
            results.append({"name": name, "status": "pass", "error": None})
        except Exception as error:  # a failed expectation or a playwright timeout
            results.append({"name": name, "status": "fail", "error": str(error).splitlines()[0]})
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("root", nargs="?", default=".",
                        help="repo root to serve (default: current directory)")
    parser.add_argument("--browser", choices=BROWSERS, default="chromium",
                        help="playwright browser to run the suite in "
                             "(default: chromium; install it first with "
                             "`playwright install <browser>`)")
    args = parser.parse_args()
    root = Path(args.root).resolve()

    if not (root / "tests" / "index.html").exists():
        print(f"tests/index.html not found under {root}", file=sys.stderr)
        return 2

    server, port = serve(root)

    try:
        with sync_playwright() as p:
            browser = getattr(p, args.browser).launch()
            page = browser.new_page()

            # Surface page-level errors (module parse failures, unhandled
            # rejections) that would otherwise leave the run hanging silently.
            page.on("pageerror", lambda e: print(f"page error: {e}", file=sys.stderr))

            page.goto(f"http://127.0.0.1:{port}/tests/")
            page.wait_for_function(
                "() => window.__fluxawayTestResults !== undefined",
                timeout=RESULTS_TIMEOUT_MS,
            )
            results = page.evaluate("() => window.__fluxawayTestResults")
            results += run_trusted_input_tests(page, port)
            browser.close()
    finally:
        server.shutdown()

    passed = [r for r in results if r["status"] == "pass"]
    failed = [r for r in results if r["status"] != "pass"]

    for r in results:
        mark = "✓" if r["status"] == "pass" else "✗"
        suffix = f" — {r['error']}" if r.get("error") else ""
        print(f"{mark} {r['name']}{suffix}")

    print(f"\n{len(passed)}/{len(results)} passed ({args.browser})")
    return 0 if not failed and results else 1


if __name__ == "__main__":
    sys.exit(main())
