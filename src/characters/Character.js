import * as THREE from 'three';

export default class Character {
  constructor(key, type) {
    // key: 'boy-01', 'boy-02', 'girl-hijab-01', 'girl-hijab-02'
    // type: 'boy' or 'girl'
    this.key = key;
    this.type = type;
    this._group = new THREE.Group();
    this._mesh = null;
    this._mixer = null;
    this._actions = {}; // animName -> AnimationAction
    this._currentAnim = 'idle';
    this._loaded = false;
    this._bobOffset = Math.random() * Math.PI * 2; // random phase for idle bob
  }

  async load(assetManager) {
    try {
      const url = `./public/assets/models/${this.key}.glb`;
      const asset = await assetManager.loadGLTF(
        this.key,
        url,
        () => assetManager.createCharacterPlaceholder(this.type, this.key)
      );

      this._mesh = asset.object.clone ? asset.object.clone() : asset.object;

      // If real GLB has animations, set up AnimationMixer
      if (asset.gltf && asset.gltf.animations && asset.gltf.animations.length > 0) {
        this._mixer = new THREE.AnimationMixer(this._mesh);
        asset.gltf.animations.forEach(clip => {
          const action = this._mixer.clipAction(clip);
          this._actions[clip.name] = action;
        });
        // Map common names
        const animNames = asset.gltf.animations.map(a => a.name);
        this._setupAnimationAliases(animNames);
      }

      this._mesh.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this._group.add(this._mesh);
      this._loaded = true;
    } catch (error) {
      console.error(`Failed to load character ${this.key}:`, error);
    }
    return this;
  }

  _setupAnimationAliases(names) {
    // Try to find animations by common naming patterns
    const findAlias = (patterns) => {
      for (const pattern of patterns) {
        const match = names.find(n => n.toLowerCase().includes(pattern));
        if (match) return match;
      }
      return null;
    };

    const idleMatch = findAlias(['idle']);
    if (idleMatch && !this._actions['idle']) {
      this._actions['idle'] = this._actions[idleMatch];
    }

    const walkMatch = findAlias(['walk', 'run']);
    if (walkMatch && !this._actions['walk']) {
      this._actions['walk'] = this._actions[walkMatch];
    }

    const celebrateMatch = findAlias(['celebrate', 'cheer', 'joy', 'win']);
    if (celebrateMatch && !this._actions['celebrate']) {
      this._actions['celebrate'] = this._actions[celebrateMatch];
    }
  }

  play(animName) {
    this._currentAnim = animName;
    if (!this._mixer) return; // placeholder - use procedural

    // Stop all, play requested
    Object.values(this._actions).forEach(a => a.fadeOut(0.3));
    const action = this._actions[animName];
    if (action) {
      action.reset().fadeIn(0.3).play();
    }
  }

  setPosition(x, y, z) { this._group.position.set(x, y, z); }
  setRotation(y) { this._group.rotation.y = y; }
  setScale(s) { this._group.scale.setScalar(s); }
  setVisible(v) { this._group.visible = v; }
  getGroup() { return this._group; }

  update(delta, time) {
    // Update AnimationMixer if exists
    if (this._mixer) this._mixer.update(delta);

    // Procedural idle animation (always applied, adds life even with real GLB)
    if (this._mesh && this._currentAnim === 'idle') {
      this._mesh.position.y = Math.sin(time * 1.5 + this._bobOffset) * 0.03;
      this._mesh.rotation.y = Math.sin(time * 0.5 + this._bobOffset) * 0.04;
    }

    if (this._mesh && this._currentAnim === 'wave') {
      this._mesh.position.y = Math.sin(time * 2 + this._bobOffset) * 0.05;
    }

    if (this._mesh && this._currentAnim === 'celebrate') {
      this._mesh.position.y = Math.abs(Math.sin(time * 4)) * 0.1;
      this._mesh.rotation.y = time * 2;
    }
  }
}
