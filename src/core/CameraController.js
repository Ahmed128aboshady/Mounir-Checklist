import * as THREE from 'three';

export const CAMERA_STATES = {
  HERO: 'HERO',
  TRAIN_TRACKING: 'TRAIN_TRACKING',
  BRIDGE: 'BRIDGE',
  TUNNEL_APPROACH: 'TUNNEL_APPROACH',
  TUNNEL_INSIDE: 'TUNNEL_INSIDE',
  WORLD_REVEAL: 'WORLD_REVEAL',
  STATION_MAP: 'STATION_MAP',
  STATION_FOCUS: 'STATION_FOCUS',
  ACHIEVEMENT: 'ACHIEVEMENT',
  PARENT: 'PARENT',
  FINAL: 'FINAL'
};

class CameraController {
  constructor(camera) {
    this.camera = camera;
    this._state = CAMERA_STATES.HERO;
    
    // Core interpolation vectors
    this._targetPos = new THREE.Vector3();
    this._targetLookAt = new THREE.Vector3();
    this._currentLookAt = new THREE.Vector3();
    
    this._trainRef = null;
    this._lerpFactor = 0.05;
    
    // Define base configs per state
    this._configs = {
      [CAMERA_STATES.HERO]: { pos: new THREE.Vector3(0, 4, 10), look: new THREE.Vector3(0, 1, -2), fov: 60 },
      [CAMERA_STATES.TRAIN_TRACKING]: { offset: new THREE.Vector3(5, 4, 8), fov: 55 }, // Relative to train
      [CAMERA_STATES.BRIDGE]: { offset: new THREE.Vector3(8, 8, -20), fov: 50 }, // Relative to train
      [CAMERA_STATES.TUNNEL_APPROACH]: { offset: new THREE.Vector3(0, 5, 5), fov: 65 }, // Relative to train
      [CAMERA_STATES.TUNNEL_INSIDE]: { offset: new THREE.Vector3(0, 2, 3), lookOffset: new THREE.Vector3(0, 2, -10), fov: 70 },
      [CAMERA_STATES.WORLD_REVEAL]: { offset: new THREE.Vector3(-5, 8, 5), look: new THREE.Vector3(0, 0, -20), fov: 55 },
      [CAMERA_STATES.STATION_MAP]: { pos: new THREE.Vector3(0, 25, 10), look: new THREE.Vector3(0, 0, -50), fov: 70 },
      [CAMERA_STATES.ACHIEVEMENT]: { offset: new THREE.Vector3(4, 3.5, 9), lookOffset: new THREE.Vector3(0, 1, 0), fov: 55 },
      [CAMERA_STATES.PARENT]: { offset: new THREE.Vector3(-3, 3, 8), lookOffset: new THREE.Vector3(0, 1, 0), fov: 50 },
      [CAMERA_STATES.FINAL]: { offset: new THREE.Vector3(0, 4.5, 14), lookOffset: new THREE.Vector3(0, 3.5, -5), fov: 52 }
    };
    
    // Initialize current vectors
    this._targetPos.copy(this._configs.HERO.pos);
    this._targetLookAt.copy(this._configs.HERO.look);
    this._currentLookAt.copy(this._configs.HERO.look);
  }

  /**
   * Set reference to the train object for relative camera positioning
   */
  setTrainRef(trainGroup) {
    this._trainRef = trainGroup;
  }

  /**
   * Set camera state immediately or update target vectors dynamically
   */
  setState(stateName, opts = {}) {
    const gsap = window.gsap;
    this._state = stateName;
    const conf = this._configs[stateName];
    
    if (!conf && stateName !== CAMERA_STATES.STATION_FOCUS) return;

    // Handle dynamic state (Station Focus)
    if (stateName === CAMERA_STATES.STATION_FOCUS) {
      if (opts.position) this._targetPos.copy(opts.position);
      if (opts.lookAt) this._targetLookAt.copy(opts.lookAt);
      if (opts.fov && gsap) {
        gsap.to(this.camera, { fov: opts.fov, duration: 1, onUpdate: () => this.camera.updateProjectionMatrix() });
      }
      return;
    }

    // Static position or initial relative setup
    if (conf.pos) this._targetPos.copy(conf.pos);
    if (conf.look) this._targetLookAt.copy(conf.look);
    
    // Update FOV smoothly
    if (conf.fov && gsap) {
      gsap.to(this.camera, { fov: conf.fov, duration: 1.5, ease: "power2.inOut", onUpdate: () => this.camera.updateProjectionMatrix() });
    }
  }

  /**
   * Smoothly transition to a custom state over duration
   */
  transitionTo(stateName, position, lookAt, duration = 1.5) {
    const gsap = window.gsap;
    this._state = stateName;
    
    if (gsap) {
      gsap.to(this._targetPos, { x: position.x, y: position.y, z: position.z, duration, ease: "power2.inOut" });
      gsap.to(this._targetLookAt, { x: lookAt.x, y: lookAt.y, z: lookAt.z, duration, ease: "power2.inOut" });
    } else {
      this._targetPos.copy(position);
      this._targetLookAt.copy(lookAt);
    }
  }

  /**
   * Main update loop for camera logic
   */
  update(delta, time) {
    // 1. Calculate train-relative positions dynamically if needed
    if (this._trainRef) {
      const conf = this._configs[this._state];
      if (conf && conf.offset) {
        this._targetPos.copy(this._getTrainRelativePos(conf.offset));
        
        // Dynamic lookAt for train-following cameras
        if (conf.lookOffset) {
           this._targetLookAt.copy(this._getTrainRelativePos(conf.lookOffset));
        } else if (!conf.look) {
           this._targetLookAt.copy(this._trainRef.position);
        }
      }
    }

    // 2. Smooth Lerp positioning
    this.camera.position.lerp(this._targetPos, this._lerpFactor);
    this._currentLookAt.lerp(this._targetLookAt, this._lerpFactor);
    
    // 3. Apply lookAt
    this.camera.lookAt(this._currentLookAt);

    // 4. Subtle cinematic breathing motion
    const breathY = Math.sin(time * 0.001) * 0.05;
    const breathX = Math.cos(time * 0.0008) * 0.03;
    
    this.camera.position.y += breathY;
    this.camera.position.x += breathX;
  }

  getCurrentState() {
    return this._state;
  }

  _getTrainRelativePos(offset) {
    if (!this._trainRef) return offset;
    return this._trainRef.position.clone().add(offset);
  }
}

export default CameraController;
