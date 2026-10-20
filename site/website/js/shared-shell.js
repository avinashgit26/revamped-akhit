(() => {
  const ribbon = document.querySelector('.launch-bar');
  const header = document.querySelector('header.header');
  if (ribbon && header) {
    const syncHeader = visible => header.classList.toggle('is-ribbon-gone', !visible);
    syncHeader(ribbon.getBoundingClientRect().bottom > 0);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => syncHeader(entry.isIntersecting), { threshold: 0 });
      observer.observe(ribbon);
    } else {
      window.addEventListener('scroll', () => syncHeader(ribbon.getBoundingClientRect().bottom > 0), { passive: true });
    }
  }

  const dialog = document.getElementById('waitlist-dialog');
  if (!dialog) return;
  const open = document.getElementById('open-waitlist');
  const close = document.getElementById('close-waitlist');
  const form = document.getElementById('waitlist-form');
  const email = document.getElementById('waitlist-email');
  const status = document.getElementById('waitlist-status');
  open?.addEventListener('click', () => dialog.showModal());
  close?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!email?.value.trim() || !email.validity.valid) { email?.reportValidity(); return; }
    if (status) status.textContent = 'This preview is not connected, so your email has not been saved or sent.';
  });
})();
