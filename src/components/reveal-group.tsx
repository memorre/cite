"use client";

import * as React from "react";

/**
 * Fades `.reveal` children in as they scroll into view, once, like the homepage. Without JS
 * (or with reduced motion) nothing is hidden, because the hiding class is only added here.
 */
export function RevealGroup({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = ref.current;
    if (!root || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    root.classList.add("reveal-ready");
    // Also watch nodes React adds later (e.g. after a re-render), or they'd stay hidden.
    const observeAll = () => root.querySelectorAll(".reveal:not(.in)").forEach((el) => observer.observe(el));
    observeAll();
    const mutations = new MutationObserver(observeAll);
    mutations.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
