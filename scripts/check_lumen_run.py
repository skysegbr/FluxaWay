#!/usr/bin/env python3
"""Exercise Lumen Run over HTTP with real keyboard/pointer input (no Node).

python3 scripts/check_lumen_run.py --browser chromium [--walkthrough]
The optional walkthrough collects and delivers every light needed to win,
using collision-aware routes and real key presses, never teleporting the player.
"""
import argparse
import heapq
import math
from pathlib import Path

from playwright.sync_api import sync_playwright
from run_browser_tests import serve

ROOT = Path(__file__).resolve().parents[1]


def mechanics(page):
    """Use stage-save fixtures to exercise collisions, damage and defeat deterministically."""
    result = page.evaluate("""async () => {
      const {createGame, createLoop} = await import('/dist/fluxaway-game.js');
      const {STORY} = await import('/examples/lumen-run/story.js');
      const {createWorld} = await import('/examples/lumen-run/world.js');
      const game = createGame({...STORY, storage: false});
      const canvas = document.createElement('canvas');
      let direction = {x: 0, y: 0}, dash = false;
      const input = {vector: () => direction, pressed: () => { const once = dash; dash = false; return once; }};
      const world = createWorld({canvas, game, input});
      const detach = game.attachStage(world);
      const loop = createLoop({update: dt => world.update(dt)});
      const advance = seconds => { for (let i = 0; i < seconds * 60; i++) loop.advance(1 / 60); };
      const check = (condition, message) => { if (!condition) throw new Error(message); };
      await game.start();
      try {
        world.load({player: {x: 590, y: 550, dx: 0, dy: -1}});
        direction = {x: 0, y: 1}; dash = true; advance(0.4);
        check(world.save().player.y >= 532, 'Dash tunnelled through the central rock');
        world.load({player: {x: 600, y: 680, dx: 0, dy: 1}});
        direction = {x: 0, y: -1}; advance(1);
        check(world.save().player.y <= 705, 'Courier escaped the island');
        direction = {x: 0, y: 0};
        const fixture = (x, enemyX) => ({player: {x, y: 650, dx: 1, dy: 0},
          enemies: [{x: enemyX, y: 650, homeX: enemyX, homeY: 650, speed: 0, stunned: 0}]});
        world.load(fixture(550, 600)); dash = true; advance(0.2);
        check(world.save().enemies[0].stunned > 2, 'Dash did not stun the shadow');
        check(game.state.health === 3, 'Dashing cost a heart');
        game.set({bag: 2, combo: 4});
        world.load(fixture(600, 600)); advance(2);
        check(game.state.health === 2, 'Shadow did not damage the courier');
        check(game.state.bag === 2 && game.state.combo === 0, 'Hit lost lights or preserved the streak');
        advance(0.5);
        check(game.state.health === 2, 'Post-hit invulnerability did not hold');
        advance(5);
        check(game.state.status === 'lost' && game.state.health === 0, 'Defeat was not reached');
        const frozen = world.save().elapsed; advance(1);
        check(world.save().elapsed === frozen, 'Defeated world still simulated');
        game.reset(); await game.start(); game.set('relaxed', true);
        world.load(fixture(600, 600)); advance(8);
        check(game.state.health === 3 && game.state.status === 'playing', 'Gentle journey took damage');
        game.reset();
        check(!game.started && game.state.health === 3 && game.state.lit.length === 0, 'Restart did not reset the run');
        return 'rock/edge collision, dash stun, damage, invulnerability, defeat, gentle mode, reset: PASS';
      } finally { loop.stop(); detach(); world.destroy(); game.destroy(); }
    }""")
    print(result, flush=True)


def state(page):
    return page.evaluate("""async () => {
      const {game} = await import('/examples/lumen-run/app.js');
      game.save();
      return { ...game.state, scene: game.scene, busy: game.busy,
        stage: JSON.parse(localStorage.getItem('fluxaway-game:lumen-run'))?.stage };
    }""")


def pose(page):
    return state(page)["stage"]["player"]


def hold(page, keys, milliseconds):
    for key in keys:
        page.keyboard.down(key)
    page.wait_for_timeout(milliseconds)
    for key in keys:
        page.keyboard.up(key)


def route(start, target, garden):
    step = 20

    def clear(x, y):
        return ((x - 600) / 425) ** 2 + ((y - 410) / 295) ** 2 < 0.99 and all(
            math.hypot(x - rx, y - ry) > radius + 19 for rx, ry, radius in garden["rocks"])

    origin = (round(start["x"] / step), round(start["y"] / step))
    goal = (round(target[0] / step), round(target[1] / step))
    queue = [(0, origin)]
    cost = {origin: 0}
    parent = {}
    while queue:
        _, here = heapq.heappop(queue)
        if here == goal:
            path = [here]
            while here in parent:
                here = parent[here]
                path.append(here)
            points = [(x * step, y * step) for x, y in reversed(path)]
            # Keep corners only, allowing long, natural key holds.
            result = []
            for i in range(1, len(points) - 1):
                a, b, c = points[i-1:i+2]
                if (b[0]-a[0], b[1]-a[1]) != (c[0]-b[0], c[1]-b[1]):
                    result.append(b)
            return result + [target]
        for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]:
            nxt = here[0] + dx, here[1] + dy
            if not clear(nxt[0] * step, nxt[1] * step):
                continue
            if dx and dy and not (clear(here[0]*step, nxt[1]*step) and clear(nxt[0]*step, here[1]*step)):
                continue
            price = cost[here] + math.hypot(dx, dy)
            if price < cost.get(nxt, float("inf")):
                cost[nxt] = price
                parent[nxt] = here
                heapq.heappush(queue, (price + math.hypot(nxt[0]-goal[0], nxt[1]-goal[1]), nxt))
    raise AssertionError(f"No route to {target}")


def walk(page, target, garden):
    for x, y in route(pose(page), target, garden):
        for _ in range(50):
            current = pose(page)
            dx, dy = x - current["x"], y - current["y"]
            if math.hypot(dx, dy) < 13:
                break
            keys = []
            distances = []
            if abs(dx) > 7:
                keys.append("ArrowRight" if dx > 0 else "ArrowLeft")
                distances.append(abs(dx))
            if abs(dy) > 7:
                keys.append("ArrowDown" if dy > 0 else "ArrowUp")
                distances.append(abs(dy))
            duration = min(250, max(25, min(distances) / (210 / math.sqrt(len(keys))) * 1000 - 15))
            hold(page, keys, duration)
        else:
            raise AssertionError(f"Movement stuck near {current}, wanted {(x, y)}")


def walkthrough(page):
    page.get_by_label("Gentle journey", exact=False).check()
    page.get_by_role("button", name="Enter the garden").click()
    gardens = page.evaluate("async () => (await import('/examples/lumen-run/data.js')).GARDENS")
    for chapter, garden in enumerate(gardens):
        assert state(page)["scene"] == garden["id"]
        for delivery in range(3):
            while state(page)["bag"] < 3:
                snap = state(page)
                available = [point for i, point in enumerate(garden["lights"])
                             if f'{garden["id"]}:{i}' not in snap["collected"]]
                player = snap["stage"]["player"]
                target = min(available, key=lambda point: math.hypot(point[0]-player["x"], point[1]-player["y"]))
                before = snap["bag"]
                walk(page, target, garden)
                assert state(page)["bag"] > before, "Walking over a light did not collect it"
            snap = state(page)
            available = [(i, point) for i, point in enumerate(garden["beacons"])
                         if f'{garden["id"]}-{i}' not in snap["lit"]]
            player = snap["stage"]["player"]
            index, target = min(available, key=lambda item: math.hypot(item[1][0]-player["x"], item[1][1]-player["y"]))
            walk(page, target, garden)
            page.get_by_role("button", name="Kindle lantern").wait_for()
            page.keyboard.press("e")
            page.wait_for_timeout(100)
            assert f'{garden["id"]}-{index}' in state(page)["lit"]
            print(f"  Garden {chapter + 1}, lantern {delivery + 1}: collected and delivered", flush=True)
        if chapter < 2:
            choice = "Deep pockets" if chapter == 0 else "Swift wings"
            page.get_by_role("button", name=choice, exact=False).click()
            page.wait_for_function("chapter => document.querySelector('.lr-chapter .lr-eyebrow').textContent.includes(chapter)", arg=f"0{chapter+2}")
    assert state(page)["status"] == "won"
    assert len(state(page)["lit"]) == 9
    page.get_by_role("heading", name="You brought back the light.").wait_for()
    print("  Victory, upgrades and all nine lanterns: PASS", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", choices=["chromium", "firefox", "webkit"], default="chromium")
    parser.add_argument("--walkthrough", action="store_true")
    parser.add_argument("--mechanics-only", action="store_true")
    args = parser.parse_args()
    server, port = serve(ROOT)
    url = f"http://127.0.0.1:{port}/examples/lumen-run/"
    errors = []
    try:
        with sync_playwright() as playwright:
            browser = getattr(playwright, args.browser).launch()
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
            page.goto(url)
            mechanics(page)
            if args.mechanics_only:
                assert not errors, "Browser errors: " + "\n".join(errors)
                browser.close()
                return
            page.get_by_role("button", name="Enter the garden").click()
            page.wait_for_timeout(100)
            initial = pose(page)
            hold(page, ["ArrowLeft"], 350)
            assert pose(page)["x"] < initial["x"] - 40
            assert state(page)["bag"] >= 1
            before = pose(page)
            hold(page, ["ArrowLeft", "Space"], 160)
            assert before["x"] - pose(page)["x"] > 60, "Dash did not accelerate"
            page.keyboard.press("Escape")
            page.get_by_role("heading", name="Take a little breather.").wait_for()
            frozen = pose(page)
            hold(page, ["ArrowRight"], 220)
            assert pose(page)["x"] == frozen["x"], "Paused player moved"
            page.get_by_role("button", name="Turn sound off", exact=True).click()
            page.get_by_role("button", name="Keep going").click()
            saved = state(page)
            page.reload()
            page.get_by_role("button", name="Start a new journey").click()
            page.get_by_role("button", name="Keep my journey").click()
            page.get_by_role("button", name="Continue your journey").click()
            assert abs(pose(page)["x"] - saved["stage"]["player"]["x"]) < 1
            assert state(page)["bag"] == saved["bag"]
            assert page.get_by_role("button", name="Turn sound on", exact=True).count() == 1
            page.evaluate("window.dispatchEvent(new Event('blur'))")
            assert state(page)["paused"], "Losing focus must pause the game"
            print(f"{args.browser}: movement, pickup, dash, pause, mute, save/resume, restart cancellation: PASS", flush=True)
            if args.walkthrough:
                fresh = browser.new_page(viewport={"width": 1440, "height": 900})
                fresh.on("pageerror", lambda error: errors.append(str(error)))
                fresh.goto(url)
                walkthrough(fresh)
                fresh.close()
            mobile = browser.new_page(viewport={"width": 390, "height": 844}, has_touch=True, device_scale_factor=2)
            mobile.on("pageerror", lambda error: errors.append(str(error)))
            mobile.goto(url)
            mobile.get_by_role("button", name="Enter the garden").click()
            mobile.wait_for_timeout(150)
            assert mobile.evaluate("document.documentElement.scrollWidth <= innerWidth")
            start = pose(mobile)
            stick = mobile.locator(".lr-stick").bounding_box()
            mobile.mouse.move(stick["x"] + stick["width"] / 2, stick["y"] + stick["height"] / 2)
            mobile.mouse.down()
            mobile.mouse.move(stick["x"] + stick["width"] - 5, stick["y"] + stick["height"] / 2)
            mobile.wait_for_timeout(250)
            mobile.mouse.up()
            assert pose(mobile)["x"] > start["x"] + 20, "Touch stick did not move the player"
            mobile.get_by_role("button", name="Dash", exact=True).tap()
            mobile.wait_for_timeout(100)
            assert pose(mobile)["cooldown"] > 0, "Touch dash did not fire"
            evidence = ROOT / "docs" / "qa-evidence"
            evidence.mkdir(exist_ok=True)
            mobile.screenshot(path=str(evidence / f"lumen-run-{args.browser}-mobile.png"))
            print(f"{args.browser}: 390px layout, pointer stick and touch dash: PASS", flush=True)
            assert not errors, "Browser errors: " + "\n".join(errors)
            browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
