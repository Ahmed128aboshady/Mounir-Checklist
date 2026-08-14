/**
 * NarratorSystem.js
 * نظام السرد السينمائي — كلام يظهر مع مسير القطار
 *
 * Shows timed Arabic narration as the train travels through each section.
 * Each chapter has multiple lines that fade in/out with typewriter effect.
 */

const NARRATOR_CHAPTERS = [
  // ─── HERO ──────────────────────────────────────────────────────────────────
  {
    state: 'hero',
    lines: [
      { text: '🚉 مرحباً بك في المحطة الأولى', delay: 0.5, duration: 3.5 },
      { text: '✨ رحلتك نحو المعرفة تبدأ من هنا', delay: 4, duration: 3.5 },
      { text: '🚂 القطار على وشك الانطلاق... استعد!', delay: 8, duration: 4 },
    ],
    position: 'hero',
    style: 'hero',
  },

  // ─── DEPARTURE ─────────────────────────────────────────────────────────────
  {
    state: 'departure',
    lines: [
      { text: '🌟 انطلق القطار نحو عالم المعرفة!', delay: 0, duration: 3 },
      { text: '📚 كل رحلة تعليمية تبدأ بخطوة شجاعة', delay: 3.5, duration: 3.5 },
      { text: '💨 استنشق هواء الانطلاق... العالم ينتظرك', delay: 7, duration: 3 },
    ],
    position: 'bottom-right',
    style: 'journey',
  },

  // ─── BRIDGE ────────────────────────────────────────────────────────────────
  {
    state: 'bridge',
    lines: [
      { text: '🌉 نعبر الجسر... نحو آفاق جديدة', delay: 0, duration: 3 },
      { text: '🦅 انظر للأسفل — كم أنت عالٍ الآن!', delay: 3.5, duration: 3 },
      { text: '💡 العلم جسر بين من أنت ومن ستكون', delay: 7, duration: 4 },
    ],
    position: 'top-center',
    style: 'bridge',
  },

  // ─── TUNNEL ────────────────────────────────────────────────────────────────
  {
    state: 'tunnel_inside',
    lines: [
      { text: '🌑 الظلام مؤقت... النور قادم', delay: 0, duration: 3.5 },
      { text: '🤫 في الصمت تُولد أعظم الأفكار', delay: 4, duration: 3.5 },
      { text: '⚡ اثبت... الضوء يظهر في نهاية كل نفق', delay: 8, duration: 4 },
    ],
    position: 'center',
    style: 'tunnel',
  },

  // ─── WORLD REVEAL ──────────────────────────────────────────────────────────
  {
    state: 'world_reveal',
    lines: [
      { text: '🌍 مرحباً... عالم المعرفة بكامله أمامك!', delay: 0.5, duration: 4 },
      { text: '🏛️ خمس محطات تعليمية تنتظرك', delay: 5, duration: 3.5 },
      { text: '🎯 كل محطة ستغيّر فيك شيئاً حقيقياً', delay: 9, duration: 3.5 },
    ],
    position: 'center',
    style: 'reveal',
  },

  // ─── STATION MAP ────────────────────────────────────────────────────────────
  {
    state: 'station_map',
    lines: [
      { text: '🗺️ هذه خريطة محطاتك التعليمية', delay: 0, duration: 3.5 },
      { text: '👆 اضغط على أي محطة لتكتشفها', delay: 4, duration: 3.5 },
      { text: '⭐ كل محطة = مهارة جديدة لحياتك', delay: 8, duration: 3.5 },
    ],
    position: 'top-right',
    style: 'map',
  },

  // ─── ACHIEVEMENT ────────────────────────────────────────────────────────────
  {
    state: 'achievement',
    lines: [
      { text: '🏆 أكثر من 15,000 طالب سعيد بالفعل!', delay: 0, duration: 3.5 },
      { text: '💪 هم مثلك... بدأوا من هنا', delay: 4, duration: 3 },
      { text: '🌟 أنت التالي في قائمة النجوم', delay: 7.5, duration: 3.5 },
    ],
    position: 'bottom-center',
    style: 'achievement',
  },

  // ─── PARENT ─────────────────────────────────────────────────────────────────
  {
    state: 'parent',
    lines: [
      { text: '👨‍👩‍👧 لكل أب وأم تحبّ مستقبل ابنها', delay: 0, duration: 3.5 },
      { text: '🛡️ نحن نرعى أبناءكم كما تفعلون', delay: 4, duration: 3.5 },
      { text: '📞 تواصل معنا — نحن هنا لأجلكم', delay: 8, duration: 3.5 },
    ],
    position: 'center',
    style: 'parent',
  },
];

export default class NarratorSystem {
  constructor() {
    this._el = null;
    this._textEl = null;
    this._emojiEl = null;
    this._currentState = null;
    this._timers = [];
    this._typewriterInterval = null;
    this._isVisible = false;
    this._chapterMap = {};
    this._currentLineIndex = 0;
    this._isTyping = false;
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  init() {
    // Build lookup map
    NARRATOR_CHAPTERS.forEach(ch => {
      this._chapterMap[ch.state] = ch;
    });

    // Create DOM elements
    this._injectStyles();
    this._createElements();

    // Listen for story state changes
    window.addEventListener('story-state-change', (e) => {
      this.onStateChange(e.detail.state);
    });

    return this;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  onStateChange(newState) {
    if (this._currentState === newState) return;
    this._currentState = newState;

    // Clear any running timers
    this._clearTimers();

    const chapter = this._chapterMap[newState];
    if (!chapter) {
      this._hideNarrator();
      return;
    }

    // Apply chapter styles
    this._applyChapterStyle(chapter);

    // Schedule each line
    chapter.lines.forEach((line, index) => {
      const isLast = index === chapter.lines.length - 1;
      const showTimer = setTimeout(() => {
        this._showLine(line.text, line.duration, chapter.style, isLast);
      }, line.delay * 1000);

      this._timers.push(showTimer);
    });
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  _showLine(text, duration, style, isLast = false) {
    // Stop any running typewriter
    if (this._typewriterInterval) {
      clearInterval(this._typewriterInterval);
      this._typewriterInterval = null;
    }

    // Make visible with scale-in animation
    this._el.classList.remove('narrator-hidden', 'narrator-fadeout');
    this._el.classList.add('narrator-visible', `narrator-style-${style}`);
    this._isVisible = true;

    // Typewriter effect
    this._typeWriter(text);

    // Only auto-hide if NOT the last line (the last line stays visible for the user as the train moves)
    if (!isLast) {
      const hideTimer = setTimeout(() => {
        this._fadeOutLine(style);
      }, duration * 1000);

      this._timers.push(hideTimer);
    }
  }

  _typeWriter(text) {
    if (!this._textEl) return;

    // Extract emoji (first char if it is emoji)
    const emojiMatch = text.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
    let emoji = '';
    let content = text;

    if (emojiMatch) {
      emoji = emojiMatch[0];
      content = text.slice(emoji.length).trim();
    }

    // Show emoji immediately
    if (this._emojiEl) {
      this._emojiEl.textContent = emoji;
      this._emojiEl.style.display = emoji ? 'block' : 'none';
    }

    // Typewriter for Arabic text (right-to-left, so we build from full string)
    this._textEl.textContent = '';
    const chars = [...content]; // spread handles unicode correctly
    let i = 0;

    this._typewriterInterval = setInterval(() => {
      if (i < chars.length) {
        this._textEl.textContent += chars[i];
        i++;
      } else {
        clearInterval(this._typewriterInterval);
        this._typewriterInterval = null;
      }
    }, 45); // 45ms per character — feels natural for Arabic
  }

  _fadeOutLine(style) {
    if (!this._isVisible) return;
    this._el.classList.remove('narrator-visible');
    this._el.classList.add('narrator-fadeout');

    setTimeout(() => {
      this._el.classList.remove('narrator-fadeout', `narrator-style-${style}`);
      this._el.classList.add('narrator-hidden');
      this._isVisible = false;
      if (this._textEl) this._textEl.textContent = '';
      if (this._emojiEl) this._emojiEl.textContent = '';
    }, 600);
  }

  _hideNarrator() {
    if (this._el) {
      this._el.classList.remove('narrator-visible');
      this._el.classList.add('narrator-hidden');
    }
  }

  _clearTimers() {
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];
    if (this._typewriterInterval) {
      clearInterval(this._typewriterInterval);
      this._typewriterInterval = null;
    }
    this._isVisible = false;
  }

  _applyChapterStyle(chapter) {
    if (!this._el) return;

    // Reset position classes
    this._el.className = 'narrator-bubble narrator-hidden';

    // Position
    const posClass = {
      'hero':          'narrator-pos-hero',
      'center':        'narrator-pos-center',
      'bottom-right':  'narrator-pos-bottom-right',
      'bottom-center': 'narrator-pos-bottom-center',
      'top-center':    'narrator-pos-top-center',
      'top-right':     'narrator-pos-top-right',
    };
    const cls = posClass[chapter.position] || 'narrator-pos-center';
    this._el.classList.add(cls);
  }

  // ── DOM Creation ─────────────────────────────────────────────────────────────

  _createElements() {
    const el = document.createElement('div');
    el.className = 'narrator-bubble narrator-hidden';
    el.id = 'narrator-bubble';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', 'سرد الرحلة التعليمية');

    el.innerHTML = `
      <div class="narrator-inner">
        <div class="narrator-emoji" id="narrator-emoji"></div>
        <div class="narrator-text" id="narrator-text" dir="rtl"></div>
        <div class="narrator-cursor">|</div>
      </div>
      <div class="narrator-train-indicator">
        <div class="narrator-track-dot"></div>
        <div class="narrator-track-dot"></div>
        <div class="narrator-track-dot"></div>
      </div>
    `;

    document.body.appendChild(el);
    this._el = el;
    this._textEl = el.querySelector('#narrator-text');
    this._emojiEl = el.querySelector('#narrator-emoji');
  }

  _injectStyles() {
    const style = document.createElement('style');
    style.id = 'narrator-styles';
    style.textContent = `
      /* ─── Base Narrator Bubble ──────────────────────────────────────────── */
      .narrator-bubble {
        position: fixed;
        z-index: 800;
        pointer-events: none;
        transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        max-width: min(420px, 88vw);
        filter: drop-shadow(0 8px 30px rgba(0,0,0,0.6));
      }

      .narrator-hidden {
        opacity: 0;
        transform: translateY(14px) scale(0.95);
        pointer-events: none;
      }

      .narrator-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .narrator-fadeout {
        opacity: 0;
        transform: translateY(-10px) scale(0.97);
      }

      /* ─── Inner Content ──────────────────────────────────────────────────── */
      .narrator-inner {
        background: rgba(6, 10, 20, 0.92);
        border: 1px solid rgba(251, 191, 36, 0.45);
        border-radius: 20px;
        padding: 1.2rem 1.6rem;
        backdrop-filter: blur(20px);
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        text-align: center;
        box-shadow:
          0 0 0 1px rgba(251,191,36,0.1),
          0 20px 60px rgba(0,0,0,0.7),
          inset 0 1px 0 rgba(255,255,255,0.05);
      }

      .narrator-inner::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 20px;
        background: linear-gradient(135deg,
          rgba(251,191,36,0.06) 0%,
          transparent 60%);
        pointer-events: none;
      }

      .narrator-emoji {
        font-size: 1.8rem;
        line-height: 1;
        filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
        animation: narrator-emoji-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes narrator-emoji-pop {
        0%   { transform: scale(0) rotate(-20deg); }
        100% { transform: scale(1) rotate(0deg); }
      }

      .narrator-text {
        font-family: 'Tajawal', sans-serif;
        font-size: clamp(1rem, 2.2vw, 1.25rem);
        font-weight: 700;
        color: #f0f4ff;
        line-height: 1.6;
        direction: rtl;
        text-align: center;
        min-height: 1.6em;
        text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        letter-spacing: 0.02em;
      }

      .narrator-cursor {
        display: inline-block;
        color: #fbbf24;
        font-weight: 300;
        animation: narrator-blink 0.8s step-end infinite;
        font-size: 1.1rem;
        line-height: 1;
        height: 0;
        overflow: hidden;
        margin-top: -0.5rem;
      }

      @keyframes narrator-blink {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0; }
      }

      /* ─── Train Track Indicator (3 animated dots) ───────────────────────── */
      .narrator-train-indicator {
        display: flex;
        justify-content: center;
        gap: 5px;
        margin-top: 8px;
        padding: 0 4px;
      }

      .narrator-track-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: rgba(251,191,36,0.4);
        animation: narrator-dot-pulse 1.4s ease-in-out infinite;
      }

      .narrator-track-dot:nth-child(1) { animation-delay: 0s;    }
      .narrator-track-dot:nth-child(2) { animation-delay: 0.2s;  }
      .narrator-track-dot:nth-child(3) { animation-delay: 0.4s;  }

      @keyframes narrator-dot-pulse {
        0%, 100% { background: rgba(251,191,36,0.25); transform: scale(0.8); }
        50%       { background: rgba(251,191,36,0.9);  transform: scale(1.3); }
      }

      /* ─── Style Variants ─────────────────────────────────────────────────── */
      .narrator-style-hero .narrator-inner {
        border-color: rgba(251,191,36,0.6);
        box-shadow: 0 0 40px rgba(251,191,36,0.15), 0 20px 60px rgba(0,0,0,0.7);
      }

      .narrator-style-tunnel .narrator-inner {
        background: rgba(2, 3, 8, 0.97);
        border-color: rgba(100,100,255,0.4);
        box-shadow: 0 0 30px rgba(50,50,200,0.2), 0 20px 60px rgba(0,0,0,0.8);
      }
      .narrator-style-tunnel .narrator-text { color: #c0c8e0; }
      .narrator-style-tunnel .narrator-track-dot {
        background: rgba(100,100,255,0.5);
        animation-name: narrator-dot-blue;
      }

      @keyframes narrator-dot-blue {
        0%, 100% { background: rgba(80,80,220,0.3); }
        50%       { background: rgba(120,120,255,0.9); }
      }

      .narrator-style-reveal .narrator-inner {
        border-color: rgba(16,185,129,0.5);
        box-shadow: 0 0 40px rgba(16,185,129,0.12), 0 20px 60px rgba(0,0,0,0.7);
      }
      .narrator-style-reveal .narrator-text { color: #d1fae5; }

      .narrator-style-achievement .narrator-inner {
        border-color: rgba(251,191,36,0.7);
        background: rgba(12, 8, 2, 0.95);
        box-shadow: 0 0 50px rgba(251,191,36,0.25), 0 20px 60px rgba(0,0,0,0.8);
      }

      .narrator-style-bridge .narrator-inner {
        border-color: rgba(6,182,212,0.5);
      }
      .narrator-style-bridge .narrator-text { color: #cffafe; }

      /* ─── Position Classes ───────────────────────────────────────────────── */
      /* ─── Hero Custom Position (Left Sky) ─────────────────────────────── */
      .narrator-pos-hero {
        top: 35%;
        left: 4rem;
      }
      .narrator-pos-hero.narrator-visible {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      .narrator-pos-hero.narrator-hidden {
        transform: translateY(14px) scale(0.95);
        opacity: 0;
      }
      .narrator-pos-hero.narrator-fadeout {
        transform: translateY(-10px) scale(0.97);
        opacity: 0;
      }

      .narrator-pos-center {
        top: 75px;
        left: 50%;
        transform: translateX(-50%);
      }
      .narrator-pos-center.narrator-visible {
        transform: translateX(-50%) translateY(0) scale(1);
        opacity: 1;
      }
      .narrator-pos-center.narrator-hidden {
        transform: translateX(-50%) translateY(-14px) scale(0.95);
        opacity: 0;
      }
      .narrator-pos-center.narrator-fadeout {
        transform: translateX(-50%) translateY(-10px) scale(0.97);
        opacity: 0;
      }

      .narrator-pos-bottom-right {
        bottom: 100px;
        right: 2rem;
      }

      .narrator-pos-bottom-center {
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
      }
      .narrator-pos-bottom-center.narrator-visible {
        transform: translateX(-50%) translateY(0) scale(1);
        opacity: 1;
      }
      .narrator-pos-bottom-center.narrator-hidden {
        transform: translateX(-50%) translateY(14px) scale(0.95);
        opacity: 0;
      }

      .narrator-pos-top-center {
        top: 75px;
        left: 50%;
        transform: translateX(-50%);
      }
      .narrator-pos-top-center.narrator-visible {
        transform: translateX(-50%) translateY(0) scale(1);
        opacity: 1;
      }
      .narrator-pos-top-center.narrator-hidden {
        transform: translateX(-50%) translateY(-14px) scale(0.95);
        opacity: 0;
      }

      .narrator-pos-top-right {
        top: 15%;
        right: 2rem;
      }

      /* ─── Mobile ─────────────────────────────────────────────────────────── */
      @media (max-width: 768px) {
        .narrator-bubble {
          max-width: calc(100vw - 2rem);
        }
        .narrator-pos-bottom-right,
        .narrator-pos-top-right,
        .narrator-pos-hero {
          right: 1rem;
          left: 1rem;
          top: auto;
          bottom: 120px;
          max-width: calc(100vw - 2rem);
        }
        .narrator-text {
          font-size: 1rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
