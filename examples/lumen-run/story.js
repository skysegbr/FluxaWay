import { GARDENS, beaconKey, litCount } from "./data.js";
import { SOUNDS } from "./sounds.js";

async function kindle(game, index) {
  if (game.state.paused || game.state.status !== "playing") return;
  if (game.state.bag < 3) {
    await game.say({ speaker: "A sleepy lantern", text: "Three little lights will wake me. Follow the golden sparks, then come back and press E." });
    return;
  }
  const key = beaconKey(game.scene, index);
  game.set((state) => ({ bag: state.bag - 3, lit: [...state.lit, key], score: state.score + 300 }));
  game.sound("lantern");
  if (litCount(game) < 3) return;
  const chapter = GARDENS.findIndex((garden) => garden.id === game.scene);
  if (chapter === GARDENS.length - 1) {
    game.set({ status: "won", score: game.state.score + game.state.health * 200 });
    game.sound("win");
    return;
  }
  const upgrade = await game.choose({
    speaker: "A gift from the garden",
    text: "Three lanterns, a thousand new dreams. Take a little magic for the road ahead.",
  }, [
    { id: "wing", label: "Swift wings · faster dash recharge", when: (g) => !g.state.upgrades.includes("wing") },
    { id: "satchel", label: "Deep pockets · carry 6 lights", when: (g) => !g.state.upgrades.includes("satchel") },
    { id: "heart", label: "Brave heart · one extra heart", when: (g) => !g.state.upgrades.includes("heart") },
  ]);
  const upgrades = [...game.state.upgrades, upgrade];
  game.set({ upgrades, bag: 0, combo: 0, health: upgrades.includes("heart") ? 4 : 3 });
  await game.goTo(GARDENS[chapter + 1].id);
}

export const STORY = {
  id: "lumen-run", version: 1, size: { w: 1200, h: 800 }, reach: 70,
  state: { status: "playing", paused: false, relaxed: false, health: 3, bag: 0, score: 0,
    combo: 0, bestCombo: 0, collected: [], lit: [], upgrades: [] },
  sounds: SOUNDS,
  scenes: GARDENS.map((garden) => ({
    id: garden.id, label: garden.name,
    hotspots: garden.beacons.map((at, index) => ({
      id: beaconKey(garden.id, index), at, radius: 75, label: "Kindle lantern · 3 lights",
      when: (game) => game.state.status === "playing" && !game.state.paused && !game.state.lit.includes(beaconKey(garden.id, index)),
      use: (game) => kindle(game, index),
    })),
  })),
};
