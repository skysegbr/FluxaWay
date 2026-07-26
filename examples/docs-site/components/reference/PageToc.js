import { h, useState, useEffect, useThrottle, useMediaQuery } from "/dist/nexa.js";

// "On this page" with scroll spy. The headings are plain DOM ids rendered by
// DemoBlock/PropsTable, so the spy reads them back with getElementById rather
// than threading refs through every section.
export function PageToc({ items }) {
  const [active, setActive] = useState(items[0]?.id ?? null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const ids = items.map((item) => item.id).join(",");

  const onScroll = useThrottle(() => {
    const line = window.innerHeight * 0.25;
    let current = items[0]?.id ?? null;

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el && el.getBoundingClientRect().top <= line) current = item.id;
    }

    setActive(current);
  }, 120);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids]);

  if (items.length < 2) return null;

  return h(
    "aside",
    { className: "nd-toc", ariaLabel: "On this page" },
    h("h2", { className: "nd-toc-heading" }, "On this page"),
    h(
      "ul",
      { className: "nd-toc-list" },
      items.map((item) =>
        h(
          "li",
          { key: item.id },
          h(
            "a",
            {
              className: `nd-toc-link${item.id === active ? " nd-toc-link-active" : ""}`,
              href: `#${item.id}`,
              ariaCurrent: item.id === active ? "location" : null,
              onClick: (event) => {
                // A bare "#id" href would replace the router's hash route.
                event.preventDefault();
                document
                  .getElementById(item.id)
                  ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
                setActive(item.id);
              },
            },
            item.title,
          ),
        ),
      ),
    ),
  );
}
