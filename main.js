// Mobile menu: a full-screen panel opened by the header button.
// While it is open the rest of the page is inert, so focus stays inside the panel.
(function () {
  const menu = document.getElementById('mobileMenu');
  const openBtn = document.getElementById('hamburger');
  const closeBtn = document.getElementById('menuClose');
  if (!menu || !openBtn || !closeBtn) return;
  function setOpen(open) {
    menu.hidden = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-open', open);
    for (const el of document.body.children) {
      if (el !== menu && el.tagName !== 'SCRIPT') el.inert = open;
    }
    (open ? closeBtn : openBtn).focus();
  }
  openBtn.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) setOpen(false);
  });
  // Leaving the phone layout with the menu open (rotation, resize) closes it
  window.matchMedia('(min-width: 761px)').addEventListener('change', (e) => {
    if (e.matches && !menu.hidden) setOpen(false);
  });
})();

// Contact form: posts to Formspree and swaps the form for the success panel.
// Button states come from data attributes on the form, so EN and IT share this code.
(function () {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  const wrapper = document.getElementById('contactFormWrapper');
  if (!form || !success || !wrapper) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.textContent;
    const fail = () => {
      btn.textContent = form.dataset.error || label;
      btn.disabled = false;
    };
    btn.textContent = form.dataset.sending || label;
    btn.disabled = true;
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        wrapper.hidden = true;
        success.classList.add('show');
        success.focus();
      } else fail();
    } catch { fail(); }
  });
})();

// GA4 conversion events. Everything is delegated, so no per-page markup is needed:
//   contact_whatsapp / contact_email / contact_phone: click on a wa.me / mailto: / tel: link
//   cta_click: click on a primary button (Book a call etc.), with its text and target
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
    if (a.classList.contains('btn-primary')) {
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
