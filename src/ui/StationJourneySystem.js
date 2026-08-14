/**
 * StationJourneySystem.js
 * نظام المحطات التفاعلية — القطار يقف عند كل محطة وتظهر التفاصيل
 *
 * Flow per station:
 *   1. Scroll reaches station → Train slows → Station sign floats in
 *   2. User clicks sign → Course detail panel slides in
 *   3. User scrolls further → Panel closes → Train moves to next station
 */

// ── Station Data ──────────────────────────────────────────────────────────────
const STATIONS = [
  {
    id: 'station-1',
    key: 'station-library',
    color: '#20c997',
    colorDark: '#129a72',
    icon: '📚',
    name: 'محطة المعرفة',
    subtitle: 'مكتبة الأنبياء والقيم',
    tagline: 'رحلة إيمانية تربوية',
    age: 'من 6 إلى 18 سنة',
    duration: '12 أسبوع',
    sessions: '36 جلسة',
    courseTitle: 'برنامج أنوار وقيم — قصص الأنبياء',
    description: 'سلسلة تربوية إيمانية تربط مواقف الأنبياء عليهم السلام بحياة أبناءك اليومية، لتزرع في قلوبهم الشجاعة والتواضع والرضا ومهارات التفكير السليم.',
    features: [
      'قصة آدم: شجاعة الاعتراف بالخطأ وتداركه',
      'قصة نوح: الثبات على الحق والوقاية من السخرية',
      'قصة إبراهيم: التفكير النقدي والتوحيد',
      'قصة يوسف: الصبر وإدارة الغيرة',
      'قصة موسى: الشجاعة والثقة بالنفس',
      'أكثر من 15 نبي بأسلوب تفاعلي',
    ],
    outcomes: ['ارتباط إيماني حقيقي', 'قيم راسخة للحياة', 'مهارة التفكير السليم'],
    ctaUrl: 'https://m.me/mouniracademy?ref=prophets_track',
    ctaText: 'احجز مكانك في رحلة الأنبياء والقيم',
  },
  {
    id: 'station-2',
    key: 'station-boys',
    color: '#3d52d5',
    colorDark: '#202e8e',
    icon: '⚡',
    name: 'محطة الشباب',
    subtitle: 'مسار البنين',
    tagline: 'بناء الهوية والشخصية',
    age: 'من 10 إلى 18 سنة',
    duration: '16 أسبوع',
    sessions: '48 جلسة',
    courseTitle: 'برنامج كتالوج الشباب',
    description: 'برنامج تربوي عميق يُصاحب الشاب في فهم التغيرات النفسية والسلوكية ويمنحه أدوات عملية للتعامل مع الشاشات وضغوط الأصدقاء وتعزيز علاقته بوالديه ودينه.',
    features: [
      'فهم تغيرات المراهقة بثقة واستقلالية',
      'بناء المناعة ضد ضغوط الأقران والشاشات',
      'تقوية العلاقة مع الوالدين',
      'تطوير مهارات اتخاذ القرار',
      'إدارة الغضب وضبط النفس',
      'شهادة إتمام معتمدة',
    ],
    outcomes: ['هوية شخصية قوية', 'علاقات أسرية أفضل', 'مناعة ضد الانحراف'],
    ctaUrl: 'https://m.me/mouniracademy?ref=boys_track',
    ctaText: 'احجز مكانك في مسار البنين (الأولاد)',
  },
  {
    id: 'station-3',
    key: 'station-girls',
    color: '#ec4899',
    colorDark: '#831843',
    icon: '🌸',
    name: 'محطة البنات',
    subtitle: 'مسار الفتيات',
    tagline: 'وعي، أمان، ثقة',
    age: 'من 10 إلى 18 سنة',
    duration: '16 أسبوع',
    sessions: '48 جلسة',
    courseTitle: 'برنامج وعي وأمان',
    description: 'مساحة آمنة تمنح الفتاة وعياً بنفسها ومشاعرها وتحميها من مقارنات التواصل الاجتماعي المؤذية وتوطد جسور الحوار الدافئ والصادق بينها وبين أمّها.',
    features: [
      'حماية الفتاة من الفلاتر والمقارنات السلبية',
      'بناء الأمان النفسي والثقة بالنفس',
      'تقوية ارتباط الفتاة بالأم',
      'فهم المشاعر وإدارتها بصحة',
      'مهارات الحوار والتعبير السليم',
      'دليل الدعم النفسي للأهل',
    ],
    outcomes: ['ثقة بالنفس حقيقية', 'أمان نفسي راسخ', 'علاقة أم وابنة أعمق'],
    ctaUrl: 'https://m.me/mouniracademy?ref=girls_track',
    ctaText: 'احجز مكانك في مسار البنات (الفتيات)',
  },
];

// ══════════════════════════════════════════════════════════════════════════════
export default class StationJourneySystem {
  constructor() {
    this._stations      = STATIONS;
    this._signEls       = {}; // stationId → sign DOM element
    this._panelEl       = null;
    this._overlayEl     = null;
    this._activeStation = null;
    this._isPanelOpen   = false;
    this._triggers      = []; // GSAP ScrollTrigger instances
    this._onTrainStop   = null; // callback(speed)
  }

  // ── Public Init ─────────────────────────────────────────────────────────────

  init(onTrainStop) {
    this._onTrainStop = onTrainStop;
    this._injectStyles();
    this._buildSigns();
    this._buildPanel();
    this._buildOverlay();
    this._setupScrollTriggers();
    return this;
  }

  // ── Build DOM ────────────────────────────────────────────────────────────────

  _buildSigns() {
    const container = document.getElementById('station-signs-layer');
    if (!container) {
      console.warn('[StationJourney] #station-signs-layer not found');
      return;
    }

    this._stations.forEach(station => {
      const sign = document.createElement('div');
      sign.className = 'sj-station-sign sj-sign-hidden';
      sign.id = `sign-${station.id}`;
      sign.setAttribute('aria-label', `محطة ${station.name} — اضغط لعرض التفاصيل`);
      sign.setAttribute('role', 'button');
      sign.setAttribute('tabindex', '0');

      sign.innerHTML = `
        <div class="sj-sign-inner" style="--station-color: ${station.color}; --station-color-dark: ${station.colorDark}">
          <div class="sj-sign-beacon"></div>
          <div class="sj-sign-text">
            <span class="sj-sign-name">${station.name}</span>
            <span class="sj-sign-sub">${station.subtitle}</span>
          </div>
          <div class="sj-sign-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
        <div class="sj-sign-tail"></div>
      `;

      sign.addEventListener('click',   () => this._openPanel(station));
      sign.addEventListener('keydown',  e => e.key === 'Enter' && this._openPanel(station));

      container.appendChild(sign);
      this._signEls[station.id] = sign;
    });
  }

  _buildPanel() {
    const panel = document.createElement('div');
    panel.id    = 'sj-course-panel';
    panel.className = 'sj-panel sj-panel-hidden';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'تفاصيل الكورس');

    panel.innerHTML = `
      <div class="sj-panel-header">
        <button class="sj-panel-close" id="sj-close-btn" aria-label="إغلاق">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div class="sj-panel-badge" id="sj-panel-badge"></div>
        <div class="sj-panel-icon" id="sj-panel-icon"></div>
        <h2 class="sj-panel-title" id="sj-panel-title"></h2>
        <p class="sj-panel-tagline" id="sj-panel-tagline"></p>

        <div class="sj-panel-meta" id="sj-panel-meta">
          <div class="sj-meta-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span id="sj-meta-age"></span>
          </div>
          <div class="sj-meta-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span id="sj-meta-duration"></span>
          </div>
          <div class="sj-meta-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>
            <span id="sj-meta-sessions"></span>
          </div>
        </div>
      </div>

      <div class="sj-panel-body">
        <p class="sj-panel-desc" id="sj-panel-desc"></p>

        <div class="sj-features-block">
          <h3 class="sj-features-title">ماذا ستتعلم؟</h3>
          <ul class="sj-features-list" id="sj-features-list"></ul>
        </div>

        <div class="sj-outcomes-block" id="sj-outcomes-block">
          <h3 class="sj-outcomes-title">النتائج المضمونة</h3>
          <div class="sj-outcomes-row" id="sj-outcomes-row"></div>
        </div>
      </div>

      <div class="sj-panel-footer">
        <a class="sj-cta-btn" id="sj-cta-btn" href="#" target="_blank">
          <span id="sj-cta-text"></span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <button class="sj-continue-btn" id="sj-continue-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          تابع الرحلة
        </button>
      </div>
    `;

    document.body.appendChild(panel);
    this._panelEl = panel;

    panel.querySelector('#sj-close-btn').addEventListener('click', () => this._closePanel());
    panel.querySelector('#sj-continue-btn').addEventListener('click', () => this._closePanel());
  }

  _buildOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'sj-overlay';
    overlay.className = 'sj-overlay sj-overlay-hidden';
    overlay.addEventListener('click', () => this._closePanel());
    document.body.appendChild(overlay);
    this._overlayEl = overlay;
  }

  // ── ScrollTrigger Setup ──────────────────────────────────────────────────────

  _setupScrollTriggers() {
    const gsap         = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) {
      console.warn('[StationJourney] GSAP/ScrollTrigger not available');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    this._stations.forEach((station, index) => {
      const sectionId = `#journey-station-${index + 1}`;
      const sectionEl = document.querySelector(sectionId);
      if (!sectionEl) return;

      // Trigger: when section enters view → show sign
      ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top 60%',
        end:   'bottom 20%',
        onEnter:      () => this._showSign(station.id),
        onLeave:      () => this._hideSign(station.id),
        onEnterBack:  () => this._showSign(station.id),
        onLeaveBack:  () => this._hideSign(station.id),
      });

      // Train speed: slow down when approaching station
      ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top 80%',
        end:   'top 10%',
        onEnter:     () => this._onTrainStop && this._onTrainStop(0.15), // slow
        onLeave:     () => this._onTrainStop && this._onTrainStop(0.8),  // speed up
        onEnterBack: () => this._onTrainStop && this._onTrainStop(0.15),
        onLeaveBack: () => this._onTrainStop && this._onTrainStop(0.8),
      });
    });
  }

  // ── Sign Animations ──────────────────────────────────────────────────────────

  _showSign(stationId) {
    // Hide all other signs so signs NEVER overlap
    Object.keys(this._signEls).forEach(id => {
      if (id !== stationId) {
        this._hideSign(id, true);
      }
    });

    const sign = this._signEls[stationId];
    if (!sign) return;
    sign.classList.remove('sj-sign-hidden');
    sign.classList.add('sj-sign-visible');
  }

  _hideSign(stationId, force = false) {
    const sign = this._signEls[stationId];
    if (!sign) return;
    if (!force && this._isPanelOpen) return;
    sign.classList.remove('sj-sign-visible');
    sign.classList.add('sj-sign-hidden');
  }

  // ── Panel ────────────────────────────────────────────────────────────────────

  _openPanel(station) {
    this._activeStation = station;
    this._isPanelOpen   = true;

    // Populate panel
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setHref = (id, href) => { const el = document.getElementById(id); if (el) el.href = href; };

    set('sj-panel-badge',    station.name);
    set('sj-panel-icon',     station.icon);
    set('sj-panel-title',    station.courseTitle);
    set('sj-panel-tagline',  station.tagline);
    set('sj-meta-age',       station.age);
    set('sj-meta-duration',  station.duration);
    set('sj-meta-sessions',  station.sessions);
    set('sj-panel-desc',     station.description);
    set('sj-cta-text',       station.ctaText);
    setHref('sj-cta-btn',    station.ctaUrl);

    // Features list
    const featList = document.getElementById('sj-features-list');
    if (featList) {
      featList.innerHTML = station.features
        .map(f => `<li class="sj-feat-item"><span class="sj-feat-check">✓</span>${f}</li>`)
        .join('');
    }

    // Outcomes
    const outRow = document.getElementById('sj-outcomes-row');
    if (outRow) {
      outRow.innerHTML = station.outcomes
        .map(o => `<div class="sj-outcome-tag">${o}</div>`)
        .join('');
    }

    // Apply station color theme
    const header = this._panelEl.querySelector('.sj-panel-header');
    if (header) {
      header.style.setProperty('--station-color', station.color);
      header.style.borderBottomColor = station.color + '40';
    }
    const badge = document.getElementById('sj-panel-badge');
    if (badge) badge.style.background = station.color + '22';

    const ctaBtn = document.getElementById('sj-cta-btn');
    if (ctaBtn) ctaBtn.style.background = `linear-gradient(135deg, ${station.color}, ${station.colorDark})`;

    // Animate in
    document.body.classList.add('sj-panel-active');
    this._panelEl.classList.remove('sj-panel-hidden');
    this._panelEl.classList.add('sj-panel-visible');
    this._overlayEl.classList.remove('sj-overlay-hidden');
    this._overlayEl.classList.add('sj-overlay-visible');

    // Pause Lenis scroll while panel is open
    window.dispatchEvent(new CustomEvent('sj-panel-open'));
    document.body.style.overflow = 'hidden';

    // Focus management
    setTimeout(() => this._panelEl.querySelector('#sj-close-btn')?.focus(), 100);
  }

  _closePanel() {
    this._isPanelOpen = false;
    document.body.classList.remove('sj-panel-active');

    this._panelEl.classList.remove('sj-panel-visible');
    this._panelEl.classList.add('sj-panel-hidden');
    this._overlayEl.classList.remove('sj-overlay-visible');
    this._overlayEl.classList.add('sj-overlay-hidden');

    document.body.style.overflow = '';
    window.dispatchEvent(new CustomEvent('sj-panel-close'));

    // Resume train
    if (this._onTrainStop) this._onTrainStop(0);
  }

  // ── Styles ───────────────────────────────────────────────────────────────────

  _injectStyles() {
    const style = document.createElement('style');
    style.id = 'sj-styles';
    style.textContent = `
      /* ── Signs Layer ───────────────────────────────────────────────────────── */
      #station-signs-layer {
        position: fixed;
        bottom: 160px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 600;
        pointer-events: none;
        width: 100%;
        display: flex;
        justify-content: center;
      }

      /* ── Station Sign ──────────────────────────────────────────────────────── */
      .sj-station-sign {
        pointer-events: all;
        cursor: pointer;
        transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .sj-sign-hidden {
        opacity: 0;
        transform: translateY(30px) scale(0.85);
        pointer-events: none;
      }

      .sj-sign-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .sj-sign-inner {
        background: rgba(6, 10, 20, 0.92);
        border: 2px solid var(--station-color, #fbbf24);
        border-radius: 50px;
        padding: 0.8rem 1.4rem 0.8rem 1rem;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        backdrop-filter: blur(20px);
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.05),
          0 20px 50px rgba(0,0,0,0.7),
          0 0 30px rgba(var(--station-color, 251,191,36), 0.2);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        position: relative;
      }

      .sj-station-sign:hover .sj-sign-inner {
        transform: scale(1.04) translateY(-2px);
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.08),
          0 25px 60px rgba(0,0,0,0.8),
          0 0 40px color-mix(in srgb, var(--station-color, #fbbf24) 30%, transparent);
      }

      .sj-sign-beacon {
        position: absolute;
        top: -6px;
        right: 50%;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--station-color, #fbbf24);
        box-shadow: 0 0 12px var(--station-color, #fbbf24);
        animation: sj-beacon-pulse 1.8s ease-in-out infinite;
      }

      @keyframes sj-beacon-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50%       { transform: scale(1.5); opacity: 0.6; }
      }

      .sj-sign-icon {
        font-size: 1.6rem;
        line-height: 1;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
      }

      .sj-sign-text {
        display: flex;
        flex-direction: column;
        text-align: right;
      }

      .sj-sign-name {
        font-family: 'Tajawal', sans-serif;
        font-size: 1.15rem;
        font-weight: 800;
        color: #fff;
        line-height: 1.2;
      }

      .sj-sign-sub {
        font-size: 0.78rem;
        color: var(--station-color, #fbbf24);
        font-weight: 600;
        line-height: 1.3;
        white-space: nowrap;
      }

      .sj-sign-arrow {
        color: var(--station-color, #fbbf24);
        opacity: 0.8;
        transition: transform 0.2s ease;
      }

      .sj-station-sign:hover .sj-sign-arrow {
        transform: translateX(4px);
      }

      .sj-sign-tail {
        width: 2px;
        height: 20px;
        background: linear-gradient(to bottom, var(--station-color, #fbbf24), transparent);
        margin: 0 auto;
        opacity: 0.6;
      }

      /* ── Active Panel Body State (hides signs & progress bar) ──────────────── */
      body.sj-panel-active #station-signs-layer { opacity: 0; pointer-events: none; }
      body.sj-panel-active #journey-progress { opacity: 0 !important; pointer-events: none !important; }

      /* ── Overlay ───────────────────────────────────────────────────────────── */
      .sj-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1500;
        backdrop-filter: blur(6px);
        transition: opacity 0.35s ease;
      }

      .sj-overlay-hidden  { opacity: 0; pointer-events: none; }
      .sj-overlay-visible { opacity: 1; pointer-events: all; }

      /* ── Course Panel ──────────────────────────────────────────────────────── */
      .sj-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: min(460px, 100vw);
        height: 100vh;
        z-index: 1600;
        display: flex;
        flex-direction: column;
        background: #080d1a;
        border-left: 1px solid rgba(255,255,255,0.08);
        box-shadow: -20px 0 80px rgba(0,0,0,0.7);
        transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }

      .sj-panel-hidden  { transform: translateX(100%); }
      .sj-panel-visible { transform: translateX(0); }

      /* Panel Header */
      .sj-panel-header {
        padding: 1.8rem 1.8rem 1.4rem;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        position: relative;
        flex-shrink: 0;
        background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%);
      }

      .sj-panel-close {
        position: absolute;
        top: 1.2rem;
        left: 1.2rem;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 50%;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.2s;
      }

      .sj-panel-close:hover {
        background: rgba(255,255,255,0.12);
        color: #fff;
        transform: rotate(90deg);
      }

      .sj-panel-badge {
        display: inline-block;
        padding: 0.3rem 1rem;
        border-radius: 50px;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--station-color, #fbbf24);
        border: 1px solid currentColor;
        margin-bottom: 0.8rem;
        opacity: 0.9;
        letter-spacing: 1px;
      }

      .sj-panel-icon {
        font-size: 2.8rem;
        line-height: 1;
        margin-bottom: 0.6rem;
        filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
      }

      .sj-panel-title {
        font-family: 'Amiri', serif;
        font-size: 1.5rem;
        color: #fff;
        margin-bottom: 0.4rem;
        line-height: 1.35;
        direction: rtl;
      }

      .sj-panel-tagline {
        font-size: 0.9rem;
        color: var(--station-color, #fbbf24);
        font-weight: 600;
        direction: rtl;
        margin-bottom: 1rem;
      }

      .sj-panel-meta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        direction: rtl;
      }

      .sj-meta-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.82rem;
        color: #94a3b8;
        font-weight: 600;
      }

      .sj-meta-item svg { color: var(--station-color, #fbbf24); flex-shrink: 0; }

      /* Panel Body */
      .sj-panel-body {
        flex: 1;
        overflow-y: auto;
        padding: 1.6rem 1.8rem;
        direction: rtl;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.1) transparent;
      }

      .sj-panel-body::-webkit-scrollbar { width: 4px; }
      .sj-panel-body::-webkit-scrollbar-track { background: transparent; }
      .sj-panel-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

      .sj-panel-desc {
        font-size: 0.98rem;
        color: #94a3b8;
        line-height: 1.9;
        margin-bottom: 1.8rem;
      }

      .sj-features-block { margin-bottom: 1.8rem; }

      .sj-features-title,
      .sj-outcomes-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: #e2e8f0;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 1rem;
        opacity: 0.7;
      }

      .sj-features-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }

      .sj-feat-item {
        display: flex;
        align-items: flex-start;
        gap: 0.7rem;
        font-size: 0.95rem;
        color: #cbd5e1;
        line-height: 1.55;
      }

      .sj-feat-check {
        color: var(--station-color, #fbbf24);
        font-weight: 800;
        font-size: 1rem;
        flex-shrink: 0;
        margin-top: 0.05rem;
      }

      .sj-outcomes-block { margin-bottom: 0.5rem; }

      .sj-outcomes-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      }

      .sj-outcome-tag {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 50px;
        padding: 0.4rem 1rem;
        font-size: 0.82rem;
        color: #e2e8f0;
        font-weight: 600;
      }

      /* Panel Footer */
      .sj-panel-footer {
        padding: 1.2rem 1.8rem 1.8rem;
        border-top: 1px solid rgba(255,255,255,0.06);
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        flex-shrink: 0;
      }

      .sj-cta-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        padding: 1rem 1.5rem;
        border-radius: 50px;
        color: #0c0a09;
        font-family: 'Tajawal', sans-serif;
        font-size: 1rem;
        font-weight: 900;
        text-decoration: none;
        transition: transform 0.2s, box-shadow 0.2s;
        direction: rtl;
      }

      .sj-cta-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      }

      .sj-cta-btn svg { transform: rotate(180deg); }

      .sj-continue-btn {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 50px;
        color: #64748b;
        font-family: 'Tajawal', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        padding: 0.7rem 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s;
        direction: rtl;
      }

      .sj-continue-btn:hover {
        border-color: rgba(255,255,255,0.2);
        color: #94a3b8;
      }

      /* ── Mobile ───────────────────────────────────────────────────────────── */
      @media (max-width: 768px) {
        #station-signs-layer {
          bottom: 95px;
        }

        .sj-panel {
          width: 100vw;
          top: auto;
          bottom: 0;
          height: 85vh;
          border-left: none;
          border-top: 1px solid rgba(255,255,255,0.15);
          border-radius: 24px 24px 0 0;
        }

        .sj-panel-hidden  { transform: translateY(100%); }
        .sj-panel-visible { transform: translateY(0); }

        .sj-sign-inner {
          padding: 0.65rem 1rem 0.65rem 0.8rem;
          gap: 0.5rem;
          max-width: 88vw;
        }
        .sj-sign-name { font-size: 0.95rem; }
        .sj-sign-sub  { font-size: 0.72rem; }

        .sj-panel-footer {
          padding: 1rem 1.2rem 1.6rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
