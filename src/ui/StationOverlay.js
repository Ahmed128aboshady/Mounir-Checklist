export default class StationOverlay {
  constructor() {
    this._el = null;
    this._visible = false;
  }
  
  init() {
    const el = document.createElement('div');
    el.id = 'station-overlay';
    el.innerHTML = `
      <div class="so-content">
        <div class="so-badge">محطة تعليمية</div>
        <h3 class="so-title"></h3>
        <p class="so-desc"></p>
        <a class="so-cta" href="#" target="_blank">اكتشف البرنامج</a>
        <button class="so-close">إغلاق ×</button>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      #station-overlay {
        position: fixed;
        top: 50%; right: 2rem;
        transform: translateY(-50%);
        z-index: 500;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.4s ease;
        width: min(320px, 88vw);
      }
      #station-overlay.visible {
        opacity: 1;
        pointer-events: all;
      }
      .so-content {
        background: rgba(9,13,22,0.92);
        border: 1px solid rgba(251,191,36,0.3);
        border-radius: 16px;
        padding: 1.6rem;
        backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0,0,0,0.7);
      }
      .so-badge {
        font-size: 0.78rem; font-weight: 700;
        color: #fbbf24; margin-bottom: 0.6rem;
        text-transform: uppercase; letter-spacing: 2px;
      }
      .so-title {
        font-family: 'Amiri', serif;
        font-size: 1.6rem; color: #fff;
        margin-bottom: 0.8rem;
      }
      .so-desc {
        font-size: 0.95rem; color: #94a3b8;
        line-height: 1.7; margin-bottom: 1.2rem;
      }
      .so-cta {
        display: block; text-align: center;
        padding: 0.7rem 1.4rem;
        background: linear-gradient(135deg, #fbbf24, #d97706);
        color: #0c0a09; font-weight: 800;
        border-radius: 50px; text-decoration: none;
        font-size: 0.95rem;
        transition: transform 0.2s, box-shadow 0.2s;
        margin-bottom: 0.8rem;
      }
      .so-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(251,191,36,0.4); }
      .so-close {
        background: none; border: 1px solid rgba(255,255,255,0.1);
        color: #94a3b8; font-size: 0.85rem;
        padding: 0.4rem 1rem; border-radius: 50px;
        cursor: pointer; width: 100%;
        transition: border-color 0.2s;
      }
      .so-close:hover { border-color: rgba(251,191,36,0.4); color: #fbbf24; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(el);
    
    this._el = el;
    el.querySelector('.so-close').addEventListener('click', () => this.hide());
    
    return this;
  }
  
  show(key, config) {
    if (!this._el || !config) return;
    this._el.querySelector('.so-title').textContent = config.arabicName || key;
    this._el.querySelector('.so-desc').textContent = config.description || '';
    const cta = this._el.querySelector('.so-cta');
    cta.href = config.ctaUrl || '#';
    this._el.classList.add('visible');
    this._visible = true;
  }
  
  hide() {
    if (!this._el) return;
    this._el.classList.remove('visible');
    this._visible = false;
  }
  
  isVisible() {
    return this._visible;
  }
}
