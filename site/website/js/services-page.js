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

  const tabs = Array.from(document.querySelectorAll('.services-process-tab'));
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls'))).filter(Boolean);
  const tablist = document.querySelector('[role="tablist"][aria-label="How AKH works"]');

  const activateTab = (selected, moveFocus = false) => {
    tabs.forEach((tab, index) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (panels[index]) panels[index].hidden = !active;
    });
    const stage = selected.id.replace('process-tab-', '');
    document.querySelector('.services-process')?.setAttribute('data-process-stage', stage);
    if (moveFocus) selected.focus();
  };

  tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab)));
  tablist?.addEventListener('keydown', event => {
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next = null;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== null) {
      event.preventDefault();
      activateTab(tabs[next], true);
    }
  });

  const engineeringTabs = Array.from(document.querySelectorAll('.services-engineering-tab'));
  const engineeringPanels = engineeringTabs.map(tab => document.getElementById(tab.getAttribute('aria-controls'))).filter(Boolean);
  const engineeringTablist = document.querySelector('[role="tablist"][aria-label="Engineering approaches"]');

  const activateEngineeringTab = (selected, moveFocus = false) => {
    engineeringTabs.forEach((tab, index) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (engineeringPanels[index]) engineeringPanels[index].hidden = !active;
    });
    if (moveFocus) selected.focus();
  };

  engineeringTabs.forEach(tab => tab.addEventListener('click', () => activateEngineeringTab(tab)));
  engineeringTablist?.addEventListener('keydown', event => {
    const current = engineeringTabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next = null;
    if (event.key === 'ArrowRight') next = (current + 1) % engineeringTabs.length;
    if (event.key === 'ArrowLeft') next = (current - 1 + engineeringTabs.length) % engineeringTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = engineeringTabs.length - 1;
    if (next !== null) {
      event.preventDefault();
      activateEngineeringTab(engineeringTabs[next], true);
    }
  });

  const form = document.getElementById('services-scoping-form');
  const formStatus = document.getElementById('scoping-submit-status');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = String(new FormData(form).get('name') || '').trim();
    formStatus.textContent = 'Thanks' + (name ? ', ' + name : '') + '. The preview acknowledgement is complete. No details were sent or saved.';
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
