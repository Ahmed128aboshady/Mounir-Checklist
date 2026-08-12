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
    
    // Master scroll trigger — train rides the full scroll-content
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

    // Final section: ensure train is fully at end (t=1)
    const finalEl = document.getElementById('final-section');
    if (finalEl) {
      const trainProxy = { t: 0 };
      ScrollTrigger.create({
        trigger: finalEl,
        start: 'top 80%',
        onEnter: () => {
          const tc = this._systems.trainController;
          if (!tc) return;
          // Tween train to end position smoothly
          gsap.to(trainProxy, {
            t: 1,
            duration: 1.6,
            ease: 'power2.out',
            onUpdate: () => tc.setProgress(trainProxy.t),
          });
        },
      });
    }
  }
  
  _onScroll(progress) {
    const { trainController, trainPath, cameraController,
            environmentManager,
            parallaxEnv, storyState, journeyProgress } = this._systems;
    
    // Update story state
    if (storyState) storyState.notifyProgress(progress);
    const state = storyState ? storyState.get() : 'hero';
    
    // Update train position along path
    if (trainController && trainPath) {
      // Map scroll progress to train path progress
      // (they're roughly the same but train stays at station during hero)
      const trainT = this._scrollToTrainT(progress);
      trainController.setProgress(trainT);
      
      // Set train speed based on state
      const speedMap = {
        hero: 0, departure: 1, bridge: 0.8, tunnel_approach: 0.6,
        tunnel_inside: 0.4, world_reveal: 0.3, station_map: 0,
        station_focus: 0, achievement: 0, parent: 0, final: 0
      };
      trainController.setSpeed(speedMap[state] || 0);
    }
    
    // Update camera based on state
    if (cameraController) {
      this._updateCamera(cameraController, state, progress);
    }
    
    // Update environment
    if (environmentManager) {
      const envMap = {
        hero: 'hero', departure: 'departure', bridge: 'bridge',
        tunnel_approach: 'tunnel', tunnel_inside: 'tunnel',
        world_reveal: 'world', station_map: 'world',
        station_focus: 'world', achievement: 'achievement',
        parent: 'achievement', final: 'achievement'
      };
      environmentManager.setScene(envMap[state] || 'hero');
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
