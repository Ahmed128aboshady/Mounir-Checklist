import * as THREE from 'three';

class SceneManager {
  constructor() {
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this._animId = null;
    this._callbacks = [];
    this._resizeCbs = [];
    this._lastTime = 0;
    
    // Bind internal methods
    this._loop = this._loop.bind(this);
    this._onResize = this._onResize.bind(this);
  }

  /**
   * Initialize Three.js fundamentals
   */
  init(canvas) {
    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.012);

    // 2. Camera Setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 1, 0);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: window.devicePixelRatio < 2,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setClearColor(0x0a0a1a, 0);
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // 4. Events
    window.addEventListener('resize', this._onResize);
    this._lastTime = performance.now();
  }

  /**
   * Add object to scene
   */
  add(object) {
    if (this.scene) this.scene.add(object);
  }

  /**
   * Remove object from scene
   */
  remove(object) {
    if (this.scene) this.scene.remove(object);
  }

  // --- Getters & Setters ---

  getScene() {
    return this.scene;
  }

  getRenderer() {
    return this.renderer;
  }

  getCamera() {
    return this.camera;
  }

  setCamera(cam) {
    this.camera = cam;
  }

  // --- Render Loop ---

  startLoop(updateFn) {
    if (updateFn) this.onUpdate(updateFn);
    
    this._lastTime = performance.now();
    this._animId = requestAnimationFrame(this._loop);
  }

  stopLoop() {
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
  }

  _loop(time) {
    this._animId = requestAnimationFrame(this._loop);
    
    const delta = this._getDelta(time);

    // Run custom update callbacks
    for (const cb of this._callbacks) {
      cb(delta, time);
    }

    // Render frame
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  _getDelta(currentTime) {
    const delta = (currentTime - this._lastTime) / 1000;
    this._lastTime = currentTime;
    return Math.min(delta, 0.1); // Cap delta to prevent large jumps
  }

  // --- Events ---

  onUpdate(cb) {
    this._callbacks.push(cb);
  }

  onResize(cb) {
    this._resizeCbs.push(cb);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }

    if (this.renderer) {
      this.renderer.setSize(w, h);
    }

    // Notify listeners
    for (const cb of this._resizeCbs) {
      cb(w, h);
    }
  }
}

export default new SceneManager();
