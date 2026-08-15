// An original product landing page combining FluxaWay Motion with the
// experimental Inox material skin. Served directly as browser ESM.

import { h, render, useDesign, useEffect } from "/dist/fluxaway.js";
import { useMetalTheme } from "/dist/fluxaway-metallic.js";
import { AppShell } from "./components/AppShell.js";
import { Header } from "./components/Header.js";
import { Hero } from "./components/Hero.js";
import { MaterialProof } from "./components/MaterialProof.js";
import { AssemblyLab } from "./components/AssemblyLab.js";
import { SystemsGrid } from "./components/SystemsGrid.js";
import { FinalCta } from "./components/FinalCta.js";

function App() {
  const { setDesign } = useDesign();
  const { setMetalTheme } = useMetalTheme();

  useEffect(() => {
    setDesign("metallic");
    setMetalTheme("inox");
  }, []);

  return h(
    AppShell,
    null,
    h(Header, null),
    h(
      "main",
      null,
      h(Hero, null),
      h(MaterialProof, null),
      h(AssemblyLab, null),
      h(SystemsGrid, null),
      h(FinalCta, null),
    ),
  );
}

render(App, document.getElementById("app"));
