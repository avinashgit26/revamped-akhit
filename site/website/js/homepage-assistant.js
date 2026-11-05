(() => {
  const proofValues = [...document.querySelectorAll('.proof-value[data-count], .services-proof-value[data-count]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setProofValue = (element, value) => {
    const decimals = Number(element.dataset.decimals || 0);
    element.textContent = `${element.dataset.prefix || ''}${value.toFixed(decimals)}${element.dataset.suffix || ''}`;
  };
  const animateProofValue = element => {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;
    if (reducedMotion) { setProofValue(element, target); return; }
    const start = performance.now();
    const duration = 1500;
    const tick = now => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setProofValue(element, target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const proofObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        proofObserver.unobserve(entry.target);
        animateProofValue(entry.target);
      });
    }, { threshold: .45 });
    proofValues.forEach(value => proofObserver.observe(value));
  } else {
    proofValues.forEach(animateProofValue);
  }

  const launcher = document.getElementById('assistant-launcher');
  const panel = document.getElementById('assistant-panel');
  const closeButton = document.getElementById('assistant-close');
  const input = document.getElementById('assistant-input');
  const form = document.getElementById('assistant-form');
  const messages = document.getElementById('assistant-messages');
  const prompts = document.getElementById('assistant-prompts');
  const status = document.getElementById('assistant-status');
  const voiceButton = document.getElementById('assistant-voice');
  const privacy = document.getElementById('privacy-policy-panel');
  if (!launcher || !panel || !form || !messages) return;

  const welcomedKey = 'akhAssistantWelcomed';
  let autoShown = false;
  const hasWelcomed = () => {
    try { return sessionStorage.getItem(welcomedKey) === '1'; } catch (_) { return autoShown; }
  };
  const markWelcomed = () => {
    autoShown = true;
    try { sessionStorage.setItem(welcomedKey, '1'); } catch (_) {}
  };
  const openAssistant = (automatic = false) => {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    if (automatic) markWelcomed();
    if (!automatic) {
      markWelcomed();
      input?.focus();
    }
  };
  const closeAssistant = () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    const focusTarget = launcher.hidden
      ? document.querySelector('.homepage-page [data-ask-akh]')
      : launcher;
    focusTarget?.focus();
  };
  launcher.addEventListener('click', () => openAssistant(false));
  closeButton?.addEventListener('click', closeAssistant);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) closeAssistant();
  });

  const canGreet = () => {
    if (hasWelcomed() || !panel.hidden || !privacy?.hidden) return false;
    if (document.body.classList.contains('homepage-page') && launcher.hidden) return false;
    if (document.querySelector('dialog[open]')) return false;
    return true;
  };
  const showWelcome = () => {
    if (!canGreet()) return;
    openAssistant(true);
  };
  const greetingTimer = window.setTimeout(showWelcome, 8500);
  const greetAfterScroll = () => {
    if (window.scrollY > 180 && canGreet()) {
      window.clearTimeout(greetingTimer);
      window.removeEventListener('scroll', greetAfterScroll);
      window.setTimeout(showWelcome, 1100);
    }
  };
  window.addEventListener('scroll', greetAfterScroll, { passive: true });
  ['policy-accept-btn', 'policy-reject-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => window.setTimeout(showWelcome, 900));
  });

  const addMessage = (text, who = 'assistant', linkLabel = '', href = '') => {
    const bubble = document.createElement('p');
    bubble.className = `assistant-message${who === 'user' ? ' user' : ''}`;
    bubble.textContent = text;
    if (linkLabel && href) {
      const link = document.createElement('a');
      link.className = 'assistant-link';
      link.href = href;
      link.textContent = linkLabel;
      bubble.append(document.createElement('br'), link);
    }
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  };

  const respond = question => {
    const q = question.toLowerCase();
    const context = document.body.dataset.assistantContext || 'home';
    if (context === 'learn') {
      if (/certif|partner|accredit|microsoft|google|ibm|openai|provider/.test(q)) return ['Recognised provider learning and certification pathways are something AKH is exploring for the future. No provider partnerships, certificates or accreditations are confirmed today; updates will be shared when plans are confirmed.'];
      if (/career|intern|job|role|placement|opportunit/.test(q)) return ['When internships or roles become available, learners may be considered for opportunities with AKH, sister companies or clients. Openings depend on business needs, and opportunities are not guaranteed. The Careers page lists current roles.', 'Explore Careers', 'careers.html'];
      if (/register|interest|contact|email/.test(q)) return ['You can register your interest by email while AKH develops its learning programmes.', 'Register your interest', 'mailto:info@akhitsolutions.com?subject=Learning%20programme%20interest'];
      if (/course|learn|learning|programme|program|skill|training|topic|path/.test(q)) return ['AKH is shaping practical learning across AI and intelligent workflows, websites and apps, data science and analytics, and digital marketing and transformation. The programme is being developed for students, educators and working professionals.', 'Explore learning paths', 'learn-with-us.html#learning-paths'];
    }
    if (context === 'home') {
      if (/choose the right akh service/.test(q)) return ['Tell me what you want to improve and who needs it. AKH works across web applications, websites, mobile apps, applied AI, SEO, graphic design and technology staffing. I can help you narrow down a practical next step.', 'Browse AKH services', 'services.html#what-we-build'];
      if (/build a website or app from my existing design/.test(q)) return ['Yes. AKH can work from an existing design or help shape a rough idea into a clear brief. We can discuss the key user journeys, integrations and delivery needs before recommending the right build.', 'Explore website development', 'services.html#website-development'];
      if (/improve an existing web application or system/.test(q)) return ['We can start by understanding how the current system is used, where work gets stuck and what needs to improve. From there, the team can discuss focused changes or a broader rebuild if the evidence supports it.', 'Explore web application development', 'services.html#web-application-development'];
      if (/workflow automation save my business time/.test(q)) return ['Applied AI and workflow automation can help with repeated work, information search and product features. AKH evaluates each use case around the existing process, safeguards and human review.', 'Explore AI services', 'services.html#artificial-intelligence'];
      if (/retailweave|marketplace|inventory|returns|seller|finance|product launch/.test(q)) return ['RetailWeave is an upcoming in-house retail operations platform connecting products, orders, inventory, returns, shipping, sellers, payments, finance and reporting.'];
    }
    if (/price|pricing|cost|budget|quote/.test(q)) {
      return ['Project costs depend on the scope, integrations and delivery needs. AKH does not publish fixed prices, so the team will first understand what you need and then discuss an honest estimate.', 'Get a free consultation', 'https://avinashgit26.github.io/akhit-solutions-redesign/contact-us.html'];
    }
    if (/book|call|meeting|consult|talk|contact|demo/.test(q)) {
      return ['You can share a few project details through the contact page and the AKH team can continue the conversation with you. This preview cannot book a time directly.', 'Go to the contact page', 'https://avinashgit26.github.io/akhit-solutions-redesign/contact-us.html'];
    }
    if (context === 'services') {
      if (/staff|developer|frontend|front-end|backend|back-end|cloud|specialist|talent|hire|team/.test(q)) return ['AKH can discuss technology staffing for AI solutions, frontend and backend development, cloud and platform work, and other IT roles shaped around your project needs. Share the capability you need and the team can discuss fit.', 'Explore Tech Staffing', 'services.html#tech-staffing'];
      if (/seo|search|traffic|keyword|ranking|organic/.test(q)) return ['AKH SEO work can include market and competitor analysis, content and keyword planning, page content and metadata, landing page improvements, link profiles, speed and mobile experience.', 'Explore SEO services', 'services.html#seo-services'];
      if (/graphic|brand|logo|visual|social|print|design/.test(q)) return ['AKH graphic design covers logos and visual identity, print and marketing materials, website graphics, and social media content shaped around your brand and audience.', 'Explore graphic design', 'services.html#graphic-design'];
      if (/mobile|ios|android|cross.?platform|app/.test(q)) return ['AKH can plan native iOS and Android apps, cross-platform applications and enterprise mobility, with attention to user experience, security, performance and maintenance.', 'Explore mobile app development', 'services.html#mobile-app-development'];
      if (/website|e.?commerce|storefront|cms|web site|site speed/.test(q)) return ['AKH website work can include responsive business sites, e-commerce storefronts and order flows, content management systems, and page-speed and organic-search improvements.', 'Explore website development', 'services.html#website-development'];
      if (/web app|application|erp|crm|hrm|reservation|appointment|logistic|finance/.test(q)) return ['AKH builds web applications around business workflows, including ERP and finance tools, CRM systems, HR and workforce platforms, reservations, appointments and logistics.', 'Explore web application development', 'services.html#web-application-development'];
      if (/ai|artificial intelligence|automation|assistant|knowledge|image recognition|text analysis/.test(q)) return ['AKH explores applied AI around real processes, including assistants, knowledge search, workflow automation and AI-enabled product features. Image recognition and language or text analysis are also part of the service range; use cases are evaluated with safeguards and human review.', 'Explore Artificial Intelligence', 'services.html#artificial-intelligence'];
      if (/service|build|develop|what can you|where|start/.test(q)) return ['AKH brings together software development, applied AI, SEO, graphic design and technology staffing. You can browse the service areas or share the challenge you want to solve so the team can help identify a useful next step.', 'Browse all services', 'services.html#what-we-build'];
    }
    if (/ai|rag|evaluation|automation|artificial intelligence/.test(q)) {
      return ['AKH offers AI solutions and can explore retrieval-augmented generation, evaluation and workflow automation as part of a practical product need. The right approach depends on your use case.', 'Explore AI services', 'service/artificial-intelligence.html'];
    }
    if (/service|website|web app|application|mobile|seo|design|build|develop/.test(q)) {
      return ['AKH works on web applications, websites, mobile apps, AI solutions, SEO services and graphic design. If you are unsure where to start, describe the problem and the team can help shape the next step.', 'Explore services', 'https://avinashgit26.github.io/akhit-solutions-redesign/service/web-app-development.html'];
    }
    if (/retailweave|marketplace|inventory|returns|seller|finance|product launch/.test(q)) {
      return ['RetailWeave is an upcoming in-house retail operations product. The preview describes connected support for products, orders, inventory, returns, shipping, sellers, payments, finance and reporting. Join the waitlist on this page for special access.'];
    }
    return ['I can help with AKH services, AI capabilities, project costs, RetailWeave or how to contact the team. I cannot provide a live quote or book a meeting in this preview.'];
  };

  const send = text => {
    const question = String(text || '').trim();
    if (!question) return;
    addMessage(question, 'user');
    input.value = '';
    const [answer, linkLabel, href] = respond(question);
    window.setTimeout(() => addMessage(answer, 'assistant', linkLabel, href), 180);
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    send(input.value);
  });
  prompts?.addEventListener('click', event => {
    const button = event.target.closest('button[data-prompt]');
    if (!button) return;
    send(button.dataset.prompt);
  });

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (!Recognition) {
    voiceButton.disabled = true;
    voiceButton.title = 'Voice input is unavailable here. You can type instead.';
  } else if (voiceButton) {
    recognition = new Recognition();
    recognition.lang = 'en-GB';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => { voiceButton.setAttribute('aria-pressed', 'true'); status.textContent = 'Listening. Your browser may send audio to its speech service for transcription.'; };
    recognition.onresult = event => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) { input.value = [input.value.trim(), transcript].filter(Boolean).join(' '); input.focus(); status.textContent = 'Voice input added. Review it, then select Send.'; }
    };
    recognition.onerror = event => { status.textContent = event.error === 'not-allowed' ? 'Microphone access was not allowed. You can type instead.' : 'Voice input stopped. You can type instead.'; };
    recognition.onend = () => voiceButton.setAttribute('aria-pressed', 'false');
    voiceButton.addEventListener('click', () => {
      if (voiceButton.getAttribute('aria-pressed') === 'true') { recognition.stop(); return; }
      status.textContent = 'Starting voice input. Your browser may ask for microphone access.';
      try { recognition.start(); } catch (_) { status.textContent = 'Voice input could not start. You can type instead.'; }
    });
  }

  const newsletter = document.getElementById('preview-newsletter');
  newsletter?.addEventListener('submit', event => event.preventDefault());
  newsletter?.querySelector('.newsletter-button')?.addEventListener('click', () => {
    const email = newsletter.querySelector('input[type="email"]');
    if (email && !email.value.trim()) { email.reportValidity(); return; }
    if (email && !email.validity.valid) { email.reportValidity(); return; }
  });
})();
