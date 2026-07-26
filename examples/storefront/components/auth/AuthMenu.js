import { h, useContext } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import { AuthContext } from "./AuthContext.js";

export function AuthMenu({ onSignIn }) {
  const { user, logout } = useContext(AuthContext);

  if (!user) {
    return h(Button, { variant: "text", onClick: onSignIn }, "Sign in");
  }

  return h(
    "span",
    { className: "sf-auth-menu" },
    h("span", { className: "sf-auth-name" }, user.name),
    h(Button, { variant: "text", onClick: logout }, "Sign out"),
  );
}
