(() => {
  const form = document.getElementById('project-intake-form');
  const thread = document.getElementById('project-intake-thread');
  const starters = document.getElementById('project-intake-starters');
  const briefInput = document.getElementById('project-intake-input');
  const emailInput = document.getElementById('project-intake-email');
  const voiceButton = document.getElementById('project-intake-voice');
  const sendButton = form?.querySelector('.intake-send');
  const status = document.getElementById('project-intake-status');
  const resetButton = document.getElementById('project-intake-reset');
  const guideAvatar = document.getElementById('project-guide-avatar');
  const guideCue = document.getElementById('project-guide-cue');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!form || !thread || !briefInput || !emailInput || !voiceButton || !status || !resetButton) return;

  const followUpQuestions = [
    'Who will use it, and what would a better outcome look like for them?',
    'Which tools or systems are involved in the work today?',
    'What are the most important needs or problems to solve first?',
    'Do you have a preferred timeframe or a date you are working toward?'
  ];
  const answerLabels = ['Project idea', 'People and goals', 'Current tools', 'Key needs', 'Timing'];
  let answers = [];
  let waitingForEmail = false;
  let completed = false;
  let recognition = null;
  let voiceAvailable = false;
  let guideReplyTimer = 0;

  const dismissGuideCue = () => {
    if (guideCue) guideCue.hidden = true;
  };

  briefInput.addEventListener('input', dismissGuideCue, { once: true });

  const animateGuideReply = () => {
    if (!guideAvatar || reducedMotion.matches) return;
    window.clearTimeout(guideReplyTimer);
    guideAvatar.classList.remove('is-responding');
    void guideAvatar.offsetWidth;
    guideAvatar.classList.add('is-responding');
    guideReplyTimer = window.setTimeout(() => guideAvatar.classList.remove('is-responding'), 760);
  };

  reducedMotion.addEventListener?.('change', event => {
    if (event.matches) {
      window.clearTimeout(guideReplyTimer);
      guideAvatar?.classList.remove('is-responding');
    }
  });

  const addMessage = (message, kind = 'guide') => {
    const bubble = document.createElement('p');
    bubble.className = `intake-message intake-message--${kind}`;
    if (kind === 'guide') {
      const mark = document.createElement('img');
      mark.className = 'intake-guide-mark';
      mark.src = 'website/images/home/akh-logo-mark.png';
      mark.alt = '';
      mark.setAttribute('aria-hidden', 'true');
      mark.width = 28;
      mark.height = 30;
      mark.draggable = false;
      bubble.append(mark);
    }
    const copy = document.createElement('span');
    copy.className = 'intake-message-copy';
    copy.textContent = message;
    bubble.append(copy);
    thread.append(bubble);
    thread.scrollTop = thread.scrollHeight;
    if (kind === 'guide') animateGuideReply();
    return bubble;
  };

  const addSummary = () => {
    const card = document.createElement('section');
    card.className = 'intake-summary';
    const heading = document.createElement('h3');
    heading.textContent = 'Your brief so far';
    const list = document.createElement('dl');
    answers.forEach((answer, index) => {
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      term.textContent = answerLabels[index];
      detail.textContent = answer;
      list.append(term, detail);
    });
    card.append(heading, list);
    thread.append(card);
    thread.scrollTop = thread.scrollHeight;
  };

  const appendDisclosureLink = () => {
    const message = document.createElement('p');
    message.className = 'intake-message intake-message--guide';
    message.append(document.createTextNode('This is a guided preview, not a live AI or enquiry service. Your draft stays in this page and is not sent or saved. To contact AKH, use the '));
    const contact = document.createElement('a');
    contact.href = 'https://avinashgit26.github.io/akhit-solutions-redesign/contact-us.html';
    contact.textContent = 'contact page';
    message.append(contact, document.createTextNode('.'));
    thread.append(message);
    thread.scrollTop = thread.scrollHeight;
  };

  const stopRecognition = () => {
    if (recognition && voiceButton.getAttribute('aria-pressed') === 'true') recognition.stop();
  };

  const showEmailStep = () => {
    waitingForEmail = true;
    stopRecognition();
    addSummary();
    addMessage('Thanks. What work email would you use to contact the AKH team?');
    briefInput.hidden = true;
    briefInput.required = false;
    emailInput.hidden = false;
    emailInput.required = true;
    emailInput.value = '';
    form.classList.add('is-email-step');
    emailInput.focus();
    voiceButton.hidden = true;
    if (sendButton) sendButton.setAttribute('aria-label', 'Complete preview');
    status.textContent = 'Enter a work email to complete this guided preview. Nothing will be sent.';
  };

  const handleBrief = value => {
    const answer = value.trim();
    if (!answer) {
      status.textContent = 'Add a few details, or use one of the suggested starting points.';
      briefInput.focus();
      return;
    }

    dismissGuideCue();
    answers.push(answer);
    addMessage(answer, 'visitor');
    briefInput.value = '';
    if (starters) starters.hidden = true;
    resetButton.hidden = false;

    if (answers.length <= followUpQuestions.length) {
      addMessage(followUpQuestions[answers.length - 1]);
      status.textContent = 'Your answers stay in this page only.';
      briefInput.focus();
      return;
    }

    showEmailStep();
  };

  const completePreview = () => {
    const email = emailInput.value.trim();
    if (!email || !emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }
    completed = true;
    waitingForEmail = false;
    emailInput.value = '';
    form.classList.remove('is-email-step');
    form.hidden = true;
    addMessage('Your project brief is ready to review. This preview has not sent or saved your details. When you are ready, you can start a new brief or contact AKH directly.');
    appendDisclosureLink();
    status.textContent = 'Preview complete. No details were transmitted or stored.';
    resetButton.hidden = false;
    resetButton.focus();
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (completed) return;
    if (waitingForEmail) completePreview();
    else handleBrief(briefInput.value);
  });

  briefInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  starters?.querySelectorAll('[data-intake-starter]').forEach(button => {
    button.addEventListener('click', () => handleBrief(button.dataset.intakeStarter || button.textContent));
  });

  resetButton.addEventListener('click', () => {
    stopRecognition();
    answers = [];
    waitingForEmail = false;
    completed = false;
    thread.replaceChildren();
    addMessage('What would you like to build or improve?');
    if (starters) starters.hidden = false;
    form.hidden = false;
    briefInput.hidden = false;
    briefInput.required = true;
    emailInput.hidden = true;
    emailInput.required = false;
    emailInput.value = '';
    briefInput.value = '';
    voiceButton.hidden = false;
    if (sendButton) sendButton.setAttribute('aria-label', 'Send answer');
    resetButton.hidden = true;
    status.textContent = voiceAvailable
      ? 'You can type or use the microphone. Press Ctrl+Enter to send.'
      : 'Voice input is unavailable in this browser. Typing is always available.';
    briefInput.focus();
  });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceButton.disabled = true;
    voiceButton.title = 'Voice input is unavailable here; you can type instead.';
    status.textContent = 'Voice input may not be supported by this browser. Typing is always available.';
  } else {
    voiceAvailable = true;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-GB';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => {
      voiceButton.setAttribute('aria-pressed', 'true');
      voiceButton.setAttribute('aria-label', 'Stop voice input');
      status.textContent = 'Listening. Select the microphone again to stop.';
    };
    recognition.onresult = event => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        briefInput.value = [briefInput.value.trim(), transcript].filter(Boolean).join(' ');
        briefInput.dispatchEvent(new Event('input', { bubbles: true }));
        briefInput.focus();
        status.textContent = 'Voice input added. Review or edit it before sending.';
      }
    };
    recognition.onerror = event => {
      status.textContent = event.error === 'not-allowed'
        ? 'Microphone access was not allowed. You can type instead.'
        : 'Voice input stopped. You can type instead.';
    };
    recognition.onend = () => {
      voiceButton.setAttribute('aria-pressed', 'false');
      voiceButton.setAttribute('aria-label', 'Use voice input');
    };
    voiceButton.addEventListener('click', () => {
      if (voiceButton.getAttribute('aria-pressed') === 'true') {
        recognition.stop();
        return;
      }
      status.textContent = 'Starting voice input. Your browser may ask for microphone access.';
      try {
        recognition.start();
      } catch (_) {
        status.textContent = 'Voice input could not start. You can type instead.';
      }
    });
  }
})();
