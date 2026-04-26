(function () {
  const analyticsId = 'G-F1CVCCNEB6';
  const body = document.body;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navList = document.querySelector('[data-nav-list]');

  function setupAnalytics() {
    if (!/^G-[A-Z0-9]+$/.test(analyticsId) || analyticsId === 'G-XXXXXXXXXX') {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(analyticsId);
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', analyticsId);
  }

  function getClickLabel(element) {
    const label = element.getAttribute('data-analytics-label') ||
      element.getAttribute('aria-label') ||
      element.textContent;

    return label ? label.replace(/\s+/g, ' ').trim().slice(0, 100) : '';
  }

  function trackEvent(eventName, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, Object.assign({
      page_path: window.location.pathname,
      transport_type: 'beacon'
    }, params));
  }

  setupAnalytics();

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

  document.addEventListener('click', function (event) {
    const target = event.target.closest('a, button');
    if (!target) return;

    if (target.matches('[data-theme-toggle]')) {
      trackEvent('theme_toggle_click', {
        click_text: getClickLabel(target)
      });
      return;
    }

    if (target.matches('[data-nav-toggle]')) {
      trackEvent('menu_toggle_click', {
        click_text: getClickLabel(target)
      });
      return;
    }

    if (target.matches('[data-accordion-trigger]')) {
      trackEvent('faq_click', {
        click_text: getClickLabel(target)
      });
      return;
    }

    if (target.tagName === 'A') {
      const href = target.getAttribute('href') || '';
      const url = new URL(href, window.location.href);
      const isOutbound = url.origin !== window.location.origin;
      const eventName = href.includes('pf.kakao.com') ? 'contact_click' : target.classList.contains('nav-link') ? 'nav_click' : 'link_click';

      trackEvent(eventName, {
        click_text: getClickLabel(target),
        link_url: url.href,
        outbound: isOutbound
      });
      return;
    }

    trackEvent('button_click', {
      click_text: getClickLabel(target)
    });
  });
})();
