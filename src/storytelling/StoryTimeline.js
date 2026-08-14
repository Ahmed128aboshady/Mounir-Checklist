export default class StoryTimeline {
  constructor() {
    this._progress = 0;
    this._systems = {}; // will hold all managers
    this._scrollCallbacks = [];
    this._lenis = null;
  }
  
  init(systems) {
    // systems: { trainController, trainPath, cameraController,
    //            characterManager, stationManager, environmentManager,
    //            parallaxEnv, storyState, journeyProgress, stationOverlay }
    this._systems = systems;
    this._lenis = systems.lenis;
    
    this._setupScrollTrigger();
    this._setupStateHandlers();
    
    return this;
  }
  
  _setupScrollTrigger() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) {
      console.warn('[StoryTimeline] GSAP/ScrollTrigger not available');
      return;
    }
    
    gsap.registerPlugin(ScrollTrigger);
    
    // Master scroll trigger — train path progress strictly maps 1-to-1 from 0 to 1
    ScrollTrigger.create({
      trigger: '#scroll-content',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        this._progress = self.progress;
        this._onScroll(self.progress);
      }
    });
  }
  
  _onScroll(progress) {
    const { trainController, trainPath, cameraController,
            environmentManager,
            parallaxEnv, storyState, journeyProgress } = this._systems;
    
    // Update story state
    if (storyState) storyState.notifyProgress(progress);
    const state = storyState ? storyState.get() : 'hero';
    
    // Update train position along path directly proportional to page scroll (0.0 -> 1.0)
    if (trainController && trainPath) {
      trainController.setProgress(progress);
      
      // Set train speed based on scroll movement state
      const isMoving = progress > 0.02 && progress < 0.98;
      trainController.setSpeed(isMoving ? 1 : 0);
    }
    
    // Update camera based on state
    if (cameraController) {
      this._updateCamera(cameraController, state, progress);
    }
    
    // Update environment preset (Day -> Night -> Morning Sunrise)
    if (environmentManager) {
      const envMap = {
        hero: 'day', departure: 'day', bridge: 'day',
        tunnel_approach: 'night', tunnel_inside: 'night',
        world_reveal: 'morning', station_map: 'morning',
        station_focus: 'morning', achievement: 'morning',
        parent: 'morning', final: 'morning'
      };
      environmentManager.setScene(envMap[state] || 'day');
    }
    

    // Update journey progress UI
    if (journeyProgress) {
      journeyProgress.update(progress, state);
    }
    
    // Notify callbacks
    this._scrollCallbacks.forEach(cb => cb(progress, state));
  }
  
  _scrollToTrainT(scrollProgress) {
    // Hero (0-0.10): train stays at station
    if (scrollProgress < 0.10) return 0;
    // Journey (0.10-0.70): train travels full path
    // After 0.70: train stays at end (arrival)
    const journeyProgress = Math.min(scrollProgress, 0.70);
    return (journeyProgress - 0.10) / 0.60;
  }
  
  _updateCamera(cameraController, state, progress) {
    const stateMap = {
      hero: 'HERO',
      departure: 'TRAIN_TRACKING',
      bridge: 'BRIDGE',
      tunnel_approach: 'TUNNEL_APPROACH',
      tunnel_inside: 'TUNNEL_INSIDE',
      world_reveal: 'WORLD_REVEAL',
      station_map: 'STATION_MAP',
      station_focus: 'STATION_MAP',
      achievement: 'ACHIEVEMENT',
      parent: 'PARENT',
      final: 'FINAL',
    };
    cameraController.setState(stateMap[state] || 'HERO');
  }
  

  _setupStateHandlers() {
    // Called when state changes
    if (this._systems.storyState) {
      this._systems.storyState.onChange((newState, prevState) => {
        this._onStateChange(newState, prevState);
      });
    }
  }
  
  _onStateChange(newState, prevState) {
    console.log(`[Story] ${prevState} → ${newState}`);
    
    // Show/hide HTML sections
    const sectionMap = {
      departure: '#departure-overlay',
      bridge: '#bridge-overlay',
      tunnel_inside: '#tunnel-overlay',
      world_reveal: '#world-reveal-overlay',
      station_map: '#station-map-overlay',
      achievement: '#achievement-overlay',
      parent: '#parent-overlay',
    };
    
    // Hide previous overlay
    const prevSelector = sectionMap[prevState];
    if (prevSelector) {
      const el = document.querySelector(prevSelector);
      if (el && window.gsap) window.gsap.to(el, { opacity: 0, duration: 0.5 });
    }
    
    // Show new overlay
    const newSelector = sectionMap[newState];
    if (newSelector) {
      const el = document.querySelector(newSelector);
      if (el && window.gsap) {
        window.gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.3 });
      }
    }
    
    // Dispatch event for HTML to listen
    window.dispatchEvent(new CustomEvent('story-state-change', { detail: { state: newState, prev: prevState } }));
  }
  
  onScroll(cb) {
    this._scrollCallbacks.push(cb);
  }
  
  getProgress() {
    return this._progress;
  }
}
