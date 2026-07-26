// Starts a parked fluxaway-motion timeline the first time its section enters the
// viewport. The observer plumbing — reattach when the target changes,
// disconnect after the first hit — is the core useIntersectionObserver's job.

import { useEffect, useRef, useIntersectionObserver } from "/dist/fluxaway.js";

export function useInViewTimeline(timeline, threshold = 0.22) {
  const sectionRef = useRef(null);
  const entry = useIntersectionObserver(sectionRef, { threshold, once: true });

  useEffect(() => {
    if (entry?.isIntersecting) timeline.play();
  }, [entry, timeline]);

  return sectionRef;
}
