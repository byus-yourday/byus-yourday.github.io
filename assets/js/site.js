(function () {
  const analyticsId = 'G-F1CVCCNEB6';
  const EVENT_NAMES = {
    pageView: 'page_view',
    navClick: 'nav_click',
    sectionView: 'section_view',
    contactClick: 'contact_click',
    kakaoClick: 'kakao_click',
    reservationClick: 'reservation_click',
    priceClick: 'price_click',
    processClick: 'process_click',
    operationClick: 'operation_click',
    externalLinkClick: 'external_link_click',
    outboundClick: 'outbound_click',
    faqOpen: 'faq_open',
    referenceClick: 'reference_click',
    reviewClick: 'review_click',
    scrollDepth: 'scroll_depth',
    priceExpand: 'price_expand',
    inquiryModalOpen: 'inquiry_modal_open',
    inquiryFormStart: 'inquiry_form_start',
    inquiryTextGenerate: 'inquiry_text_generate',
    inquiryCopyClick: 'inquiry_copy_click',
    inquiryKakaoClick: 'inquiry_kakao_click',
    inquiryModalClose: 'inquiry_modal_close',
    phoneClick: 'phone_click',
    smsClick: 'sms_click',
    emailClick: 'email_click'
  };
  const KAKAO_CHANNEL_URL = 'http://pf.kakao.com/_CSMyn/chat';
  const INQUIRY_STORAGE_KEY = 'bias-inquiry-draft-v1';
  const body = document.body;
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navList = document.querySelector('[data-nav-list]');
  const analyticsEnabled = /^G-[A-Z0-9]+$/.test(analyticsId) && analyticsId !== 'G-XXXXXXXXXX';
  const debugAnalytics = new URLSearchParams(window.location.search).get('debug_analytics') === '1';
  const seenSections = new Set();
  const seenScrollDepths = new Set();
  const inquiryDraft = loadInquiryDraft();
  let inquiryElements = null;
  let inquirySession = createInquirySession();

  const inquiryOptions = {
    serviceType: [
      { value: 'groom_side_2', label: '한측 2인 - 신랑측' },
      { value: 'bride_side_2', label: '한측 2인 - 신부측' },
      { value: 'both_1_each', label: '양측 1인' },
      { value: 'both_2_each', label: '양측 2인' },
      { value: 'consult', label: '상담 필요' }
    ],
    sealType: [
      { value: 'A', label: 'A - 바로 밀봉' },
      { value: 'B', label: 'B - 금액 확인 후 밀봉' },
      { value: 'C', label: 'C - 금액 확인 및 계수 후 밀봉' },
      { value: 'consult', label: '상담 필요' }
    ],
    guestCountRange: [
      { value: 'under_50', label: '50명 미만' },
      { value: 'under_100', label: '100명 미만' },
      { value: 'under_150', label: '150명 미만' },
      { value: 'under_180', label: '180명 미만' },
      { value: 'under_200', label: '200명 미만' },
      { value: 'under_230', label: '230명 미만' },
      { value: 'under_250', label: '250명 미만' },
      { value: 'under_280', label: '280명 미만' },
      { value: 'under_300', label: '300명 미만' },
      { value: 'over_300', label: '300명 이상' },
      { value: 'unknown', label: '미정' }
    ]
  };

  function createInquirySession() {
    return {
      sourceButton: 'unknown',
      formStarted: false,
      textGenerated: false,
      copied: false
    };
  }

  function loadInquiryDraft() {
    try {
      const raw = window.sessionStorage.getItem(INQUIRY_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveInquiryDraft(draft) {
    try {
      window.sessionStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      // Ignore sessionStorage errors.
    }
  }

  function resetInquiryDraft() {
    Object.keys(inquiryDraft).forEach(function (key) {
      delete inquiryDraft[key];
    });

    try {
      window.sessionStorage.removeItem(INQUIRY_STORAGE_KEY);
    } catch (error) {
      // Ignore sessionStorage errors.
    }
  }

  function debugLog(type, name, payload) {
    if (!debugAnalytics) return;
    console.log('[GA4] ' + type + ': ' + name, payload);
  }

  function setupAnalytics() {
    if (!analyticsEnabled) {
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
    window.gtag('config', analyticsId, {
      send_page_view: false
    });
  }

  function sanitizeParams(params) {
    return Object.entries(params || {}).reduce(function (result, entry) {
      const key = entry[0];
      const value = entry[1];
      if (value === undefined || value === null || value === '') {
        return result;
      }
      result[key] = value;
      return result;
    }, {});
  }

  function trackEvent(eventName, params) {
    const payload = sanitizeParams(Object.assign({
      page_path: window.location.pathname,
      page_location: window.location.href
    }, params));

    debugLog('event', eventName, payload);

    if (!analyticsEnabled || typeof window.gtag !== 'function') {
      return;
    }

    window.gtag('event', eventName, payload);
  }

  window.trackEvent = trackEvent;

  function trackPageView() {
    trackEvent(EVENT_NAMES.pageView, {
      page_title: document.title
    });
  }

  function getTextLabel(element) {
    const label = element.getAttribute('data-label') ||
      element.getAttribute('data-analytics-label') ||
      element.getAttribute('aria-label') ||
      element.textContent;

    return label ? label.replace(/\s+/g, ' ').trim().slice(0, 150) : '';
  }

  function getSectionName(element) {
    const section = element.closest('[data-track-section]');
    if (!section) return '';
    return section.getAttribute('data-section-name') || section.id || '';
  }

  function getSectionId(element) {
    const section = element.closest('[data-track-section]');
    if (!section) return '';
    return section.id || section.getAttribute('data-section-id') || '';
  }

  function normalizePath(path) {
    const stripped = path.replace(/index\.html$/, '');
    if (stripped === '') return '/';
    return stripped.endsWith('/') ? stripped : stripped + '/';
  }

  function getLinkType(url) {
    const href = url.href.toLowerCase();
    if (href.startsWith('mailto:')) return 'email';
    if (href.startsWith('tel:')) return 'phone';
    if (href.startsWith('sms:')) return 'sms';
    if (url.hostname === 'pf.kakao.com') return 'kakao';
    if (url.hostname.includes('blog.naver.com')) return 'blog';
    if (url.hostname.includes('instagram.com')) return 'instagram';
    if (url.origin !== window.location.origin) return 'external';
    return 'internal';
  }

  function getSafeUrl(target) {
    const href = target.getAttribute('href');
    if (!href) return null;

    try {
      return new URL(href, window.location.href);
    } catch (error) {
      return null;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createChoiceMarkup(name, options) {
    return options.map(function (option) {
      return [
        '<label class="inquiry-chip">',
        '<input type="radio" name="' + name + '" value="' + option.value + '" data-inquiry-field="' + name + '">',
        '<span>' + escapeHtml(option.label) + '</span>',
        '</label>'
      ].join('');
    }).join('');
  }

  function buildInquiryModal() {
    const modal = document.createElement('div');
    modal.className = 'inquiry-modal';
    modal.hidden = true;
    modal.setAttribute('data-inquiry-modal', '');
    modal.innerHTML = [
      '<div class="inquiry-modal__backdrop" data-inquiry-close="backdrop"></div>',
      '<div class="inquiry-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="inquiry-modal-title" tabindex="-1">',
      '<div class="inquiry-modal__header">',
      '<div>',
      '<p class="inquiry-modal__eyebrow">문의 내용을 먼저 정리해보세요</p>',
      '<h2 id="inquiry-modal-title">예약 문의 내용 만들기</h2>',
      '</div>',
      '<button class="inquiry-icon-button" type="button" aria-label="문의 모달 닫기" data-inquiry-close="button">닫기</button>',
      '</div>',
      '<div class="inquiry-modal__body">',
      '<section class="inquiry-screen" data-inquiry-form-screen>',
      '<div class="inquiry-modal__intro">',
      '<p class="inquiry-modal__intro-title">정해진 예식 정보를 입력해 주세요.</p>',
      '<p class="inquiry-modal__intro-copy">일부 항목이 미정인 경우에도 상담 중 함께 정리할 수 있습니다.</p>',
      '</div>',
      '<div class="inquiry-step">',
      '<div class="inquiry-step__badge">Step 1</div>',
      '<div>',
      '<h3>문의 내용 입력</h3>',
      '<p class="muted">예식 정보를 입력해 주세요.</p>',
      '</div>',
      '</div>',
      '<form class="inquiry-form" data-inquiry-form>',
      '<div class="inquiry-grid">',
      '<label class="inquiry-field">',
      '<span>예식일</span>',
      '<input type="text" name="weddingDate" placeholder="예) 2026년 5월 10일" autocomplete="off" data-inquiry-field="weddingDate" data-inquiry-focus>',
      '</label>',
      '<label class="inquiry-field">',
      '<span>예식 시간</span>',
      '<input type="text" name="weddingTime" placeholder="예) 12시" autocomplete="off" data-inquiry-field="weddingTime">',
      '</label>',
      '<label class="inquiry-field inquiry-field--full">',
      '<span>예약자 / 연락처</span>',
      '<input type="text" name="contactInfo" placeholder="예) 홍길동 / 010-0000-0000" autocomplete="off" data-inquiry-field="contactInfo">',
      '</label>',
      '<label class="inquiry-field inquiry-field--full">',
      '<span>지역 / 예식장</span>',
      '<input type="text" name="venueInfo" placeholder="예) 서울 강남 / OO웨딩홀" autocomplete="off" data-inquiry-field="venueInfo">',
      '</label>',
      '<label class="inquiry-field inquiry-field--full">',
      '<span>홀</span>',
      '<input type="text" name="hallInfo" placeholder="예) 3층 그랜드홀" autocomplete="off" data-inquiry-field="hallInfo">',
      '</label>',
      '<fieldset class="inquiry-choice-group inquiry-field--full">',
      '<legend>서비스 및 담당 축의대</legend>',
      '<div class="inquiry-chip-grid">',
      createChoiceMarkup('serviceType', inquiryOptions.serviceType),
      '</div>',
      '</fieldset>',
      '<fieldset class="inquiry-choice-group inquiry-field--full">',
      '<legend>밀봉 기준</legend>',
      '<div class="inquiry-chip-grid">',
      createChoiceMarkup('sealType', inquiryOptions.sealType),
      '</div>',
      '</fieldset>',
      '<fieldset class="inquiry-choice-group inquiry-field--full">',
      '<legend>서비스 기준 보증인원</legend>',
      '<div class="inquiry-chip-grid inquiry-chip-grid--compact">',
      createChoiceMarkup('guestCountRange', inquiryOptions.guestCountRange),
      '</div>',
      '<p class="inquiry-help">한측 서비스는 해당 측 기준, 양측 서비스는 양측 기준으로 선택해 주세요.</p>',
      '</fieldset>',
      '</div>',
      '<div class="inquiry-actions inquiry-actions--form">',
      '<button class="btn btn-primary" type="submit" data-inquiry-generate>문의 문구 만들기</button>',
      '</div>',
      '</form>',
      '</section>',
      '<section class="inquiry-result inquiry-screen" data-inquiry-result-screen hidden>',
      '<div class="inquiry-step">',
      '<div class="inquiry-step__badge">Step 2</div>',
      '<div>',
      '<h3>생성된 문의 문구</h3>',
      '<p class="muted">내용을 직접 다듬은 뒤 복사해서 카카오톡에 붙여넣어 주세요.</p>',
      '</div>',
      '</div>',
      '<label class="inquiry-field inquiry-field--full">',
      '<span>생성된 문의 문구</span>',
      '<textarea rows="14" data-inquiry-output></textarea>',
      '</label>',
      '<p class="inquiry-status" data-inquiry-status aria-live="polite"></p>',
      '<div class="inquiry-kakao-guard" data-inquiry-kakao-guard hidden>',
      '<p>문의 문구를 먼저 복사하면 카카오톡에서 바로 붙여넣을 수 있습니다.</p>',
      '<div class="inquiry-actions inquiry-actions--guard">',
      '<button class="btn btn-secondary" type="button" data-inquiry-copy-shortcut>먼저 복사하기</button>',
      '<a class="btn btn-primary" href="' + escapeHtml(KAKAO_CHANNEL_URL) + '" target="_blank" rel="noopener" data-inquiry-kakao-force>그래도 카카오톡 열기</a>',
      '</div>',
      '</div>',
      '<div class="inquiry-actions inquiry-actions--result-top">',
      '<button class="btn btn-secondary" type="button" data-inquiry-copy>복사하기</button>',
      '<button class="btn btn-secondary" type="button" data-inquiry-edit>수정하기</button>',
      '</div>',
      '<div class="inquiry-actions inquiry-actions--result-bottom">',
      '<a class="btn btn-primary" href="' + escapeHtml(KAKAO_CHANNEL_URL) + '" target="_blank" rel="noopener" data-inquiry-kakao>카카오톡 문의하기</a>',
      '</div>',
      '</section>',
      '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);

    inquiryElements = {
      modal: modal,
      dialog: modal.querySelector('.inquiry-modal__dialog'),
      body: modal.querySelector('.inquiry-modal__body'),
      form: modal.querySelector('[data-inquiry-form]'),
      formScreen: modal.querySelector('[data-inquiry-form-screen]'),
      output: modal.querySelector('[data-inquiry-output]'),
      resultScreen: modal.querySelector('[data-inquiry-result-screen]'),
      status: modal.querySelector('[data-inquiry-status]'),
      kakaoGuard: modal.querySelector('[data-inquiry-kakao-guard]'),
      kakaoLink: modal.querySelector('[data-inquiry-kakao]'),
      firstInput: modal.querySelector('[data-inquiry-focus]')
    };

    bindInquiryModalEvents();
    syncInquiryFormFromDraft();
  }

  function getInquiryFieldElements() {
    if (!inquiryElements) return [];
    return Array.from(inquiryElements.form.querySelectorAll('[data-inquiry-field]'));
  }

  function updateDraftField(name, value) {
    inquiryDraft[name] = value;
    saveInquiryDraft(inquiryDraft);
  }

  function readInquiryFormValues() {
    if (!inquiryElements) {
      return {};
    }

    const formData = new FormData(inquiryElements.form);
    return {
      weddingDate: String(formData.get('weddingDate') || '').trim(),
      weddingTime: String(formData.get('weddingTime') || '').trim(),
      contactInfo: String(formData.get('contactInfo') || '').trim(),
      venueInfo: String(formData.get('venueInfo') || '').trim(),
      hallInfo: String(formData.get('hallInfo') || '').trim(),
      serviceType: String(formData.get('serviceType') || '').trim(),
      sealType: String(formData.get('sealType') || '').trim(),
      guestCountRange: String(formData.get('guestCountRange') || '').trim(),
      generatedText: inquiryDraft.generatedText || ''
    };
  }

  function getOptionLabel(options, value) {
    const found = options.find(function (option) {
      return option.value === value;
    });
    return found ? found.label : '';
  }

  function getInquiryAnalyticsParams() {
    const values = readInquiryFormValues();
    return {
      source_button: inquirySession.sourceButton || 'unknown',
      service_type: values.serviceType || 'unknown',
      seal_type: values.sealType || 'unknown',
      guest_count_range: values.guestCountRange || 'unknown'
    };
  }

  function buildWeddingDateTime(values) {
    if (values.weddingDate && values.weddingTime) {
      return values.weddingDate + ' ' + values.weddingTime;
    }
    return values.weddingDate || values.weddingTime || '';
  }

  function buildVenueText(values) {
    if (values.venueInfo && values.hallInfo) {
      return values.venueInfo + ' / ' + values.hallInfo;
    }
    return values.venueInfo || values.hallInfo || '';
  }

  function buildInquiryMessage(values) {
    const lines = [
      '안녕하세요. 바이어스 축의대 운영 문의드립니다.',
      '',
      '아래 내용으로 이용 가능 여부 확인 부탁드립니다.',
      '',
      '[ 예약 안내 양식 ]',
      '',
      '1. 예식일 / 시간 : ' + buildWeddingDateTime(values),
      '2. 예약자 / 연락처 : ' + values.contactInfo,
      '3. 지역 / 예식장 / 홀 : ' + buildVenueText(values),
      '4. 서비스 및 담당 축의대 : ' + getOptionLabel(inquiryOptions.serviceType, values.serviceType),
      '5. 밀봉 기준 : ' + getOptionLabel(inquiryOptions.sealType, values.sealType),
      '6. 보증인원 : ' + getOptionLabel(inquiryOptions.guestCountRange, values.guestCountRange),
      '',
      '※ 예식 규모·운영 시간에 따라 서비스 가능 여부가 달라질 수 있습니다.'
    ];

    return lines.map(function (line) {
      return line.replace(/undefined|null|NaN|\[object Object\]/g, '').trimEnd();
    }).join('\n');
  }

  function syncInquiryFormFromDraft() {
    if (!inquiryElements) return;

    getInquiryFieldElements().forEach(function (field) {
      if (field.type === 'radio') {
        field.checked = inquiryDraft[field.name] === field.value;
        return;
      }
      field.value = inquiryDraft[field.name] || '';
    });

    inquiryElements.output.value = inquiryDraft.generatedText || '';
    showInquiryScreen('form');
    inquiryElements.kakaoGuard.hidden = true;
    inquiryElements.kakaoLink.classList.toggle('btn-emphasis', Boolean(inquiryDraft.copied));
    showInquiryStatus('', 'info');
  }

  function showInquiryScreen(screen) {
    if (!inquiryElements) return;
    const showResult = screen === 'result';
    inquiryElements.formScreen.hidden = showResult;
    inquiryElements.resultScreen.hidden = !showResult;
    inquiryElements.body.scrollTop = 0;
  }

  function showInquiryStatus(message, type) {
    if (!inquiryElements) return;
    inquiryElements.status.textContent = message;
    inquiryElements.status.setAttribute('data-status-type', type || 'info');
  }

  function showInquiryModal(sourceButton) {
    if (!inquiryElements) {
      buildInquiryModal();
    }

    inquirySession = createInquirySession();
    inquirySession.sourceButton = sourceButton || 'unknown';
    syncInquiryFormFromDraft();
    inquiryElements.modal.hidden = false;
    body.classList.add('modal-open');
    trackEvent(EVENT_NAMES.inquiryModalOpen, {
      source_button: inquirySession.sourceButton
    });

    window.setTimeout(function () {
      inquiryElements.dialog.focus();
    }, 20);
  }

  function closeInquiryModal(method) {
    if (!inquiryElements || inquiryElements.modal.hidden) {
      return;
    }

    inquiryElements.modal.hidden = true;
    body.classList.remove('modal-open');
    inquiryElements.kakaoGuard.hidden = true;
    trackEvent(EVENT_NAMES.inquiryModalClose, Object.assign(getInquiryAnalyticsParams(), {
      close_method: method || 'unknown'
    }));
    resetInquiryDraft();
    inquirySession = createInquirySession();
  }

  function markInquiryFormStart() {
    if (inquirySession.formStarted) {
      return;
    }

    inquirySession.formStarted = true;
    trackEvent(EVENT_NAMES.inquiryFormStart, getInquiryAnalyticsParams());
  }

  function handleInquiryFieldChange(event) {
    const field = event.target;
    if (!field.matches('[data-inquiry-field]')) {
      return;
    }

    markInquiryFormStart();

    if (field.type === 'radio') {
      updateDraftField(field.name, field.checked ? field.value : inquiryDraft[field.name] || '');
      inquiryDraft.copied = false;
      inquiryElements.kakaoLink.classList.remove('btn-emphasis');
      saveInquiryDraft(inquiryDraft);
      return;
    }

    updateDraftField(field.name, field.value);
    inquiryDraft.copied = false;
    inquiryElements.kakaoLink.classList.remove('btn-emphasis');
    saveInquiryDraft(inquiryDraft);
  }

  function handleInquiryGenerate(event) {
    event.preventDefault();
    const values = readInquiryFormValues();
    const message = buildInquiryMessage(values);

    inquiryDraft.generatedText = message;
    inquiryDraft.copied = false;
    inquirySession.textGenerated = true;
    inquirySession.copied = false;
    saveInquiryDraft(inquiryDraft);

    inquiryElements.output.value = message;
    inquiryElements.kakaoGuard.hidden = true;
    inquiryElements.kakaoLink.classList.remove('btn-emphasis');
    showInquiryStatus('문의 문구가 생성되었습니다. 내용을 확인한 뒤 복사해 주세요.', 'success');

    trackEvent(EVENT_NAMES.inquiryTextGenerate, getInquiryAnalyticsParams());
    showInquiryScreen('result');
    inquiryElements.output.focus();
  }

  function fallbackCopyText(text) {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    helper.setSelectionRange(0, helper.value.length);
    const success = document.execCommand('copy');
    document.body.removeChild(helper);
    return success;
  }

  function copyInquiryText() {
    const text = inquiryElements.output.value;
    if (!text) {
      showInquiryStatus('먼저 문의 문구를 만들어 주세요.', 'warning');
      return;
    }

    function handleCopySuccess() {
      inquiryDraft.copied = true;
      inquirySession.copied = true;
      saveInquiryDraft(inquiryDraft);
      inquiryElements.kakaoGuard.hidden = true;
      inquiryElements.kakaoLink.classList.add('btn-emphasis');
      showInquiryStatus('문구가 복사되었습니다. 카카오톡 채팅창에 붙여넣어 주세요.', 'success');
      trackEvent(EVENT_NAMES.inquiryCopyClick, getInquiryAnalyticsParams());
    }

    function handleCopyFailure() {
      showInquiryStatus('자동 복사가 어려운 환경입니다. 아래 문구를 직접 선택해 복사해주세요.', 'warning');
      inquiryElements.output.focus();
      inquiryElements.output.select();
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(handleCopySuccess).catch(function () {
        if (fallbackCopyText(text)) {
          handleCopySuccess();
          return;
        }
        handleCopyFailure();
      });
      return;
    }

    if (fallbackCopyText(text)) {
      handleCopySuccess();
      return;
    }

    handleCopyFailure();
  }

  function openKakaoChannel() {
    trackEvent(EVENT_NAMES.inquiryKakaoClick, getInquiryAnalyticsParams());
    window.open(KAKAO_CHANNEL_URL, '_blank', 'noopener');
  }

  function handleInquiryKakao(event, forceOpen) {
    event.preventDefault();
    const hasText = inquiryElements.output.value.trim() !== '';
    const copied = Boolean(inquiryDraft.copied);

    if (forceOpen) {
      openKakaoChannel();
      return;
    }

    if (!hasText || !copied) {
      inquiryElements.kakaoGuard.hidden = false;
      showInquiryStatus('문의 문구를 먼저 복사하면 카카오톡에서 바로 붙여넣을 수 있습니다.', 'info');
      return;
    }

    openKakaoChannel();
  }

  function bindInquiryModalEvents() {
    inquiryElements.form.addEventListener('submit', handleInquiryGenerate);
    inquiryElements.form.addEventListener('input', handleInquiryFieldChange);
    inquiryElements.form.addEventListener('change', handleInquiryFieldChange);
    inquiryElements.output.addEventListener('input', function () {
      inquiryDraft.generatedText = inquiryElements.output.value;
      inquiryDraft.copied = false;
      inquiryElements.kakaoLink.classList.remove('btn-emphasis');
      saveInquiryDraft(inquiryDraft);
      showInquiryStatus('문구를 수정했습니다. 다시 복사한 뒤 카카오톡으로 이동해 주세요.', 'info');
    });

    inquiryElements.modal.addEventListener('click', function (event) {
      const closeButton = event.target.closest('[data-inquiry-close]');
      if (closeButton) {
        event.preventDefault();
        closeInquiryModal(closeButton.getAttribute('data-inquiry-close'));
        return;
      }

      const copyButton = event.target.closest('[data-inquiry-copy], [data-inquiry-copy-shortcut]');
      if (copyButton) {
        event.preventDefault();
        copyInquiryText();
        return;
      }

      const editButton = event.target.closest('[data-inquiry-edit]');
      if (editButton) {
        event.preventDefault();
        showInquiryStatus('입력값은 유지된 상태입니다. 필요한 부분만 수정해 주세요.', 'info');
        showInquiryScreen('form');
        inquiryElements.dialog.focus();
        return;
      }

      const kakaoButton = event.target.closest('[data-inquiry-kakao]');
      if (kakaoButton) {
        handleInquiryKakao(event, false);
        return;
      }

      const kakaoForceButton = event.target.closest('[data-inquiry-kakao-force]');
      if (kakaoForceButton) {
        handleInquiryKakao(event, true);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && inquiryElements && !inquiryElements.modal.hidden) {
        closeInquiryModal('escape');
      }
    });
  }

  function setupInquiryTriggers() {
    if (!document.querySelector('[data-inquiry-open]')) {
      return;
    }

    buildInquiryModal();

    document.addEventListener('click', function (event) {
      const trigger = event.target.closest('[data-inquiry-open]');
      if (!trigger) return;

      event.preventDefault();
      showInquiryModal(trigger.getAttribute('data-source-button') || 'unknown');
    });
  }

  function setupSectionTracking() {
    const sections = document.querySelectorAll('[data-track-section]');
    if (!sections.length || typeof window.IntersectionObserver !== 'function') {
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
          return;
        }

        const section = entry.target;
        const sectionId = section.id || section.getAttribute('data-section-id') || '';
        if (!sectionId || seenSections.has(sectionId)) {
          return;
        }

        seenSections.add(sectionId);
        trackEvent(EVENT_NAMES.sectionView, {
          section_id: sectionId,
          section_name: section.getAttribute('data-section-name') || sectionId
        });
        observer.unobserve(section);
      });
    }, {
      threshold: [0.35]
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function setupScrollDepthTracking() {
    const thresholds = [25, 50, 75, 90];

    function handleScrollDepth() {
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const maxScrollable = scrollHeight - viewportHeight;

      if (maxScrollable <= 0) {
        return;
      }

      const percent = Math.round((window.scrollY / maxScrollable) * 100);
      thresholds.forEach(function (threshold) {
        if (percent >= threshold && !seenScrollDepths.has(threshold)) {
          seenScrollDepths.add(threshold);
          trackEvent(EVENT_NAMES.scrollDepth, {
            percent: threshold
          });
        }
      });
    }

    window.addEventListener('scroll', handleScrollDepth, { passive: true });
    window.addEventListener('resize', handleScrollDepth);
    handleScrollDepth();
  }

  setupAnalytics();
  trackPageView();

  if (navToggle && navList) {
    navToggle.addEventListener('click', function () {
      const isOpen = navList.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
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

      if (open) {
        trackEvent(EVENT_NAMES.faqOpen, {
          question_text: trigger.getAttribute('data-question') || getTextLabel(trigger),
          section_name: trigger.getAttribute('data-section') || 'faq'
        });
      }
    });

    window.addEventListener('resize', function () {
      if (trigger.getAttribute('aria-expanded') === 'true') {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  document.addEventListener('click', function (event) {
    const target = event.target.closest('a, button, [data-track="reference"], [data-track="review"], [data-track="click"]');
    if (!target) return;

    if (target.matches('[data-nav-toggle]')) {
      trackEvent('menu_toggle_click', {
        button_text: getTextLabel(target)
      });
      return;
    }

    if (target.matches('[data-inquiry-open]')) {
      return;
    }

    const explicitEvent = target.getAttribute('data-event');
    const sectionName = target.getAttribute('data-section') || getSectionName(target);
    const sectionId = getSectionId(target);
    const label = getTextLabel(target);
    const url = getSafeUrl(target);
    const href = target.getAttribute('href') || '';
    const linkType = url ? getLinkType(url) : (target.getAttribute('data-link-type') || '');

    if (target.classList.contains('nav-link')) {
      trackEvent(EVENT_NAMES.navClick, {
        menu_text: label,
        menu_href: href,
        target_section: target.getAttribute('data-target-section') || ''
      });
    }

    if (explicitEvent) {
      const params = {
        button_text: label,
        button_href: href,
        section_id: sectionId,
        section_name: sectionName,
        link_type: linkType
      };

      if (target.hasAttribute('data-item-title')) {
        params.item_title = target.getAttribute('data-item-title');
      }
      if (target.hasAttribute('data-image-src')) {
        params.image_src = target.getAttribute('data-image-src');
      }
      if (target.hasAttribute('data-action')) {
        params.action = target.getAttribute('data-action');
      }

      trackEvent(explicitEvent, params);
    }

    if (!url) {
      return;
    }

    if (linkType === 'kakao') {
      if (explicitEvent !== EVENT_NAMES.kakaoClick) {
        trackEvent(EVENT_NAMES.kakaoClick, {
          button_text: label,
          button_href: href,
          section_id: sectionId,
          section_name: sectionName,
          link_type: linkType
        });
      }
      trackEvent(EVENT_NAMES.outboundClick, {
        link_url: url.href,
        link_text: label,
        link_domain: url.hostname
      });
      return;
    }

    if (linkType === 'phone') {
      trackEvent(EVENT_NAMES.phoneClick, {
        link_text: label,
        section_name: sectionName
      });
      return;
    }

    if (linkType === 'sms') {
      trackEvent(EVENT_NAMES.smsClick, {
        link_text: label,
        section_name: sectionName
      });
      return;
    }

    if (linkType === 'email') {
      trackEvent(EVENT_NAMES.emailClick, {
        link_text: label,
        section_name: sectionName
      });
      return;
    }

    if (linkType !== 'internal') {
      trackEvent(EVENT_NAMES.outboundClick, {
        link_url: url.href,
        link_text: label,
        link_domain: url.hostname
      });
    }
  });

  setupInquiryTriggers();
  setupSectionTracking();
  setupScrollDepthTracking();
})();
