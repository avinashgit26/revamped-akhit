(() => {
  const launcher = document.getElementById('assistant-launcher');
  const panel = document.getElementById('assistant-panel');
  const input = document.getElementById('assistant-input');
  const form = document.getElementById('assistant-form');

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

  const serviceTabs = [...document.querySelectorAll('[data-service-tab]')];
  const servicePanels = [...document.querySelectorAll('.home-service-panel')];
  const activateServiceTab = (activeTab, moveFocus = false) => {
    const activePanelId = activeTab.dataset.serviceTab;
    serviceTabs.forEach(tab => {
      const selected = tab === activeTab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    servicePanels.forEach(panel => { panel.hidden = panel.id !== activePanelId; });
    if (moveFocus) activeTab.focus();
  };

  serviceTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateServiceTab(tab));
    tab.addEventListener('keydown', event => {
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % serviceTabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + serviceTabs.length) % serviceTabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = serviceTabs.length - 1;
      else return;
      event.preventDefault();
      activateServiceTab(serviceTabs[nextIndex], true);
    });
  });
})();
