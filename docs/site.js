(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const system = window.matchMedia('(prefers-color-scheme: dark)');

  // Theme switch: remembers an explicit choice, otherwise follows the system.
  const toggle = document.querySelector('.theme-toggle');
  const label = toggle && toggle.querySelector('.theme-label');
  let saved = null;
  try {saved = localStorage.getItem('ramez-theme');} catch (_) { /* Private mode: follow the system. */ }
  let selected = saved === 'light' || saved === 'dark' ? saved : null;
  const applyTheme = () => {
    const theme = selected || (system.matches ? 'dark' : 'light');
    const next = theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = theme;
    if (!toggle) return;
    if (label) label.textContent = next === 'dark' ? 'Dark' : 'Light';
    toggle.setAttribute('aria-label', `Use ${next} theme`);
  };
  if (toggle) toggle.addEventListener('click', () => {
    selected = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try {localStorage.setItem('ramez-theme', selected);} catch (_) { /* Session-only choice. */ }
    applyTheme();
  });
  system.addEventListener('change', () => {if (!selected) applyTheme();});
  applyTheme();

  // Pointing at a line, a station, a legend entry or a note dims the other lines.
  document.querySelectorAll('.hero, .lines').forEach(area => {
    const lineAt = node => {
      const el = node && node.closest ? node.closest('[data-line]') : null;
      return el && area.contains(el) ? el.dataset.line.split(' ')[0] : null;
    };
    const show = line => {
      if (line) area.dataset.active = line;
      else delete area.dataset.active;
    };
    area.addEventListener('pointerover', event => show(lineAt(event.target)));
    area.addEventListener('pointerleave', () => show(null));
    area.addEventListener('focusin', event => show(lineAt(event.target)));
    area.addEventListener('focusout', event => {if (!lineAt(event.relatedTarget)) show(null);});
  });

  // The map draws once. Afterwards the animation is dropped so nothing can leave it half drawn.
  if (root.classList.contains('motion')) {
    const running = [...document.querySelectorAll('.map, .mini-map')]
      .filter(map => map.offsetParent).flatMap(map => map.getAnimations({subtree: true}));
    Promise.all(running.map(a => a.finished)).catch(() => {}).then(() => root.classList.remove('motion'));
  }

  const contents = document.querySelector('details.contents');
  if (contents && window.matchMedia('(max-width: 1099.98px)').matches) contents.open = false;

  // Article contents: stations you have passed are filled, the current one is larger.
  const links = [...document.querySelectorAll('.contents a[href^="#"]')];
  if (links.length) {
    const targets = links.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1))));
    root.classList.add('has-spy');
    let queued = false;
    const update = () => {
      queued = false;
      const line = window.innerHeight * 0.25;
      let current = -1;
      targets.forEach((target, i) => {if (target && target.getBoundingClientRect().top <= line) current = i;});
      links.forEach((link, i) => {
        link.classList.toggle('is-read', i < current);
        if (i === current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };
    const queue = () => {if (!queued) {queued = true; requestAnimationFrame(update);}};
    window.addEventListener('scroll', queue, {passive: true});
    window.addEventListener('resize', queue);
    update();
  }
})();
