// Interactive mode for the Bocconi maths drill.
// The page works without this file: questions, answer key and worked solutions are all in
// the HTML. This adds a 75-minute timer, clickable answers and scoring by the Bocconi rule
// (+1 correct, 0 blank, -0.2 wrong). The key, topics and score bands are read from the page,
// so the script holds no question data and serves the English and Italian pages alike.
(function () {
  const article = document.querySelector('.article-body');
  const keyGrid = article && article.querySelector('.drill-keygrid');
  const questions = article ? Array.from(article.querySelectorAll('.drill-q')) : [];
  const sols = article ? Array.from(article.querySelectorAll('.drill-sol')) : [];
  if (!keyGrid || !questions.length || sols.length !== questions.length) return;

  const it = document.documentElement.lang === 'it';
  const T = it ? {
    startTitle: 'Fai la simulazione su questa pagina',
    startText: 'Timer di 75 minuti, risposte cliccabili e punteggio calcolato come fa Bocconi. Risposte e soluzioni restano nascoste fino alla consegna.',
    startBtn: 'Inizia la simulazione',
    answered: 'Risposte',
    submit: 'Consegna',
    confirm: (n, total) => 'Hai risposto a ' + n + ' domande su ' + total + '. Vuoi consegnare?',
    result: 'Il tuo risultato',
    outOf: 'su',
    correct: ['corretta', 'corrette'], wrong: ['sbagliata', 'sbagliate'], blank: ['in bianco', 'in bianco'],
    timeUsed: 'Tempo usato',
    timeUp: 'Tempo scaduto: la simulazione è stata consegnata in automatico.',
    byTopic: 'Per argomento',
    review: 'Da rivedere:',
    markOk: 'Corretta.',
    markNo: 'Sbagliata. Risposta giusta:',
    markBlank: 'In bianco. Risposta giusta:',
    seeSolution: 'Vedi la soluzione',
    cta: 'Se è sempre lo stesso argomento a costarti punti, in venti minuti di chiamata gratuita capiamo perché.',
    ctaBtn: 'Prenota una chiamata gratuita',
    contact: '/it/contact/',
    retry: 'Rifai la simulazione',
    mailLabel: 'Vuoi che guardi i tuoi risultati? Lasciami la tua email e ti rispondo io.',
    mailHint: 'tu@esempio.it',
    mailBtn: 'Invia i risultati',
    mailNote: 'Uso la tua email solo per risponderti. Niente newsletter.',
    mailBusy: 'Invio in corso…',
    mailDone: 'Grazie. Ho ricevuto i tuoi risultati e ti rispondo entro 24 ore.',
    mailError: 'Errore. Prova a scrivermi direttamente',
    mailSubject: 'Simulazione Bocconi: risultati',
    score: 'Punteggio',
  } : {
    startTitle: 'Take the drill on this page',
    startText: 'A 75-minute timer, clickable answers and a score worked out the way Bocconi does it. Answers and solutions stay hidden until you submit.',
    startBtn: 'Start the drill',
    answered: 'Answered',
    submit: 'Submit',
    confirm: (n, total) => 'You answered ' + n + ' of ' + total + ' questions. Submit now?',
    result: 'Your result',
    outOf: 'out of',
    correct: ['correct', 'correct'], wrong: ['wrong', 'wrong'], blank: ['blank', 'blank'],
    timeUsed: 'Time used',
    timeUp: 'Time is up: the drill was submitted for you.',
    byTopic: 'By topic',
    review: 'To review:',
    markOk: 'Correct.',
    markNo: 'Wrong. Right answer:',
    markBlank: 'Blank. Right answer:',
    seeSolution: 'See the solution',
    cta: 'If the same topic keeps costing you marks, a free 20-minute call will show why.',
    ctaBtn: 'Book a free call',
    contact: '/contact/',
    retry: 'Take it again',
    mailLabel: 'Want me to look at your results? Leave your email and I will reply.',
    mailHint: 'you@example.com',
    mailBtn: 'Send my results',
    mailNote: 'I use your email only to reply to you. No newsletter.',
    mailBusy: 'Sending…',
    mailDone: 'Thank you. I have your results and will reply within 24 hours.',
    mailError: 'Error. Try emailing directly',
    mailSubject: 'Bocconi drill: results',
    score: 'Score',
  };

  const MINUTES = 75;
  const PENALTY = 0.2;
  const STORE = 'drill:' + location.pathname;
  const INBOX = 'https://formspree.io/f/mredwgkk';   // same Formspree form as the contact page
  const fmt = (n) => n.toLocaleString(it ? 'it-IT' : 'en-GB', { maximumFractionDigits: 1 });
  const clock = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const el = (tag, cls, html) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html) node.innerHTML = html;
    return node;
  };
  const track = (name, params) => {
    if (typeof window.gtag === 'function') window.gtag('event', name, Object.assign({ page_path: location.pathname }, params));
  };

  // --- read the page -----------------------------------------------------
  const key = {};
  keyGrid.querySelectorAll('.drill-key').forEach((k) => {
    key[k.querySelector('b').textContent.trim()] = k.lastChild.textContent.trim();
  });
  const items = questions.map((li, i) => {
    const heading = li.parentElement.previousElementSibling;
    return {
      n: i + 1,
      li: li,
      topic: heading && heading.tagName === 'H3' ? heading.textContent.trim() : '',
      opts: Array.from(li.querySelectorAll('.drill-opts li')).map((o) => ({
        el: o, letter: o.querySelector('.drill-let').textContent.trim(),
      })),
    };
  });
  if (items.some((q) => !key[q.n])) return;
  sols.forEach((s, i) => { s.id = 'sol-' + (i + 1); });
  const bands = document.getElementById('drillBands');

  // --- build the extra pieces ---------------------------------------------
  // answer key + worked solutions go in one wrapper so they can be hidden while the clock runs
  const firstAnswer = keyGrid.previousElementSibling;
  const lastAnswer = sols[0].parentElement;
  if (!firstAnswer || firstAnswer.tagName !== 'H2') return;
  const answers = el('div');
  firstAnswer.before(answers);
  for (let node = firstAnswer; node;) {
    const next = node.nextElementSibling;
    answers.append(node);
    if (node === lastAnswer) break;
    node = next;
  }

  let listHeading = questions[0].parentElement;
  while (listHeading && listHeading.tagName !== 'H2') listHeading = listHeading.previousElementSibling;
  if (!listHeading) return;
  listHeading.classList.add('drill-anchor');   // clears the fixed header when scrolled to

  const start = el('div', 'drill-start',
    '<p class="drill-label">' + T.startTitle + '</p><p>' + T.startText + '</p>' +
    '<button type="button" class="btn btn-gold">' + T.startBtn + '</button>');
  listHeading.before(start);

  const endWrap = el('p', 'drill-end', '<button type="button" class="btn btn-gold">' + T.submit + '</button>');
  questions[questions.length - 1].parentElement.after(endWrap);

  const result = el('div', 'drill-result');
  result.tabIndex = -1;
  answers.before(result);

  const bar = el('div', 'drill-bar',
    '<span><b class="drill-time"></b></span>' +
    '<span>' + T.answered + ' <b class="drill-count">0</b>/' + items.length + '</span>' +
    '<button type="button" class="btn btn-gold">' + T.submit + '</button>');
  document.body.append(bar);
  const timeEl = bar.querySelector('.drill-time');
  const countEl = bar.querySelector('.drill-count');

  // --- state ----------------------------------------------------------------
  let state = { status: 'idle', answers: {}, end: 0, used: 0, timedOut: false };
  let tick = null;
  let summary = '';   // plain-text result, sent along if the visitor leaves an email
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ } };
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)); } catch (e) { return null; } };
  const secondsLeft = () => Math.max(0, Math.round((state.end - Date.now()) / 1000));

  function render() {
    const running = state.status === 'running';
    const done = state.status === 'done';
    article.classList.toggle('drill-live', running);
    article.classList.toggle('drill-done', done);
    document.body.classList.toggle('drill-running', running);
    start.hidden = state.status !== 'idle';
    bar.hidden = endWrap.hidden = !running;
    answers.hidden = running;
    result.hidden = !done;
    article.querySelectorAll('.drill-mark').forEach((m) => m.remove());
    items.forEach((q) => {
      const list = q.li.querySelector('.drill-opts');
      if (running) list.setAttribute('role', 'radiogroup'); else list.removeAttribute('role');
      q.opts.forEach((o) => {
        const picked = state.answers[q.n] === o.letter;
        o.el.classList.toggle('is-picked', !!picked && state.status !== 'idle');
        o.el.classList.toggle('is-right', done && key[q.n] === o.letter);
        if (running) {
          o.el.setAttribute('role', 'radio');
          o.el.setAttribute('aria-checked', picked ? 'true' : 'false');
          o.el.tabIndex = 0;
        } else {
          o.el.removeAttribute('role');
          o.el.removeAttribute('aria-checked');
          o.el.removeAttribute('tabindex');
        }
      });
    });
    countEl.textContent = Object.keys(state.answers).length;
  }

  function updateClock() {
    const left = secondsLeft();
    timeEl.textContent = clock(left);
    bar.classList.toggle('is-low', left <= 300);
    if (left <= 0) finish(true, false);
  }

  function run() {
    render();
    updateClock();
    clearInterval(tick);
    if (state.status === 'running') tick = setInterval(updateClock, 500);
  }

  function begin() {
    state = { status: 'running', answers: {}, end: Date.now() + MINUTES * 60000, used: 0, timedOut: false };
    save();
    run();
    track('drill_start');
    listHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function pick(option) {
    if (state.status !== 'running') return;
    const q = items.find((x) => x.li.contains(option));
    const o = q && q.opts.find((x) => x.el === option);
    if (!o) return;
    // a second click on the chosen answer clears it, leaving the question blank
    if (state.answers[q.n] === o.letter) delete state.answers[q.n];
    else state.answers[q.n] = o.letter;
    save();
    render();
  }

  function finish(timedOut, quiet) {
    clearInterval(tick);
    state.used = MINUTES * 60 - secondsLeft();
    state.status = 'done';
    state.timedOut = timedOut;
    save();
    const score = showResult();
    track('drill_complete', { score: score, timed_out: timedOut });
    if (!quiet) {
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      result.focus({ preventScroll: true });
    }
  }

  function showResult() {
    render();
    let correct = 0, wrong = 0;
    const topics = [];
    const review = [];
    items.forEach((q) => {
      const given = state.answers[q.n];
      const ok = given === key[q.n];
      if (ok) correct++; else if (given) wrong++;
      if (!ok) review.push(q.n);
      let topic = topics.find((t) => t.name === q.topic);
      if (!topic) topics.push(topic = { name: q.topic, right: 0, total: 0 });
      topic.total++;
      if (ok) topic.right++;
      const link = ' <a href="#sol-' + q.n + '">' + T.seeSolution + '</a>';
      q.li.append(ok
        ? el('p', 'drill-mark ok', T.markOk + link)
        : el('p', 'drill-mark ' + (given ? 'no' : 'blank'), (given ? T.markNo : T.markBlank) + ' ' + key[q.n] + '.' + link));
    });
    const blank = items.length - correct - wrong;
    const score = Math.round((correct - PENALTY * wrong) * 10) / 10;
    const stat = (n, words) => '<span><b>' + n + '</b> ' + words[n === 1 ? 0 : 1] + '</span>';
    const band = bands && bands.children[score < 20 ? 0 : score <= 32 ? 1 : 2];

    summary = [
      T.score + ': ' + fmt(score) + ' ' + T.outOf + ' ' + items.length,
      correct + ' ' + T.correct[1] + ', ' + wrong + ' ' + T.wrong[1] + ', ' + blank + ' ' + T.blank[1],
      T.timeUsed + ': ' + clock(state.used) + (state.timedOut ? ' (' + T.timeUp + ')' : ''),
      T.byTopic + ': ' + topics.map((t) => t.name + ' ' + t.right + '/' + t.total).join('; '),
      T.review + ' ' + (review.join(', ') || '-'),
      location.href,
    ].join('\n');

    result.innerHTML =
      '<p class="drill-label">' + T.result + '</p>' +
      '<p class="drill-score">' + fmt(score) + ' <small>' + T.outOf + ' ' + items.length + '</small></p>' +
      '<p class="drill-stats">' + stat(correct, T.correct) + stat(wrong, T.wrong) + stat(blank, T.blank) + '<span>' + T.timeUsed + ' <b>' + clock(state.used) + '</b></span></p>' +
      (state.timedOut ? '<p class="drill-note">' + T.timeUp + '</p>' : '') +
      (band ? '<p class="drill-band">' + band.innerHTML + '</p>' : '') +
      '<p class="drill-label">' + T.byTopic + '</p>' +
      '<ul class="drill-topics">' + topics.map((t) =>
        '<li><span>' + t.name + '</span><span>' + t.right + '/' + t.total + '</span>' +
        '<span class="drill-meter"><i style="width:' + Math.round(100 * t.right / t.total) + '%"></i></span></li>').join('') + '</ul>' +
      (review.length ? '<p class="drill-review">' + T.review + ' ' +
        review.map((n) => '<a href="#sol-' + n + '">' + n + '</a>').join(' ') + '</p>' : '') +
      '<p>' + T.cta + '</p>' +
      '<div class="drill-actions"><a href="' + T.contact + '" class="btn btn-gold">' + T.ctaBtn + '</a>' +
      '<button type="button" class="btn btn-outline drill-retry">' + T.retry + '</button></div>' +
      (state.mailed
        ? '<p class="drill-mail drill-mail-done">' + T.mailDone + '</p>'
        : '<form class="drill-mail"><label for="drillEmail">' + T.mailLabel + '</label>' +
          '<div class="drill-mail-row"><input class="form-input" type="email" id="drillEmail" name="email" placeholder="' + T.mailHint +
          '" autocomplete="email" required /><button type="submit" class="btn btn-outline">' + T.mailBtn + '</button></div>' +
          '<p class="drill-mail-note">' + T.mailNote + '</p></form>');
    return score;
  }

  function reset() {
    try { localStorage.removeItem(STORE); } catch (e) { /* private mode */ }
    state = { status: 'idle', answers: {}, end: 0, used: 0, timedOut: false };
    render();
    start.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // optional: the visitor leaves an email and the result goes to the tutor's inbox
  async function mail(form) {
    const btn = form.querySelector('button');
    const data = new FormData(form);
    data.append('_subject', T.mailSubject);
    data.append('service', 'Bocconi Test Prep');
    data.append('message', summary);
    btn.textContent = T.mailBusy;
    btn.disabled = true;
    try {
      const res = await fetch(INBOX, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
      state.mailed = true;
      save();
      form.outerHTML = '<p class="drill-mail drill-mail-done">' + T.mailDone + '</p>';
      track('generate_lead', { method: 'drill_results' });
    } catch (e) {
      btn.textContent = T.mailError;
      btn.disabled = false;
    }
  }

  function submit() {
    if (window.confirm(T.confirm(Object.keys(state.answers).length, items.length))) finish(false, false);
  }

  // --- events ---------------------------------------------------------------
  start.querySelector('button').addEventListener('click', begin);
  bar.querySelector('button').addEventListener('click', submit);
  endWrap.querySelector('button').addEventListener('click', submit);
  result.addEventListener('click', (e) => { if (e.target.closest('.drill-retry')) reset(); });
  result.addEventListener('submit', (e) => { e.preventDefault(); mail(e.target); });
  article.addEventListener('click', (e) => {
    const option = e.target.closest('.drill-opts li');
    if (option) pick(option);
  });
  article.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const option = e.target.closest('.drill-opts li');
    if (option && state.status === 'running') { e.preventDefault(); pick(option); }
  });

  // --- pick up where the visitor left off -------------------------------------
  const saved = load();
  if (saved && saved.status === 'running' && saved.end) {
    state = saved;
    if (secondsLeft() > 0) run(); else finish(true, true);
  } else if (saved && saved.status === 'done') {
    state = saved;
    showResult();
  } else {
    render();
  }
})();
