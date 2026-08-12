export default class JourneyProgress {
  constructor() {
    this._el = null;
    this._trackEl = null;
    this._trainEl = null;
    this._stationEls = [];
  }
  
  init() {
    // Create the DOM element
    const el = document.createElement('div');
    el.id = 'journey-progress';
    el.innerHTML = `
      <div class="jp-track">
        <div class="jp-train">🚂</div>
        <div class="jp-line"></div>
        <div class="jp-stations">
          <div class="jp-station" data-name="hero" title="المحطة الأولى"></div>
          <div class="jp-station" data-name="departure" title="الانطلاق"></div>
          <div class="jp-station" data-name="bridge" title="الجسر"></div>
          <div class="jp-station" data-name="tunnel_inside" title="النفق"></div>
          <div class="jp-station" data-name="world_reveal" title="عالم المعرفة"></div>
          <div class="jp-station" data-name="station_map" title="خريطة المحطات"></div>
          <div class="jp-station" data-name="achievement" title="الإنجازات"></div>
          <div class="jp-station" data-name="final" title="المحطة الأخيرة"></div>
        </div>
      </div>
    `;
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      #journey-progress {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        width: min(340px, 90vw);
        pointer-events: none;
      }
      .jp-track {
        position: relative;
        height: 48px;
        display: flex;
        align-items: center;
      }
      .jp-line {
        position: absolute;
        left: 0; right: 0; top: 50%;
        height: 2px;
        background: rgba(251,191,36,0.3);
        transform: translateY(-50%);
      }
      .jp-train {
        position: absolute;
        font-size: 20px;
        left: 0;
        transition: left 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        filter: drop-shadow(0 0 6px rgba(251,191,36,0.8));
        z-index: 2;
      }
      .jp-stations {
        position: absolute;
        left: 0; right: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .jp-station {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: rgba(251,191,36,0.3);
        border: 1px solid rgba(251,191,36,0.5);
        transition: all 0.3s ease;
        position: relative;
        z-index: 1;
      }
      .jp-station.active {
        background: #fbbf24;
        box-shadow: 0 0 8px rgba(251,191,36,0.8);
        transform: scale(1.4);
      }
      .jp-station.passed {
        background: rgba(251,191,36,0.6);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(el);
    
    this._el = el;
    this._trainEl = el.querySelector('.jp-train');
    this._stationEls = Array.from(el.querySelectorAll('.jp-station'));
    
    return this;
  }
  
  update(progress, stateName) {
    if (!this._trainEl) return;
    
    // Move train emoji along track
    const pct = Math.max(0, Math.min(1, progress)) * 100;
    this._trainEl.style.left = `calc(${pct}% - 12px)`;
    
    // Update station dots
    const stateOrder = ['hero','departure','bridge','tunnel_inside','world_reveal','station_map','achievement','final'];
    const currentIdx = stateOrder.indexOf(stateName);
    
    this._stationEls.forEach((el, i) => {
      el.classList.remove('active', 'passed');
      if (i === currentIdx) el.classList.add('active');
      else if (i < currentIdx) el.classList.add('passed');
    });
  }
}
