import * as THREE from 'three';

export default class SteamSystem {
  constructor(options = {}) {
    this._count = options.count || 80;
    this._intensity = 0; // 0-1
    this._active = false;
    this._group = new THREE.Group();
    this._particles = null;
    this._velocities = [];
    this._lifetimes = [];
    this._maxLifetime = 2.0;
    this._emitPos = new THREE.Vector3();
    this._windDir = new THREE.Vector3(0.5, 1, 0.3).normalize();
    
    this._init();
  }
  
  _init() {
    try {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(this._count * 3);
      const colors = new Float32Array(this._count * 3);
      const sizes = new Float32Array(this._count);
      
      for (let i = 0; i < this._count; i++) {
        // Initialize all particles at origin
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        
        // Gray-white color variation
        const c = 0.8 + Math.random() * 0.2;
        colors[i * 3] = c;
        colors[i * 3 + 1] = c;
        colors[i * 3 + 2] = c;
        
        // Size variation
        sizes[i] = 0.1 + Math.random() * 0.3;
        
        // Initial random upward velocity
        this._velocities.push(new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          1 + Math.random() * 0.5,
          (Math.random() - 0.5) * 0.5
        ));
        
        this._lifetimes.push(Math.random() * this._maxLifetime);
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      const material = new THREE.PointsMaterial({
        size: 0.3,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6,
        color: 0xcccccc,
        depthWrite: false,
        vertexColors: true
      });
      
      this._particles = new THREE.Points(geometry, material);
      this._group.add(this._particles);
    } catch (err) {
      console.warn("Failed to initialize SteamSystem", err);
    }
  }
  
  setEmitPosition(vec3) {
    this._emitPos.copy(vec3);
  }
  
  setIntensity(v) {
    this._intensity = THREE.MathUtils.clamp(v, 0, 1);
    this._active = this._intensity > 0.01;
  }
  
  setWindDirection(vec3) {
    this._windDir.copy(vec3).normalize();
  }
  
  getGroup() {
    return this._group;
  }
  
  addToScene(scene) {
    if (scene && this._group) {
      scene.add(this._group);
    }
  }
  
  update(delta) {
    if (!this._active || !this._particles) return;
    
    try {
      const positions = this._particles.geometry.attributes.position.array;
      const colors = this._particles.geometry.attributes.color.array;
      
      for (let i = 0; i < this._count; i++) {
        this._lifetimes[i] += delta;
        
        const maxLifeForParticle = this._maxLifetime * (this._intensity > 0 ? (1 / Math.max(0.1, this._intensity)) : 1);
        
        if (this._lifetimes[i] > maxLifeForParticle) {
          // Reset particle to emission point
          this._lifetimes[i] = 0;
          positions[i * 3] = this._emitPos.x + (Math.random() - 0.5) * 0.2;
          positions[i * 3 + 1] = this._emitPos.y;
          positions[i * 3 + 2] = this._emitPos.z + (Math.random() - 0.5) * 0.2;
          
          this._velocities[i].set(
            (Math.random() - 0.5) * 0.5,
            1 + Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
          );
        } else {
          // Move particle
          const vel = this._velocities[i];
          positions[i * 3] += (vel.x + this._windDir.x * 0.5) * delta;
          positions[i * 3 + 1] += (vel.y + this._windDir.y * 0.5) * delta;
          positions[i * 3 + 2] += (vel.z + this._windDir.z * 0.5) * delta;
        }
        
        // Fade out
        const lifeRatio = this._lifetimes[i] / maxLifeForParticle;
        const colorFactor = Math.max(0, 1.0 - lifeRatio);
        
        colors[i * 3] = colorFactor * 0.8;
        colors[i * 3 + 1] = colorFactor * 0.8;
        colors[i * 3 + 2] = colorFactor * 0.8;
      }
      
      this._particles.geometry.attributes.position.needsUpdate = true;
      this._particles.geometry.attributes.color.needsUpdate = true;
      
      // Subtle pulse based on time
      const time = performance.now() * 0.001;
      this._particles.material.size = 0.3 + Math.sin(time * 2) * 0.05;
      this._particles.material.opacity = 0.6 * this._intensity;
    } catch (err) {
      console.warn("Error updating SteamSystem", err);
    }
  }
}
