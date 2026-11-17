// World units are canvas pixels. Each route has spare lights and open escape lanes.
export const SIZE = { w: 1200, h: 800 };
export const START = { x: 600, y: 650 };
export const ACTIONS = {
  forward: ["KeyW", "ArrowUp"], back: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"], right: ["KeyD", "ArrowRight"],
  dash: ["Space", "ShiftLeft", "ShiftRight"], use: ["KeyE", "Enter"],
};

export const GARDENS = [
  {
    id: "moss", name: "The Mosslight Garden", subtitle: "Where small things begin",
    color: "#8cc9a1", ground: "#234c46", grass: "#44765c",
    beacons: [[270, 300], [930, 300], [600, 160]],
    lights: [[530, 635], [460, 590], [380, 550], [270, 475], [235, 400],
      [345, 275], [425, 210], [505, 170], [685, 180], [770, 240],
      [865, 345], [960, 415], [875, 525], [770, 585], [680, 640]],
    rocks: [[460, 380, 39], [745, 405, 44], [590, 490, 30]],
    enemies: [[445, 305, 86], [805, 455, 83]],
  },
  {
    id: "tide", name: "The Bluebell Crossing", subtitle: "Keep your courage close",
    color: "#8fc7e0", ground: "#254951", grass: "#4f7881",
    beacons: [[240, 385], [965, 405], [600, 155]],
    lights: [[515, 660], [430, 625], [340, 570], [240, 500], [250, 300],
      [350, 220], [455, 170], [545, 230], [675, 170], [780, 220],
      [900, 280], [955, 505], [855, 570], [765, 620], [680, 670]],
    rocks: [[400, 390, 46], [790, 395, 46], [600, 330, 38], [600, 530, 32]],
    enemies: [[365, 300, 94], [840, 310, 96], [600, 450, 90]],
  },
  {
    id: "bloom", name: "The Last Bloom", subtitle: "Even the longest night ends",
    color: "#ddacbf", ground: "#3c454c", grass: "#797779",
    beacons: [[260, 280], [940, 280], [600, 145]],
    lights: [[510, 650], [420, 600], [315, 530], [230, 440], [235, 350],
      [350, 240], [440, 175], [530, 200], [680, 180], [775, 235],
      [930, 390], [960, 485], [840, 565], [755, 620], [680, 660]],
    rocks: [[420, 365, 42], [780, 365, 42], [600, 300, 34], [485, 525, 28], [720, 525, 28]],
    enemies: [[340, 370, 106], [845, 365, 106], [600, 435, 100], [605, 210, 90]],
  },
];

export function gardenFor(id) { return GARDENS.find((garden) => garden.id === id) || GARDENS[0]; }
export function beaconKey(scene, index) { return `${scene}-${index}`; }
export function litCount(game) { return game.state.lit.filter((id) => id.startsWith(`${game.scene}-`)).length; }
export function capacity(game) { return game.state.upgrades.includes("satchel") ? 6 : 3; }
export function clockLabel(seconds) {
  const time = Math.floor(seconds || 0);
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`;
}
