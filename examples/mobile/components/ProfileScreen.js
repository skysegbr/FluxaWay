import { h, useNetworkStatus, useOrientation } from "/dist/fluxaway.js";
import { Alert, Card } from "/dist/fluxaway-components-core.js";

export function ProfileScreen() {
  const online = useNetworkStatus();
  const orientation = useOrientation();

  return h(
    "div",
    { className: "mob-screen" },
    h(
      Card,
      { padded: true, className: "mob-profile-hero" },
      h("div", { className: "mob-avatar", ariaHidden: "true" }, "FW"),
      h(
        "div",
        { className: "mob-profile-copy" },
        h("span", { className: "mob-kicker" }, "Local workspace"),
        h("h2", null, "FluxaWay Explorer"),
        h("p", null, "Device-aware and ready to travel."),
      ),
      h("span", { className: "mob-profile-status" }, h("i", { className: "bi bi-check-circle-fill" }), " Synced"),
    ),
    h(
      "div",
      { className: "mob-section-head m-mt-6" },
      h("div", null, h("span", null, "Live device"), h("h2", null, "Environment")),
      h("i", { className: "bi bi-phone", ariaHidden: "true" }),
    ),
    h(
      "div",
      { className: "m-row" },
      h(
        "div",
        { className: "m-col-12 m-col-sm-6 m-mb-4" },
        h(
          Card,
          { padded: true, className: "mob-device-card" },
          h("span", { className: "mob-device-icon", ariaHidden: "true" }, h("i", { className: "bi bi-wifi" })),
          h("small", null, "Network"),
          h("strong", null, online ? "Online" : "Offline"),
          h("span", null, online ? "Connection is stable" : "Waiting for a network"),
        ),
      ),
      h(
        "div",
        { className: "m-col-12 m-col-sm-6 m-mb-4" },
        h(
          Card,
          { padded: true, className: "mob-device-card" },
          h("span", { className: "mob-device-icon", ariaHidden: "true" }, h("i", { className: "bi bi-phone-landscape" })),
          h("small", null, "Orientation"),
          h("strong", null, orientation === "landscape" ? "Landscape" : "Portrait"),
          h("span", null, "Updates as the device turns"),
        ),
      ),
    ),
    h(
      Alert,
      { variant: "success", title: "Mobile hooks active", className: "mob-profile-alert" },
      "useNetworkStatus and useOrientation are reporting live values.",
    ),
  );
}
