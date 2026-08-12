export const STATES = {
  HERO: 'hero',
  DEPARTURE: 'departure',
  BRIDGE: 'bridge',
  TUNNEL_APPROACH: 'tunnel_approach',
  TUNNEL_INSIDE: 'tunnel_inside',
  WORLD_REVEAL: 'world_reveal',
  STATION_MAP: 'station_map',
  STATION_FOCUS: 'station_focus',
  ACHIEVEMENT: 'achievement',
  PARENT: 'parent',
  FINAL: 'final',
};

// Maps scroll progress (0-1) to state name
export const SCROLL_STATE_MAP = [
  { from: 0.00, to: 0.10, state: STATES.HERO },
  { from: 0.10, to: 0.24, state: STATES.DEPARTURE },
  { from: 0.24, to: 0.37, state: STATES.BRIDGE },
  { from: 0.37, to: 0.44, state: STATES.TUNNEL_APPROACH },
  { from: 0.44, to: 0.54, state: STATES.TUNNEL_INSIDE },
  { from: 0.54, to: 0.62, state: STATES.WORLD_REVEAL },
  { from: 0.62, to: 0.72, state: STATES.STATION_MAP },
  { from: 0.72, to: 0.83, state: STATES.STATION_FOCUS },
  { from: 0.83, to: 0.90, state: STATES.ACHIEVEMENT },
  { from: 0.90, to: 0.96, state: STATES.PARENT },
  { from: 0.96, to: 1.00, state: STATES.FINAL },
];

class StoryState {
  constructor() {
    this._current = STATES.HERO;
    this._callbacks = [];
    this._progressCallbacks = [];
  }
  
  set(stateName) {
    if (this._current === stateName) return;
    const prev = this._current;
    this._current = stateName;
    this._callbacks.forEach(cb => cb(stateName, prev));
  }
  
  get() {
    return this._current;
  }
  
  onChange(cb) {
    this._callbacks.push(cb);
  }
  
  onProgress(cb) {
    this._progressCallbacks.push(cb);
  }
  
  notifyProgress(progress) {
    this._progressCallbacks.forEach(cb => cb(progress, this._current));
    // Determine state from progress
    const entry = SCROLL_STATE_MAP.find(e => progress >= e.from && progress < e.to)
      || SCROLL_STATE_MAP[SCROLL_STATE_MAP.length - 1];
    this.set(entry.state);
  }
  
  getProgressInState(totalProgress) {
    const entry = SCROLL_STATE_MAP.find(e => totalProgress >= e.from && totalProgress < e.to);
    if (!entry) return 1;
    return (totalProgress - entry.from) / (entry.to - entry.from); // 0-1 within state
  }
}

export default new StoryState();
