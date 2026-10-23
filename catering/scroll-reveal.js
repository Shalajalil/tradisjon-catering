/* Animate section content without moving large backgrounds or observed sections. */
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !('IntersectionObserver' in window) ||
      !Element.prototype.animate) return;

  const sections = [...document.querySelectorAll(
    'main > section, main > .local-strip, main > .offer-promo'
  )];
  const running = new Map();
  const visible = new Set();

  function stop(section) {
    const animation = running.get(section);
    if (animation) {
      running.delete(section);
      animation.cancel();
    }
  }
  function stopAll() {
    [...running.keys()].forEach(stop);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const section = entry.target;
      if (!entry.isIntersecting) {
        visible.delete(section);
        stop(section);
        return;
      }
      if (visible.has(section)) return;
      visible.add(section);
      if (preference.matches ||
          section.contains(document.activeElement)) return;
      // Keep the observed element still to prevent animation-triggered re-entry.
      const content = section.querySelector(':scope > .container');
      if (!content) return;
      const animation = content.animate([
        { opacity: 0.15, transform: 'translateY(26px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: 5000,
        easing: 'cubic-bezier(.22, 1, .36, 1)'
      });
      running.set(section, animation);
      const cleanup = () => {
        if (running.get(section) === animation) running.delete(section);
      };
      animation.onfinish = cleanup;
      animation.oncancel = cleanup;
    });
  }, { threshold: 0, rootMargin: '0px' });

  sections.forEach(section => observer.observe(section));
  document.addEventListener('focusin', event => {
    sections.forEach(section => {
      if (section.contains(event.target)) stop(section);
    });
  });
  preference.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    stopAll();
  });
})();
