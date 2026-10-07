// Floating nav: full-width bar at the top of the page, compact centred pill once scrolled.
// Mobile booking bar: hidden over the hero (which has its own CTA), shown once scrolled past it.
(function () {
  const header = document.getElementById('header');
  if (!header) return;
  const ctaBar = document.getElementById('ctaBar');
  let ticking = false;
  function update() {
    header.classList.toggle('scrolled', window.scrollY > 24);
    if (ctaBar) ctaBar.classList.toggle('show', window.scrollY > 480);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

// GA4 conversion events. Everything is delegated, so no per-page markup is needed:
//   contact_whatsapp / contact_email / contact_phone: click on a wa.me / mailto: / tel: link
//   cta_click: click on a gold button (Book a call etc.), with its text and target
//   generate_lead: the contact form's success panel appears (Formspree accepted the POST)
(function () {
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  const page = () => location.pathname;

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('https://wa.me/')) track('contact_whatsapp', { page_path: page() });
    else if (href.startsWith('mailto:')) track('contact_email', { page_path: page() });
    else if (href.startsWith('tel:')) track('contact_phone', { page_path: page() });
    if (a.classList.contains('btn-gold')) {
      track('cta_click', { cta_text: a.textContent.trim(), cta_target: href, page_path: page() });
    }
  }, { passive: true });

  const success = document.getElementById('formSuccess');
  if (success) {
    new MutationObserver((_, obs) => {
      if (success.classList.contains('show')) {
        track('generate_lead', { method: 'contact_form', page_path: page() });
        obs.disconnect();
      }
    }).observe(success, { attributes: true, attributeFilter: ['class'] });
  }
})();
