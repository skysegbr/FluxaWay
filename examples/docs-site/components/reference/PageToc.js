import {
  h,
  useState,
  useEffect,
  useRef,
  useThrottle,
  useMediaQuery,
} from "/dist/fluxaway.js";

// "On this page" with scroll spy. The headings are plain DOM ids rendered by
// DemoBlock/PropsTable, so the spy reads them back with getElementById rather
// than threading refs through every section.
export function PageToc({ items, variant = "desktop" }) {
  const [active, setActive] = useState(items[0]?.id ?? null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const compactViewport = useMediaQuery("(max-width: 1200px)");
  const detailsRef = useRef(null);
  const ids = items.map((item) => item.id).join(",");
  const visible = variant === "mobile" ? compactViewport : !compactViewport;

  const onScroll = useThrottle(() => {
    const scrollRoot = document.scrollingElement ?? document.documentElement;
    const atPageEnd =
      scrollRoot.scrollHeight > window.innerHeight + 1 &&
      Math.ceil(window.scrollY + window.innerHeight) >= scrollRoot.scrollHeight - 2;

    // The final heading often cannot reach the 25% activation line because
    // there is not enough content below it. At the document boundary the last
    // TOC entry is therefore the unambiguous active section.
    if (atPageEnd) {
      setActive(items[items.length - 1]?.id ?? null);
      return;
    }

    const line = window.innerHeight * 0.25;
    let current = items[0]?.id ?? null;

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el && el.getBoundingClientRect().top <= line) current = item.id;
    }

    setActive(current);
  }, 120);

  useEffect(() => {
    if (!visible) return undefined;
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids, visible]);

  if (items.length < 2 || !visible) return null;

  const links = h(
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
              setActive(item.id);
              const moveToSection = () => {
                const section = document.getElementById(item.id);
                const heading = section?.querySelector("h2") ?? section;
                if (!section || !heading) return;
                heading.tabIndex = -1;
                heading.focus({ preventScroll: true });
                section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
              };

              if (detailsRef.current) {
                detailsRef.current.open = false;
                requestAnimationFrame(moveToSection);
              } else {
                moveToSection();
              }
            },
          },
          item.title,
        ),
      ),
    ),
  );

  if (variant === "mobile") {
    const activeTitle = items.find((item) => item.id === active)?.title ?? items[0].title;
    return h(
      "aside",
      { className: "nd-toc nd-toc-mobile", ariaLabel: "On this page" },
      h(
        "details",
        { ref: detailsRef, className: "nd-toc-disclosure" },
        h(
          "summary",
          { className: "nd-toc-summary" },
          h(
            "span",
            null,
            h("span", { className: "nd-toc-summary-label" }, "On this page"),
            h("span", { className: "nd-toc-summary-current" }, activeTitle),
          ),
          h("i", { className: "bi bi-chevron-down nd-toc-summary-caret", ariaHidden: "true" }),
        ),
        links,
      ),
    );
  }

  return h(
    "aside",
    { className: "nd-toc nd-toc-desktop", ariaLabel: "On this page" },
    h("h2", { className: "nd-toc-heading" }, "On this page"),
    links,
  );
}
