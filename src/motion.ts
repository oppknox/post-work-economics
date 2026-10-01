export function mountMotion(): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = [...document.querySelectorAll<HTMLElement>(".reveal")];

  const runCounters = (root: ParentNode) => {
    root.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
      if (node.dataset.ran === "1") return;
      node.dataset.ran = "1";
      animateCount(node, reduce);
    });
  };

  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach((node) => node.classList.add("in"));
    runCounters(document);
  } else {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        runCounters(entry.target);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((node) => observer.observe(node));
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
      if (!node.closest(".reveal")) animateCount(node, false);
    });
  }

  const bar = document.querySelector<HTMLElement>("#progress > span");
  const onScroll = () => {
    if (!bar) return;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? window.scrollY / height : 0;
    bar.style.width = `${Math.min(1, Math.max(0, progress)) * 100}%`;
  };
  onScroll();
  document.addEventListener("scroll", onScroll, { passive: true });

  const links = [...document.querySelectorAll<HTMLAnchorElement>(".rail a")];
  const sections = links
    .map((link) => document.querySelector<HTMLElement>(link.getAttribute("href") ?? ""))
    .filter((section): section is HTMLElement => Boolean(section));
  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      for (const link of links) {
        const on = link.getAttribute("href") === `#${visible.target.id}`;
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      }
    }, { threshold: [0.25, 0.5], rootMargin: "-20% 0px -45% 0px" });
    sections.forEach((section) => spy.observe(section));
  }

  if (reduce) {
    document.querySelectorAll(".plate animateMotion, .plate animate").forEach((node) => node.remove());
  }
}

function animateCount(node: HTMLElement, instant: boolean): void {
  const target = Number(node.dataset.count);
  const decimals = Number(node.dataset.decimals ?? "0");
  const prefix = node.dataset.prefix ?? "";
  const suffix = node.dataset.suffix ?? "";
  const render = (value: number) => {
    node.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
  };
  if (instant || !Number.isFinite(target)) {
    render(target);
    return;
  }
  const start = performance.now();
  const duration = 1100;
  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - progress) ** 3;
    render(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function mountForm(): void {
  const form = document.querySelector<HTMLFormElement>("#briefing");
  const note = document.querySelector<HTMLElement>("#form-note");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (note) {
      note.textContent = "Staging only. The form id is still REPLACE_ME, so this address was not sent.";
    }
  });
}
