// The whole story. A hotspot here is a PLACE on the island (`at: [x, z]`, in
// metres): the player walks up to it and uses it. Nothing in this file knows
// how the island is drawn.
import { cutscenes } from "./cutscenes.js";
import { SOUNDS } from "./sounds.js";
import { PLACES } from "./terrain.js";

const KEEPER = "Station log";

export const STORY = {
  id: "signal-island",
  version: 1,
  reach: 4.5,
  state: { power: false, sent: false },
  sounds: SOUNDS,

  items: {
    fuse: { name: "Spare fuse", icon: "⚡", description: "Ceramic, thumb-sized, stamped 30 A." },
  },

  journal: {
    sign: { title: "The landing sign", text: "Station Nine. Staff: one. Supplies are left on the jetty." },
    cabin: { title: "The cabin door", text: "“Generator tripped again. The spare fuses were due on the last boat.”" },
    cairn: { title: "The cairn", text: "A pile of stones on the eastern ridge, one for every winter the station stood." },
    power: { title: "The generator", text: "A new fuse, and the shed shook itself awake." },
    signal: { title: "The signal", text: "Sent from the mast at dusk. Somebody out there will hear it." },
  },

  scenes: [
    {
      id: "island",
      label: "Station Nine",
      enter: async (game, { first }) => {
        if (first) {
          await game.say([
            "The boat left you on the jetty and did not wait.",
            "Up the hill a mast stands against the dusk, with no light on it.",
          ]);
        }
      },
      hotspots: [
        {
          id: "crate",
          label: "Supply crate",
          kind: "take",
          at: PLACES.crate,
          radius: 3,
          when: (game) => !game.has("fuse") && !game.get("power"),
          use: async (game) => {
            await game.say("Tins, a coil of rope — and a ceramic fuse, still in its paper.");
            game.give("fuse");
          },
        },
        {
          id: "sign",
          label: "Landing sign",
          kind: "look",
          at: PLACES.sign,
          use: async (game) => {
            await game.say("STATION NINE. STAFF: ONE. Supplies are left on the jetty.");
            game.note("sign");
          },
        },
        {
          id: "cabin",
          label: "Cabin door",
          kind: "look",
          at: PLACES.cabin,
          radius: 7,
          use: async (game) => {
            await game.say([
              "Nobody answers. A page is pinned to the door.",
              { speaker: KEEPER, text: "“Generator tripped again. The spare fuses were due on the last boat.”" },
            ]);
            game.note("cabin");
          },
        },
        {
          id: "shed",
          label: "Generator shed",
          at: PLACES.shed,
          radius: 5.5,
          use: async (game, { item }) => {
            if (game.get("power")) {
              await game.say("The generator thuds along, steady as a heartbeat.");
              return;
            }
            if (item !== "fuse") {
              await game.say(game.has("fuse")
                ? "The fuse holder is empty. The fuse you carry would fit — take it in hand first."
                : "The fuse holder is empty, its old fuse black and split.");
              return;
            }
            game.take("fuse");
            game.sound("hum");
            game.set("power", true);
            game.note("power");
            await game.say("The fuse seats with a click. The generator coughs, and catches.");
            await game.focus("mast");
            await game.say("Up on the hill, a red light answers.");
          },
        },
        {
          id: "cairn",
          label: "Cairn",
          kind: "look",
          at: PLACES.cairn,
          use: async (game) => {
            await game.say("Stones stacked by hand, one for every winter. You count thirty-one.");
            game.note("cairn");
          },
        },
        {
          id: "turbine",
          label: "Wind turbine",
          kind: "look",
          at: PLACES.turbine,
          use: (game) => game.say("It turns whether anyone is watching or not."),
        },
        {
          id: "mast",
          label: "Radio mast",
          at: PLACES.mast,
          use: async (game) => {
            if (!game.get("power")) {
              await game.say("The console at the foot of the mast is dark. No power reaches it.");
              return;
            }
            if (game.get("sent")) {
              await game.say("The beacon pulses overhead. The signal is out.");
              return;
            }
            const answer = await game.choose("The console is awake. Send the station's signal?", [
              { id: "send", label: "Send it" },
              { id: "wait", label: "Not yet" },
            ]);
            if (answer !== "send") return;

            game.sound("signal");
            game.set("sent", true);
            game.note("signal");
            if (cutscenes.end) await game.play(cutscenes.end, 0);
            await game.say("Three pips into the dark. Now there is nothing to do but keep the light on.");
          },
        },
      ],
    },
  ],
};
