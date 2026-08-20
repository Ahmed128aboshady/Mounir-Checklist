import * as THREE from 'three';

const gsap = window.gsap;

export default class TrainController {
  constructor(assetManager) {
    this._assetManager = assetManager;
    this._group = new THREE.Group();  // main container
    this._trainMesh = null;
    this._steam = null;
    this._headlight = null;
    this._headlightSrc = null; // PointLight
    this._wheels = [];
    this._progress = 0;
    this._speed = 0; // current visual speed
    this._targetSpeed = 0;
    this._isMoving = false;
    this._path = null;  // set via init
  }
    
  async init(path) {
    this._path = path;
    
    try {
      // Load the real Kenney locomotive GLB
      const trainAsset = await this._assetManager.loadGLTF(
        'train',
        './public/assets/models/train.glb',
        () => this._assetManager.createTrainPlaceholder()
      );
      
      this._trainMesh = trainAsset.object.clone
        ? trainAsset.object.clone()
        : (trainAsset.object || new THREE.Group());

      // ─── Auto-scale & orient the Kenney model ─────────────────────
      // Kenney models are small (1 unit long), scale up to ~6 units
      const bbox = new THREE.Box3().setFromObject(this._trainMesh);
      const size = bbox.getSize(new THREE.Vector3());
      const longestAxis = Math.max(size.x, size.y, size.z);
      const targetSize = 6; // desired length in world units
      const scaleFactor = longestAxis > 0 ? targetSize / longestAxis : 1;
      this._trainMesh.scale.setScalar(scaleFactor);

      // Re-compute bbox after scaling
      bbox.setFromObject(this._trainMesh);
      const center = bbox.getCenter(new THREE.Vector3());
      // Center horizontally, sit on ground (y=0)
      this._trainMesh.position.set(-center.x, -bbox.min.y, -center.z);

      // Enable shadows on all meshes
      this._trainMesh.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Kenney wheels are named 'Wheel', 'wheel', etc.
          const n = child.name.toLowerCase();
          if (n.includes('wheel') || n.includes('axle') || n.includes('tyre')) {
            this._wheels.push(child);
          }
          if (n.includes('headlight') || n.includes('light_front')) {
            this._headlight = child;
          }
        }
      });

      // Headlight point light
      this._headlightSrc = new THREE.PointLight(0xfff4cc, 3, 20);
      this._headlightSrc.castShadow = false;
      this._group.add(this._headlightSrc);

      // Setup steam
      try {
        const SteamSystemModule = await import('./SteamSystem.js');
        const SteamSystem = SteamSystemModule.default;
        this._steam = new SteamSystem({ count: 80 });
        this._group.add(this._steam.getGroup());
      } catch (err) {
        console.warn('[TrainController] SteamSystem load failed:', err);
      }

      this._group.add(this._trainMesh);
      this.setProgress(0);
      
      console.log('[TrainController] ✓ Kenney locomotive loaded, scale:', scaleFactor.toFixed(2));
      
    } catch (err) {
      console.warn('[TrainController] init error:', err);
    }
    
    return this;
  }
  
  setProgress(t) {
    this._progress = THREE.MathUtils.clamp(t, 0, 1);
    if (!this._path) return;
    
    try {
      const pos = this._path.getPointAt(this._progress);
      const tangent = this._path.getTangentAt(this._progress);
      
      this._group.position.copy(pos);
      
      // ─── Pure horizontal Y-axis rotation (100% upright & flat on tracks) ───
      // Train engine head & headlight lead forward in direction of travel.
      // rotation.x = 0, rotation.z = 0 -> Train NEVER rolls sideways or turns upside down.
      const angle = Math.atan2(tangent.x, tangent.z);
      this._group.rotation.set(0, angle, 0);
      
      // Update steam emitter — chimney is at (0, 3.25, 1.8) in local train space
      const chimneyLocal = new THREE.Vector3(0, 3.25, 1.8);
      if (this._steam) {
        this._steam.setEmitPosition(chimneyLocal);
      }
      
      // Headlight PointLight — front engine head at +Z local
      if (this._headlightSrc) {
        this._headlightSrc.position.set(0, 1.6, 3.2);
      }
    } catch (err) {
      console.warn('[TrainController] setProgress error:', err);
    }
  }
  
  setSpeed(v) {
    this._targetSpeed = v;
    this._isMoving = v > 0.01;
    if (this._steam) {
      this._steam.setIntensity(Math.min(v, 1));
    }
  }
  
  start() {
    this.setSpeed(1);
  }
  
  stop() {
    this.setSpeed(0);
  }
  
  playSteam() {
    if (this._steam) {
      this._steam.setIntensity(1);
    }
  }
  
  getGroup() {
    return this._group;
  }
  
  getChimneyWorldPosition() {
    const v = new THREE.Vector3(-2, 3.5, 0);
    return v.applyMatrix4(this._group.matrixWorld);
  }
  
  setHeadlightIntensity(v) {
    if (this._headlightSrc) {
      this._headlightSrc.intensity = v;
    }
  }
  
  update(delta, time) {
    try {
      // Smooth speed towards target
      this._speed += (this._targetSpeed - this._speed) * Math.min(delta * 3, 1);
      
      // Rotate wheels — they roll on X axis (axle along X, rolling forward along Z)
      this._wheels.forEach(w => {
        w.rotation.x += this._speed * delta * 8;
      });
      
      // Subtle train sway while moving
      if (this._trainMesh) {
        if (this._isMoving) {
          this._trainMesh.rotation.z = Math.sin(time * 4) * 0.004 * this._speed;
          this._trainMesh.position.y = Math.sin(time * 7) * 0.015 * this._speed;
        } else {
          this._trainMesh.rotation.z *= 0.9;
          this._trainMesh.position.y *= 0.9;
        }
      }
      
      // Update steam
      if (this._steam) this._steam.update(delta);
      
      // Headlight flicker
      if (this._headlightSrc) {
        this._headlightSrc.intensity = 2 + Math.sin(time * 15) * 0.08 * this._speed;
      }
    } catch (err) {
      console.warn('[TrainController] update error:', err);
    }
  }
}
