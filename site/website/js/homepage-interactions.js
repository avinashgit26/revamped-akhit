(() => {
  const clientTicker = document.querySelector('.ticker');
  clientTicker?.addEventListener('click', event => {
    if (event.detail === 0) return;
    clientTicker.classList.toggle('is-click-paused');
  });

  const launcher = document.getElementById('assistant-launcher');
  const panel = document.getElementById('assistant-panel');
  const input = document.getElementById('assistant-input');
  const form = document.getElementById('assistant-form');

  if (launcher && document.body.classList.contains('homepage-page')) {
    const servicesSection = document.querySelector('.home-services');
    const setLauncherVisible = visible => { launcher.hidden = !visible; };
    setLauncherVisible(false);

    if (servicesSection && 'IntersectionObserver' in window) {
      const servicesObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => setLauncherVisible(entry.isIntersecting));
      }, { threshold: 0.01 });
      servicesObserver.observe(servicesSection);
    } else if (servicesSection) {
      const updateLauncherVisibility = () => {
        const bounds = servicesSection.getBoundingClientRect();
        setLauncherVisible(bounds.top < window.innerHeight && bounds.bottom > 0);
      };
      window.addEventListener('scroll', updateLauncherVisibility, { passive: true });
      window.addEventListener('resize', updateLauncherVisibility);
      updateLauncherVisibility();
    }
  }

  document.querySelectorAll('[data-ask-akh]').forEach(button => {
    button.addEventListener('click', () => {
      if (!launcher || !panel || !input || !form) return;

      if (panel.hidden) launcher.click();
      input.value = button.dataset.askAkh || '';
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
  });

  const replaceFailedLogo = image => {
    if (!image.isConnected) return;
    const fallback = document.createElement('span');
    fallback.className = `assistant-logo-fallback${image.classList.contains('assistant-logo-mark--panel') ? ' assistant-logo-fallback--panel' : ''}`;
    fallback.textContent = 'AKH';
    fallback.setAttribute('aria-hidden', 'true');
    image.replaceWith(fallback);
  };

  document.querySelectorAll('.assistant-logo-mark').forEach(image => {
    if (image.complete && image.naturalWidth === 0) replaceFailedLogo(image);
    else image.addEventListener('error', () => replaceFailedLogo(image), { once: true });
  });

  const serviceTabs = [...document.querySelectorAll('[data-service-filter]')];
  const serviceCards = [...document.querySelectorAll('.home-service-card[data-service-category]')];
  const servicePanel = document.getElementById('home-service-panel');
  const selectServiceFilter = (activeTab, moveFocus = false) => {
    const filter = activeTab.dataset.serviceFilter;
    serviceTabs.forEach(tab => {
      const selected = tab === activeTab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    serviceCards.forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.serviceCategory !== filter;
    });
    servicePanel?.setAttribute('aria-labelledby', activeTab.id);
    if (moveFocus) activeTab.focus();
  };

  serviceTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectServiceFilter(tab));
    tab.addEventListener('keydown', event => {
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % serviceTabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + serviceTabs.length) % serviceTabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = serviceTabs.length - 1;
      else return;
      event.preventDefault();
      selectServiceFilter(serviceTabs[nextIndex], true);
    });
  });
})();
