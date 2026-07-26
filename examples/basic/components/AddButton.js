import { h } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";

export function AddButton({ setCount }) {
  return h(Button, {
    className: "add-button",
    variant: "contained",
    onClick: () => setCount((v) => v + 1),
  }, "Add");
}
