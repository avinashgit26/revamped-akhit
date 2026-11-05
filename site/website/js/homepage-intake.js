(() => {
  const form = document.getElementById('project-intake-form');
  const thread = document.getElementById('project-intake-thread');
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
  const heroPromptAnswers = {
    'How can I choose the right AKH service for my project?': {
      answer: 'Start with what you want to improve and who needs it. AKH works across web applications, websites, mobile apps, applied AI, SEO, graphic design and staffing. I can help you narrow down a practical next step.',
      href: 'services.html#what-we-build',
      label: 'Browse AKH services'
    },
    'Can AKH build a website or app from my existing design?': {
      answer: 'Yes. AKH can work from an existing design or help shape a rough idea into a clear brief. We can discuss the user journeys, integrations and delivery needs before recommending the right build.',
      href: 'services.html#what-we-build',
      label: 'Explore website and app services'
    },
    'Can AKH improve an existing web application or system?': {
      answer: 'We can start by understanding how the current system is used, where work gets stuck and what needs to improve. From there, the team can discuss focused changes or a broader rebuild if the evidence supports it.',
      href: 'services.html#web-application-development',
      label: 'Explore web application development'
    },
    'How can AI and workflow automation save my business time or money?': {
      answer: 'Applied AI and workflow automation can help with repeated work, information search and product features. AKH evaluates each use case around the existing process, safeguards and human review.',
      href: 'services.html#artificial-intelligence',
      label: 'Explore AI services'
    }
  };
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

  const addMessage = (message, kind = 'guide', link = null) => {
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
    if (link) {
      copy.append(document.createTextNode(' '));
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.textContent = link.label;
      copy.append(anchor);
    }
    bubble.append(copy);
    thread.append(bubble);
    thread.scrollTop = thread.scrollHeight;
    if (kind === 'guide') animateGuideReply();
    return bubble;
  };

  document.querySelectorAll('.hero-answer[data-ask-akh]').forEach(button => {
    button.addEventListener('click', () => {
      const question = button.dataset.askAkh || '';
      const response = heroPromptAnswers[question];
      if (!response) return;
      addMessage(question, 'visitor');
      addMessage(response.answer, 'guide', { href: response.href, label: response.label });
      status.textContent = 'Choose another prompt or describe your project below.';
    });
  });

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
    message.append(document.createTextNode('To continue the project conversation with AKH, use the '));
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
    if (sendButton) sendButton.setAttribute('aria-label', 'Finish project brief');
    status.textContent = 'Add a work email to finish your project brief.';
  };

  const handleBrief = value => {
    const answer = value.trim();
    if (!answer) {
      status.textContent = 'Add a few details about your project to continue.';
      briefInput.focus();
      return;
    }

    dismissGuideCue();
    answers.push(answer);
    addMessage(answer, 'visitor');
    briefInput.value = '';
    resetButton.hidden = false;

    if (answers.length <= followUpQuestions.length) {
      addMessage(followUpQuestions[answers.length - 1]);
      status.textContent = 'Response added. Continue with the next question.';
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
    addMessage('Your project brief is ready. To continue with AKH, use the contact page.');
    appendDisclosureLink();
    status.textContent = 'Brief ready. Contact AKH to continue.';
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

  resetButton.addEventListener('click', () => {
    stopRecognition();
    answers = [];
    waitingForEmail = false;
    completed = false;
    thread.replaceChildren();
    addMessage('How can I choose the right AKH service for my project?');
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
