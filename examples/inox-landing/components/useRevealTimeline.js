import { useEffect, useIntersectionObserver, useRef } from "/dist/fluxaway.js";

export function useRevealTimeline(timeline, threshold = 0.2) {
  const sectionRef = useRef(null);
  const entry = useIntersectionObserver(sectionRef, { threshold, once: true });

  useEffect(() => {
    if (entry?.isIntersecting) timeline.play();
  }, [entry, timeline]);

  return sectionRef;
}
