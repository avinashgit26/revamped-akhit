(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = document.querySelectorAll('.impact-head,.industry-carousel,.ai-panel,.section-head,.work-card,.clients-head,.team-head,.team-card,.testimonial-copy,.testimonial-stage,.footer-cta');
  if (!reduced && 'IntersectionObserver' in window) {
    revealTargets.forEach((node, index) => { node.dataset.reveal = ''; node.style.transitionDelay = `${(index % 3) * 90}ms`; });
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -35px 0px' });
    revealTargets.forEach(node => revealObserver.observe(node));
  }
  const counters = [...document.querySelectorAll('[data-count]')];
  const paintCounter = (node, value) => {
    const decimals = Number(node.dataset.decimals || 0);
    const number = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-GB');
    node.textContent = `${node.dataset.prefix || ''}${number}${node.dataset.suffix || ''}`;
  };
  const animateCounter = node => {
    const target = Number(node.dataset.count), duration = 1200, start = performance.now();
    const frame = now => { const t = Math.min(1, (now - start) / duration); paintCounter(node, target * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  };
  if (reduced || !('IntersectionObserver' in window)) counters.forEach(node => paintCounter(node, Number(node.dataset.count)));
  else {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => { if (entry.isIntersecting) { animateCounter(entry.target); observer.unobserve(entry.target); } });
    }, { threshold: 0.65 });
    counters.forEach(node => counterObserver.observe(node));
  }
  const menu = document.querySelector('.mobile-menu');
  if (menu) menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
})();
