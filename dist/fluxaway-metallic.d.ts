/*!
 * FluxaWay — TypeScript declarations for the experimental metallic design.
 */

export type MetalTheme =
  | "aurum"
  | "cobalt"
  | "cobalt-aurum"
  | "inox"
  | "bronze"
  | "ferrum"
  | "black-inox";

export declare const METAL_THEMES: readonly MetalTheme[];

/**
 * Selects the metallic finish through `data-metal-theme` on `<html>`.
 * Activate `useDesign().setDesign("metallic")` and load
 * `dist/fluxaway-metallic.css` for the finish to take visual effect.
 */
export declare function useMetalTheme(): {
  metalTheme: MetalTheme;
  metalThemes: readonly MetalTheme[];
  setMetalTheme: (next: MetalTheme) => void;
};
