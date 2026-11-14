// The whole story: what exists, where it is, and what happens when it is
// pressed. The art is in components/; a scene only names the component.
import { h } from "/dist/fluxaway.js";
import { cutscenes } from "./cutscenes.js";
import { SOUNDS } from "./sounds.js";
import { ShoreScene } from "./components/ShoreScene.js";
import { DoorScene } from "./components/DoorScene.js";
import { LampScene } from "./components/LampScene.js";

const KEEPER = "Keeper's note";

export const STORY = {
  id: "lantern-keeper",
  version: 1,
  state: { unlocked: false, lit: false, farewell: false },
  sounds: SOUNDS,

  items: {
    key: { name: "Iron key", icon: "🗝", description: "Heavy, and wrapped in oilcloth." },
    oil: { name: "Lamp oil", icon: "🛢", description: "A full can. It sloshes." },
  },

  journal: {
    tide: { title: "The tide board", text: "Low water until dawn. No boat leaves this cove in the dark." },
    keeper: { title: "The brass plaque", text: "“Whoever finds the door locked: the key sleeps where the sea brings things.”" },
    log: { title: "The keeper's log", text: "Last entry, three nights old: “Reservoir dry. Gone for oil. Left the can by the steps.”" },
    light: { title: "The lantern", text: "Lit again. The beam reaches the water, and the way home with it." },
  },

  // One world, read bottom to top: the cove, the foot of the tower, the lamp
  // room. The camera climbs the lighthouse with the player.
  scenes: [
    {
      id: "shore",
      label: "The cove",
      x: 0,
      y: 1150,
      render: (scene) => h(ShoreScene, scene),
      enter: async (game, { first }) => {
        if (first) {
          await game.say([
            "The tide left your boat on the sand, and the night has no moon to row by.",
            "Up on the rock, the lighthouse is dark.",
          ]);
        } else if (game.get("lit") && !game.get("farewell")) {
          game.set("farewell", true);
          await game.say([
            "The beam sweeps the cove and lays a road of light on the water.",
            "When the tide turns, you will know the way.",
          ]);
        }
      },
      hotspots: [
        {
          id: "crate",
          label: "Driftwood crate",
          kind: "take",
          x: 230,
          y: 610,
          w: 240,
          h: 170,
          when: (game) => !game.has("key") && !game.get("unlocked"),
          use: async (game) => {
            await game.say("Under the lid, wrapped in oilcloth: an iron key.");
            game.give("key");
          },
        },
        {
          id: "board",
          label: "Tide board",
          kind: "look",
          x: 700,
          y: 430,
          w: 170,
          h: 300,
          use: async (game) => {
            await game.say("Chalk on slate. Low water until dawn.");
            game.note("tide");
          },
        },
        {
          id: "boat",
          label: "Your boat",
          kind: "look",
          x: 930,
          y: 640,
          w: 330,
          h: 150,
          use: (game) => game.say(
            game.get("lit") ? "She will float again at dawn — and now there is a light to steer by." : "Aground until the tide comes back. And then, which way?",
          ),
        },
        { id: "path", label: "Path up to the lighthouse", x: 1270, y: 170, w: 300, h: 420, to: "door", travel: { transition: "arc" } },
      ],
    },
    {
      id: "door",
      label: "The foot of the tower",
      x: 1750,
      y: 560,
      render: (scene) => h(DoorScene, scene),
      hotspots: [
        {
          id: "door",
          label: "Lighthouse door",
          x: 660,
          y: 300,
          w: 280,
          h: 470,
          to: "lamp",
          travel: { transition: "dolly" },
          use: async (game, { item }) => {
            if (game.get("unlocked")) return true;
            if (item !== "key") {
              await game.say(game.has("key") ? "Locked. The key in your pocket might fit — take it in hand first." : "Locked, and the lock is older than you are.");
              return false;
            }
            game.sound("latch");
            game.take("key");
            game.set("unlocked", true);
            await game.say("The key turns with a groan. The door gives.");
            return true;
          },
        },
        {
          id: "can",
          label: "Oil can",
          kind: "take",
          x: 1010,
          y: 640,
          w: 150,
          h: 170,
          when: (game) => !game.has("oil") && !game.get("lit"),
          use: async (game) => {
            await game.say("A can of lamp oil, left by the steps. Full.");
            game.give("oil");
          },
        },
        {
          id: "plaque",
          label: "Brass plaque",
          kind: "look",
          x: 380,
          y: 380,
          w: 190,
          h: 130,
          use: async (game) => {
            await game.say({ speaker: KEEPER, text: "“Whoever finds the door locked: the key sleeps where the sea brings things.”" });
            game.note("keeper");
          },
        },
        { id: "down", label: "Path down to the cove", x: 30, y: 560, w: 260, h: 300, to: "shore", travel: { transition: "arc" } },
      ],
    },
    {
      id: "lamp",
      label: "The lamp room",
      x: 900,
      y: -500,
      render: (scene) => h(LampScene, scene),
      enter: (game, { first }) => (first ? game.say("Glass on every side, and in the middle the great lamp — cold.") : undefined),
      hotspots: [
        {
          id: "lamp",
          label: "The lantern",
          x: 620,
          y: 230,
          w: 360,
          h: 430,
          use: async (game, { item }) => {
            if (game.get("lit")) {
              await game.say("It burns steady. It will last the night.");
              return;
            }
            if (item !== "oil") {
              await game.say(game.has("oil") ? "The reservoir is dry. The oil you carry would fill it — take it in hand first." : "The reservoir is dry.");
              return;
            }
            const answer = await game.choose("Fill the reservoir and light the lantern?", [
              { id: "light", label: "Light it" },
              { id: "wait", label: "Not yet" },
            ]);
            if (answer !== "light") return;

            game.take("oil");
            await game.focus("lamp");
            game.sound("ignite");
            game.set("lit", true);
            if (cutscenes.beam) await game.play(cutscenes.beam, 0);
            game.note("light");
            await game.say(["The flame catches, and the lens throws it out over the sea.", "Somewhere below, the water turns silver."]);
            await game.focus(null);
          },
        },
        {
          id: "log",
          label: "Keeper's log",
          kind: "look",
          x: 1130,
          y: 560,
          w: 250,
          h: 170,
          use: async (game) => {
            await game.say({ speaker: KEEPER, text: "“Reservoir dry. Gone for oil. Left the can by the steps.”" });
            game.note("log");
          },
        },
        { id: "stairs", label: "Stairs down", x: 120, y: 600, w: 260, h: 260, to: "door", travel: { transition: "dolly" } },
      ],
    },
  ],
};
