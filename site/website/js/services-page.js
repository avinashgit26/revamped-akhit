(() => {
  const stage = document.querySelector('[data-services-drop]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (stage) {
    if (reduceMotion.matches) {
      stage.classList.add('is-settled');
    } else {
      window.requestAnimationFrame(() => stage.classList.add('is-animated'));
    }
  }

  const bindTabset = (tabSelector, tablistSelector, { vertical = false, onActivate } = {}) => {
    const tabs = Array.from(document.querySelectorAll(tabSelector));
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    const tablist = document.querySelector(tablistSelector);
    if (!tabs.length || !tablist) return { tabs, activate: () => {} };

    const activate = (selected, moveFocus = false) => {
      tabs.forEach((tab, index) => {
        const active = tab === selected;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (panels[index]) panels[index].hidden = !active;
      });
      onActivate?.(selected);
      if (moveFocus) selected.focus();
    };

    tabs.forEach(tab => tab.addEventListener('click', () => activate(tab)));
    tablist.addEventListener('keydown', event => {
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      const forward = vertical ? 'ArrowDown' : 'ArrowRight';
      const backward = vertical ? 'ArrowUp' : 'ArrowLeft';
      let next = null;
      if (event.key === forward) next = (current + 1) % tabs.length;
      if (event.key === backward) next = (current - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== null) {
        event.preventDefault();
        activate(tabs[next], true);
      }
    });
    return { tabs, activate };
  };

  const offerings = bindTabset('.services-offering-tab', '[role="tablist"][aria-label="Choose a service"]', { vertical: true });
  const activateOfferingFromHash = () => {
    let targetId = window.location.hash.slice(1);
    try { targetId = decodeURIComponent(targetId); } catch (_) {}
    const selected = offerings.tabs.find(tab => tab.getAttribute('aria-controls') === targetId);
    if (!selected) return;
    offerings.activate(selected);
    window.requestAnimationFrame(() => document.getElementById('what-we-build')?.scrollIntoView({ block: 'start' }));
  };
  activateOfferingFromHash();
  window.addEventListener('hashchange', activateOfferingFromHash);

  const engineering = bindTabset('.services-engineering-tab', '[role="tablist"][aria-label="Engineering approaches"]');
  const process = bindTabset('.services-process-tab', '[role="tablist"][aria-label="How AKH works"]', {
    onActivate(selected) {
      document.querySelector('.services-process')?.setAttribute('data-process-stage', selected.id.replace('process-tab-', ''));
    }
  });

  const form = document.getElementById('services-scoping-form');
  const formStatus = document.getElementById('scoping-submit-status');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = String(new FormData(form).get('name') || '').trim();
    formStatus.textContent = 'Thanks' + (name ? ', ' + name : '') + '. Your scoping brief is ready. Contact AKH to continue the conversation.';
    formStatus.classList.add('is-visible');
  });

  const mic = document.getElementById('scoping-mic');
  const brief = document.getElementById('scoping-brief');
  const voiceStatus = document.getElementById('scoping-voice-status');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  if (mic && brief && voiceStatus) {
    if (!Recognition) {
      mic.addEventListener('click', () => {
        voiceStatus.textContent = 'Voice input is unavailable in this browser. You can type your brief instead.';
      });
    } else {
      recognition = new Recognition();
      recognition.lang = 'en-GB';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onstart = () => {
        mic.setAttribute('aria-pressed', 'true');
        mic.setAttribute('aria-label', 'Stop voice input');
        voiceStatus.textContent = 'Listening. Your browser may send audio to its speech service for transcription.';
      };
      recognition.onresult = event => {
        const spoken = event.results?.[0]?.[0]?.transcript?.trim();
        if (spoken) {
          brief.value = brief.value.trim() + (brief.value.trim() ? ' ' : '') + spoken;
          brief.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };
      recognition.onerror = event => {
        voiceStatus.textContent = event.error === 'not-allowed'
          ? 'Microphone access was not allowed. You can type your brief instead.'
          : 'Voice input stopped. You can type your brief instead.';
      };
      recognition.onend = () => {
        mic.setAttribute('aria-pressed', 'false');
        mic.setAttribute('aria-label', 'Use voice input for your project brief');
      };
      mic.addEventListener('click', () => {
        if (mic.getAttribute('aria-pressed') === 'true') {
          recognition.stop();
          return;
        }
        voiceStatus.textContent = '';
        try {
          recognition.start();
        } catch (_) {
          voiceStatus.textContent = 'Voice input could not start. You can type your brief instead.';
        }
      });
    }
  }
})();
