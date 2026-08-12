const QUALITY = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

class PerformanceManager {
  constructor() {
    this._level = QUALITY.HIGH;
    this._isMobile = false;
    this._fps = 60;
    this._callbacks = [];
    
    // FPS tracking
    this._frameCount = 0;
    this._lastFpsTime = 0;
  }

  /**
   * Initialize hardware detection and quality defaults
   */
  init() {
    // 1. Mobile Detection
    this._isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    // 2. Initial Quality Assessment
    if (this._isMobile) {
      this._level = QUALITY.LOW;
    } else if (window.devicePixelRatio > 2) {
      // Very high res displays might struggle, cap at MEDIUM base unless manually upgraded
      this._level = QUALITY.MEDIUM;
    } else {
      this._level = QUALITY.HIGH;
    }
    
    console.log(`[PerformanceManager] Initial Quality: ${this._level} | Mobile: ${this._isMobile}`);
    
    // 3. Start Monitoring
    this._lastFpsTime = performance.now();
    this._monitorFPS = this._monitorFPS.bind(this);
    requestAnimationFrame(this._monitorFPS);
  }

  // --- Getters ---

  getLevel() { return this._level; }
  isMobile() { return this._isMobile; }
  isLow() { return this._level === QUALITY.LOW; }
  isHigh() { return this._level === QUALITY.HIGH; }

  // --- Quality Scaling Helpers ---

  getPixelRatio() {
    switch (this._level) {
      case QUALITY.HIGH: return Math.min(window.devicePixelRatio, 1.5);
      case QUALITY.MEDIUM: return Math.min(window.devicePixelRatio, 1.25);
      case QUALITY.LOW: return 1;
      default: return 1;
    }
  }

  getParticleCount(baseCount) {
    switch (this._level) {
      case QUALITY.HIGH: return Math.floor(baseCount * 0.8);
      case QUALITY.MEDIUM: return Math.floor(baseCount * 0.5);
      case QUALITY.LOW: return Math.floor(baseCount * 0.25);
      default: return Math.floor(baseCount * 0.25);
    }
  }

  getShadowMapSize() {
    switch (this._level) {
      case QUALITY.HIGH: return 1024;
      case QUALITY.MEDIUM: return 512;
      case QUALITY.LOW: return 256;
      default: return 512;
    }
  }

  // --- Events ---

  onQualityChange(cb) {
    this._callbacks.push(cb);
  }

  // --- Internals ---

  _monitorFPS(time) {
    this._frameCount++;
    const delta = time - this._lastFpsTime;

    // Check every 2 seconds
    if (delta >= 2000) {
      this._fps = (this._frameCount * 1000) / delta;
      
      // Downgrade logic if struggling
      if (this._fps < 25 && this._level !== QUALITY.LOW) {
        this._downgradeQuality();
      }

      // Reset counters
      this._frameCount = 0;
      this._lastFpsTime = time;
    }

    requestAnimationFrame(this._monitorFPS);
  }

  _downgradeQuality() {
    const oldLevel = this._level;
    
    if (this._level === QUALITY.HIGH) {
      this._level = QUALITY.MEDIUM;
    } else if (this._level === QUALITY.MEDIUM) {
      this._level = QUALITY.LOW;
    }
    
    console.warn(`[PerformanceManager] FPS drop detected (${Math.round(this._fps)}). Downgrading quality: ${oldLevel} -> ${this._level}`);
    
    // Notify listeners
    for (const cb of this._callbacks) {
      try {
        cb(this._level);
      } catch (e) {
        console.error('[PerformanceManager] Error in quality change callback:', e);
      }
    }
  }
}

export { QUALITY };
export default new PerformanceManager();
