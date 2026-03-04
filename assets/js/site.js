(function () {
  const body = document.body;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navList = document.querySelector('[data-nav-list]');

  function applyTheme(theme) {
    body.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
      themeToggle.setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
    }
  }

  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'light';
  applyTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const nextTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', nextTheme);
      applyTheme(nextTheme);
    });
  }

  if (navToggle && navList) {
    navToggle.addEventListener('click', function () {
      const isOpen = navList.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function normalizePath(path) {
    const stripped = path.replace(/index\.html$/, '');
    if (stripped === '') return '/';
    return stripped.endsWith('/') ? stripped : stripped + '/';
  }

  const currentPath = normalizePath(window.location.pathname);
  document.querySelectorAll('.nav-link').forEach(function (link) {
    const href = link.getAttribute('href');
    if (!href) return;
    if (normalizePath(href) === currentPath) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  const accordionItems = document.querySelectorAll('[data-accordion-item]');
  accordionItems.forEach(function (item) {
    const trigger = item.querySelector('[data-accordion-trigger]');
    const panel = item.querySelector('[data-accordion-panel]');
    if (!trigger || !panel) return;

    function toggle(open) {
      trigger.setAttribute('aria-expanded', String(open));
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    }

    trigger.addEventListener('click', function () {
      const open = trigger.getAttribute('aria-expanded') !== 'true';
      toggle(open);
    });

    trigger.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const open = trigger.getAttribute('aria-expanded') !== 'true';
        toggle(open);
      }
    });

    window.addEventListener('resize', function () {
      if (trigger.getAttribute('aria-expanded') === 'true') {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
})();
