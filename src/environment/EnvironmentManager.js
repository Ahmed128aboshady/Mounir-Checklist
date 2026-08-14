import * as THREE from 'three';

const ENVIRONMENT_PRESETS = {
  hero: {
    fogColor: 0x0a0a1a, fogDensity: 0.012,
    ambientColor: 0x1a1a3a, ambientIntensity: 0.6,
    sunColor: 0xffd080, sunIntensity: 1.5,
    skyTop: '#0a0a1a', skyBottom: '#1a0a2e'
  },
  departure: {
    fogColor: 0x0d0d1f, fogDensity: 0.010,
    ambientColor: 0x1a1a3a, ambientIntensity: 0.5,
    sunColor: 0xff8844, sunIntensity: 1.2,
    skyTop: '#0d0d1f', skyBottom: '#2a1a00'
  },
  bridge: {
    fogColor: 0x0a1220, fogDensity: 0.008,
    ambientColor: 0x152030, ambientIntensity: 0.7,
    sunColor: 0xffa060, sunIntensity: 1.8,
    skyTop: '#0a1220', skyBottom: '#1a2a40'
  },
  tunnel: {
    fogColor: 0x050508, fogDensity: 0.04,
    ambientColor: 0x080808, ambientIntensity: 0.1,
    sunColor: 0x442200, sunIntensity: 0.1,
    skyTop: '#050508', skyBottom: '#080508'
  },
  world: {
    fogColor: 0x0a1525, fogDensity: 0.006,
    ambientColor: 0x1a2a3a, ambientIntensity: 0.8,
    sunColor: 0xffe0a0, sunIntensity: 2.0,
    skyTop: '#0a1525', skyBottom: '#1a3040'
  },
  achievement: {
    fogColor: 0x0a1030, fogDensity: 0.005,
    ambientColor: 0x2a1a0a, ambientIntensity: 1.0,
    sunColor: 0xffd060, sunIntensity: 2.5,
    skyTop: '#0a1030', skyBottom: '#2a1a00'
  },
};

export default class EnvironmentManager {
  constructor() {
    this._scene = null;
    this._ambientLight = null;
    this._sunLight = null;
    this._ground = null;
    this._stars = null;
    this._mountains = [];
    this._currentPreset = 'hero';
  }
  
  async init(scene, performanceManager, assetManager) {
    this._scene = scene;
    this._perf = performanceManager;
    
    // Ambient light
    this._ambientLight = new THREE.AmbientLight(0x1a1a3a, 0.6);
    scene.add(this._ambientLight);
    
    // Sun directional light
    this._sunLight = new THREE.DirectionalLight(0xffd080, 1.5);
    this._sunLight.position.set(20, 40, 10);
    this._sunLight.castShadow = true;
    this._sunLight.shadow.mapSize.setScalar(performanceManager ? performanceManager.getShadowMapSize() : 1024);
    this._sunLight.shadow.camera.far = 200;
    this._sunLight.shadow.camera.left = -50;
    this._sunLight.shadow.camera.right = 50;
    this._sunLight.shadow.camera.top = 50;
    this._sunLight.shadow.camera.bottom = -50;
    scene.add(this._sunLight);
    
    // Ground plane (very long)
    const groundGeo = new THREE.PlaneGeometry(200, 500);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0d1117,
      roughness: 0.9,
      metalness: 0.1
    });
    this._ground = new THREE.Mesh(groundGeo, groundMat);
    this._ground.rotation.x = -Math.PI / 2;
    this._ground.position.set(0, -0.15, -80);
    this._ground.receiveShadow = true;
    scene.add(this._ground);
    
    // Star field
    this._createStars(scene, performanceManager);
    
    // Background mountains
    this._createMountains(scene);

    // Final Academy Terminal Building (Loaded from building.glb)
    await this._createAcademyBuilding(scene, assetManager);
    
    return this;
  }

  async _createAcademyBuilding(scene, assetManager) {
    const group = new THREE.Group();

    if (assetManager) {
      try {
        const bldgAsset = await assetManager.loadGLTF(
          'building',
          './public/assets/models/building.glb',
          () => null
        );
        if (bldgAsset && bldgAsset.object) {
          const bldgMesh = bldgAsset.object.clone ? bldgAsset.object.clone() : bldgAsset.object;
          bldgMesh.scale.setScalar(2.2);
          bldgMesh.position.set(0, 0, 0);
          bldgMesh.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          group.add(bldgMesh);
        } else {
          this._createFallbackBuildingMesh(group);
        }
      } catch (err) {
        console.warn('[EnvironmentManager] Fallback building due to load error:', err);
        this._createFallbackBuildingMesh(group);
      }
    } else {
      this._createFallbackBuildingMesh(group);
    }

    // Glowing Signboard with "أكاديمية منير"
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#20c997';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 112);
    ctx.font = '900 48px Tajawal, Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('أكاديمية منير', 256, 64);

    const signTex = new THREE.CanvasTexture(canvas);
    const signGeo = new THREE.PlaneGeometry(9, 2.25);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 9.5, 4.2);
    group.add(sign);

    // Warm Ambient Light from Building
    const light = new THREE.PointLight(0x20c997, 4, 25);
    light.position.set(0, 7, 6);
    group.add(light);

    // Position building right behind final station stop
    group.position.set(0, 0, -172);
    scene.add(group);
  }

  _createFallbackBuildingMesh(group) {
    // Main station building body
    const bodyGeo = new THREE.BoxGeometry(16, 9, 10);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.6,
      metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 4.5, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Roof structure (glowing cyan accent)
    const roofGeo = new THREE.ConeGeometry(12, 4.5, 4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x20c997,
      roughness: 0.4,
      metalness: 0.2
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 11.25, 0);
    group.add(roof);
  }
  
  _createStars(scene, perf) {
    const count = perf ? perf.getParticleCount(2000) : 800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i*3]   = (Math.random() - 0.5) * 400;
      positions[i*3+1] = Math.random() * 100 + 20;
      positions[i*3+2] = (Math.random() - 0.5) * 400 - 80;
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i*3] = brightness;
      colors[i*3+1] = brightness * 0.9;
      colors[i*3+2] = brightness * 0.8;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const mat = new THREE.PointsMaterial({
      size: 0.3, sizeAttenuation: true,
      vertexColors: true, transparent: true,
      opacity: 0.8, depthWrite: false
    });
    
    this._stars = new THREE.Points(geo, mat);
    scene.add(this._stars);
  }
  
  _createMountains(scene) {
    // Create several mountain silhouettes using ConeGeometry
    const mountainConfigs = [
      {pos: [-50, 0, -80], scale: [15, 25, 12]},
      {pos: [-35, 0, -100], scale: [12, 20, 10]},
      {pos: [50, 0, -80], scale: [18, 22, 14]},
      {pos: [40, 0, -110], scale: [10, 18, 10]},
      {pos: [-10, 0, -170], scale: [20, 35, 16]},
      {pos: [10, 0, -170], scale: [15, 28, 12]},
    ];
    
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 1 });
    
    mountainConfigs.forEach(cfg => {
      const geo = new THREE.ConeGeometry(1, 1, 7);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...cfg.pos);
      mesh.scale.set(...cfg.scale);
      mesh.castShadow = false;
      scene.add(mesh);
      this._mountains.push(mesh);
    });
  }
  
  setScene(presetName) {
    const preset = ENVIRONMENT_PRESETS[presetName] || ENVIRONMENT_PRESETS.hero;
    this._currentPreset = presetName;
    
    if (window.gsap) {
      window.gsap.to(this._scene.fog, { density: preset.fogDensity, duration: 2 });
      window.gsap.to(this._ambientLight, { intensity: preset.ambientIntensity, duration: 2 });
      window.gsap.to(this._sunLight, { intensity: preset.sunIntensity, duration: 2 });
    } else {
      this._scene.fog.density = preset.fogDensity;
    }
  }
  
  setFogDensity(v) {
    if (this._scene.fog) this._scene.fog.density = v;
  }
  
  update(delta, time) {
    // Subtle star twinkle
    if (this._stars) {
      this._stars.rotation.y = time * 0.00005;
    }
  }
}
