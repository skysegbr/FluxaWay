// Timelines live in the components that draw them; scripts live in data.js.
// A scene registers its timeline here on mount so a script can wait for it:
//
//   await game.play(cutscenes.beam, 0);
export const cutscenes = {};
