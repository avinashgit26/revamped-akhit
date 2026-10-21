(() => {
  const canvas = document.querySelector('.careers-crowd-canvas');
  if (!canvas) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const sprite = new Image();
  sprite.src = 'website/images/careers/crowd-sprite.png';
  const columns = 4;
  const rows = 3;
  const cellWidth = 362;
  const cellHeight = 362;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let people = [];
  let frameId = 0;
  let lastTime = 0;
  let isVisible = !document.hidden;

  function makePeople() {
    const compact = width < 650;
    const frontSize = compact ? 96 : Math.max(132, Math.min(176, width * 0.105));
    people = [];
    const rowCount = 6;

    for (let row = 0; row < rowCount; row += 1) {
      const depth = row / (rowCount - 1);
      const size = frontSize * (0.46 + depth * 0.54);
      // Preserve the previous figure count as rows are reduced from eight to six.
      const step = size * 0.315;
      const baseline = height * (0.24 + depth * 0.76);
      const opacity = 0.58 + depth * 0.42;
      const direction = row % 2 === 0 ? 1 : -1;
      const rowSpeed = (compact ? 2.5 : 3.5) + depth * (compact ? 2.5 : 4.5);
      const count = Math.ceil(width / step) + 3;
      const stagger = row % 2 === 0 ? 0 : step / 2;

      for (let index = 0; index < count; index += 1) {
        const figureSize = size * (0.92 + Math.random() * 0.16);
        const jitter = (Math.random() - 0.5) * step * 0.18;
        people.push({
          frame: Math.floor(Math.random() * columns * rows),
          size: figureSize,
          x: (index - 1) * step + stagger + jitter,
          direction,
          baseline,
          opacity,
          speed: rowSpeed + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  function fitCanvas() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    width = bounds.width;
    height = bounds.height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    stop();
    makePeople();
    render(0, !motionPreference.matches);
    canvas.classList.add('is-ready');
  }

  function paint(time, delta, animate) {
    context.clearRect(0, 0, width, height);
    for (const person of people) {
      if (animate) {
        person.x += person.speed * person.direction * (delta / 1000);
        if (person.direction > 0 && person.x > width + person.size) person.x = -person.size;
        if (person.direction < 0 && person.x < -person.size) person.x = width + person.size;
      }
      const sourceX = (person.frame % columns) * cellWidth;
      const sourceY = Math.floor(person.frame / columns) * cellHeight;
      const bob = animate ? Math.sin(time * 0.004 + person.phase) * 1.2 : 0;
      const x = person.x;
      const y = person.baseline - person.size + bob + 2;
      context.save();
      context.globalAlpha = person.opacity;
      if (person.direction < 0) {
        context.translate(x + person.size, 0);
        context.scale(-1, 1);
        context.drawImage(sprite, sourceX, sourceY, cellWidth, cellHeight, 0, y, person.size, person.size);
      } else {
        context.drawImage(sprite, sourceX, sourceY, cellWidth, cellHeight, x, y, person.size, person.size);
      }
      context.restore();
    }
  }

  function render(timestamp, animate = !motionPreference.matches) {
    if (!isVisible || !width || !height) return;
    const delta = lastTime ? Math.min(timestamp - lastTime, 40) : 0;
    lastTime = timestamp;
    paint(timestamp, delta, animate);
    if (animate) frameId = window.requestAnimationFrame(nextTime => render(nextTime, true));
  }

  function stop() {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = 0;
  }

  function updateMotionPreference() {
    stop();
    makePeople();
    render(0, !motionPreference.matches);
  }

  function handleVisibility() {
    isVisible = !document.hidden;
    stop();
    if (isVisible) render(0, !motionPreference.matches);
  }

  sprite.addEventListener('load', fitCanvas, { once: true });
  sprite.addEventListener('error', () => canvas.classList.remove('is-ready'), { once: true });
  if (sprite.complete && sprite.naturalWidth) fitCanvas();

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener('resize', fitCanvas, { passive: true });
  }
  if (motionPreference.addEventListener) motionPreference.addEventListener('change', updateMotionPreference);
  else motionPreference.addListener(updateMotionPreference);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('pagehide', () => {
    stop();
    document.removeEventListener('visibilitychange', handleVisibility);
  }, { once: true });
})();
