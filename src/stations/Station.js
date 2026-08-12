import * as THREE from 'three';

export default class Station {
  constructor(key, config) {
    // config: { arabicName, color (hex number), position (Vector3), description, ctaUrl }
    this.key = key;
    this.config = config;
    this._group = new THREE.Group();
    this._isHovered = false;
    this._isFocused = false;
    this._mesh = null;
    this._glowMesh = null;
    this._pulsePhase = Math.random() * Math.PI * 2;
    this._interactBox = null; // used for raycasting
  }

  async init(assetManager) {
    try {
      // Try to load station GLB
      const url = `./public/assets/models/${this.key}.glb`;
      const asset = await assetManager.loadGLTF(
        this.key,
        url,
        () => assetManager.createStationPlaceholder(this.key)
      );
      this._mesh = asset.object.clone ? asset.object.clone() : asset.object;

      // Create invisible interaction box (larger than mesh, for raycasting)
      const boxGeo = new THREE.BoxGeometry(5, 6, 5);
      const boxMat = new THREE.MeshBasicMaterial({ visible: false });
      this._interactBox = new THREE.Mesh(boxGeo, boxMat);
      this._interactBox.name = `interact-${this.key}`;
      this._interactBox.userData.stationKey = this.key;

      this._group.add(this._mesh);
      this._group.add(this._interactBox);
      
      if (this.config.position) {
        this._group.position.copy(this.config.position);
      }

      // Add ambient glow
      const glowGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: this.config.color || 0xffffff,
        transparent: true,
        opacity: 0.15,
        depthWrite: false
      });
      this._glowMesh = new THREE.Mesh(glowGeo, glowMat);
      this._glowMesh.position.y = 4;
      this._group.add(this._glowMesh);
    } catch (error) {
      console.error(`Error initializing station ${this.key}:`, error);
    }
    
    return this;
  }

  setHover(v) {
    this._isHovered = v;
    const scale = v ? 1.08 : 1.0;
    if (window.gsap) {
      window.gsap.to(this._group.scale, { x: scale, y: scale, z: scale, duration: 0.3, ease: 'power2.out' });
    } else {
      this._group.scale.setScalar(scale);
    }
  }

  setFocus(v) {
    this._isFocused = v;
    // If focused, increase glow intensity dramatically
    if (this._glowMesh) {
      const opacity = v ? 0.5 : 0.15;
      if (window.gsap) {
        window.gsap.to(this._glowMesh.material, { opacity, duration: 0.5 });
      } else {
        this._glowMesh.material.opacity = opacity;
      }
    }
  }

  getInteractMesh() { return this._interactBox; }
  getGroup() { return this._group; }
  setVisible(v) { this._group.visible = v; }
  getConfig() { return this.config; }

  update(delta, time) {
    // Pulse glow
    if (this._glowMesh) {
      const pulse = Math.sin(time * 2 + this._pulsePhase) * 0.05;
      this._glowMesh.material.opacity = (this._isFocused ? 0.5 : 0.15) + pulse;
      this._glowMesh.scale.setScalar(1 + pulse * 0.5);
    }

    // Float up and down
    if (this._mesh) {
      this._mesh.position.y = Math.sin(time * 1.2 + this._pulsePhase) * 0.1;
    }
  }
}
