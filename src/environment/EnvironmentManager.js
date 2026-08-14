import * as THREE from 'three';

const ENVIRONMENT_PRESETS = {
  day: {
    fogColor: 0x06140d, fogDensity: 0.008,
    ambientColor: 0xffffff, ambientIntensity: 0.8,
    sunColor: 0xffedd5, sunIntensity: 1.3,
    groundColor: 0x0f2b1d
  },
  night: {
    fogColor: 0x06140d, fogDensity: 0.008,
    ambientColor: 0xffffff, ambientIntensity: 0.8,
    sunColor: 0xffedd5, sunIntensity: 1.3,
    groundColor: 0x0f2b1d
  },
  morning: {
    fogColor: 0x06140d, fogDensity: 0.008,
    ambientColor: 0xffffff, ambientIntensity: 0.8,
    sunColor: 0xffedd5, sunIntensity: 1.3,
    groundColor: 0x0f2b1d
  }
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
    
    // Ambient light (natural outdoor illumination)
    this._ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(this._ambientLight);
    
    // Sun directional light
    this._sunLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    this._sunLight.position.set(20, 40, 10);
    this._sunLight.castShadow = true;
    this._sunLight.shadow.mapSize.setScalar(performanceManager ? performanceManager.getShadowMapSize() : 1024);
    this._sunLight.shadow.camera.far = 200;
    this._sunLight.shadow.camera.left = -50;
    this._sunLight.shadow.camera.right = 50;
    this._sunLight.shadow.camera.top = 50;
    this._sunLight.shadow.camera.bottom = -50;
    scene.add(this._sunLight);
    
    // Ground plane (deep dark tree green)
    const groundGeo = new THREE.PlaneGeometry(200, 500);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f2b1d,
      roughness: 1.0,
      metalness: 0.0
    });
    this._ground = new THREE.Mesh(groundGeo, groundMat);
    this._ground.rotation.x = -Math.PI / 2;
    this._ground.position.set(0, -0.15, -80);
    this._ground.receiveShadow = true;
    scene.add(this._ground);
    
    // Star field
    this._createStars(scene, performanceManager);

    // 3D Stylized Nature (Trees, Pines, Flower Bushes & Rocks from MegaKit)
    this._createStylizedNature(scene, assetManager);

    // 3D Academy Terminal Building ("أكاديمية منير")
    this._createAcademyBuilding(scene, assetManager);

    return this;
  }

  async _createStylizedNature(scene, assetManager) {
    if (!assetManager) return;

    try {
      // Load modular stylized nature assets
      const [treeRes, pineRes, bushRes, rockRes] = await Promise.all([
        assetManager.loadGLTF('nature_tree', './public/assets/models/nature/tree.glb', () => null),
        assetManager.loadGLTF('nature_pine', './public/assets/models/nature/pine.glb', () => null),
        assetManager.loadGLTF('nature_bush', './public/assets/models/nature/bush.glb', () => null),
        assetManager.loadGLTF('nature_rock', './public/assets/models/nature/rock.glb', () => null)
      ]);

      const treeMesh = treeRes && treeRes.object;
      const pineMesh = pineRes && pineRes.object;
      const bushMesh = bushRes && bushRes.object;
      const rockMesh = rockRes && rockRes.object;

      const group = new THREE.Group();

      // Enable shadows for meshes
      [treeMesh, pineMesh, bushMesh, rockMesh].forEach(mesh => {
        if (mesh) {
          mesh.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
        }
      });

      // Scatter tree, pine, bush, and rock props alongside the train track
      const propsList = [
        // Left side trees and bushes
        { mesh: treeMesh, pos: [-18, 0, -20], scale: 1.2, rot: 0.5 },
        { mesh: bushMesh, pos: [-12, 0, -32], scale: 1.5, rot: 1.2 },
        { mesh: pineMesh, pos: [-22, 0, -50], scale: 1.1, rot: 0.2 },
        { mesh: rockMesh, pos: [-14, 0, -68], scale: 1.4, rot: 0.8 },
        { mesh: treeMesh, pos: [-20, 0, -85], scale: 1.3, rot: 1.5 },
        { mesh: bushMesh, pos: [-16, 0, -105], scale: 1.6, rot: 0.3 },
        { mesh: pineMesh, pos: [-24, 0, -125], scale: 1.2, rot: 2.1 },
        { mesh: treeMesh, pos: [-18, 0, -145], scale: 1.4, rot: 0.7 },

        // Right side trees and bushes
        { mesh: pineMesh, pos: [20, 0, -15], scale: 1.2, rot: 1.1 },
        { mesh: rockMesh, pos: [14, 0, -30], scale: 1.3, rot: 0.4 },
        { mesh: treeMesh, pos: [22, 0, -45], scale: 1.3, rot: 2.0 },
        { mesh: bushMesh, pos: [15, 0, -62], scale: 1.5, rot: 0.9 },
        { mesh: pineMesh, pos: [25, 0, -80], scale: 1.1, rot: 1.7 },
        { mesh: treeMesh, pos: [18, 0, -100], scale: 1.2, rot: 0.6 },
        { mesh: rockMesh, pos: [22, 0, -120], scale: 1.4, rot: 1.3 },
        { mesh: bushMesh, pos: [16, 0, -140], scale: 1.6, rot: 2.4 },
      ];

      propsList.forEach(item => {
        if (item.mesh) {
          const clone = item.mesh.clone();
          clone.scale.setScalar(item.scale);
          clone.position.set(...item.pos);
          clone.rotation.y = item.rot;
          group.add(clone);
        }
      });

      scene.add(group);
    } catch (err) {
      console.warn('[EnvironmentManager] Error loading stylized nature assets:', err);
    }
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
    
    // Sleek dark panel with glowing brand teal border
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#20c997';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 492, 108);
    
    ctx.font = '900 52px Tajawal, Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#20c997';
    ctx.shadowBlur = 15;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('أكاديمية منير', 256, 64);

    const signTex = new THREE.CanvasTexture(canvas);
    const signGeo = new THREE.PlaneGeometry(10, 2.5);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 5.5, 3.8);
    group.add(sign);

    // Warm Ambient Light from Building Signboard
    const light = new THREE.PointLight(0x20c997, 5, 25);
    light.position.set(0, 5.5, 5);
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
  

  
  setScene(presetName) {
    const preset = ENVIRONMENT_PRESETS[presetName] || ENVIRONMENT_PRESETS.day;
    if (this._currentPreset === presetName) return;
    this._currentPreset = presetName;
    
    const gsap = window.gsap;
    if (gsap) {
      if (this._scene && this._scene.fog) {
        gsap.to(this._scene.fog.color, {
          r: ((preset.fogColor >> 16) & 255) / 255,
          g: ((preset.fogColor >> 8) & 255) / 255,
          b: (preset.fogColor & 255) / 255,
          duration: 1.8
        });
        gsap.to(this._scene.fog, { density: preset.fogDensity, duration: 1.8 });
      }

      if (this._ambientLight) {
        gsap.to(this._ambientLight.color, {
          r: ((preset.ambientColor >> 16) & 255) / 255,
          g: ((preset.ambientColor >> 8) & 255) / 255,
          b: (preset.ambientColor & 255) / 255,
          duration: 1.8
        });
        gsap.to(this._ambientLight, { intensity: preset.ambientIntensity, duration: 1.8 });
      }

      if (this._sunLight) {
        gsap.to(this._sunLight.color, {
          r: ((preset.sunColor >> 16) & 255) / 255,
          g: ((preset.sunColor >> 8) & 255) / 255,
          b: (preset.sunColor & 255) / 255,
          duration: 1.8
        });
        gsap.to(this._sunLight, { intensity: preset.sunIntensity, duration: 1.8 });
      }

      if (this._ground && this._ground.material) {
        gsap.to(this._ground.material.color, {
          r: ((preset.groundColor >> 16) & 255) / 255,
          g: ((preset.groundColor >> 8) & 255) / 255,
          b: (preset.groundColor & 255) / 255,
          duration: 1.8
        });
      }
    } else {
      if (this._scene && this._scene.fog) {
        this._scene.fog.color.setHex(preset.fogColor);
        this._scene.fog.density = preset.fogDensity;
      }
      if (this._ambientLight) {
        this._ambientLight.color.setHex(preset.ambientColor);
        this._ambientLight.intensity = preset.ambientIntensity;
      }
      if (this._sunLight) {
        this._sunLight.color.setHex(preset.sunColor);
        this._sunLight.intensity = preset.sunIntensity;
      }
      if (this._ground && this._ground.material) {
        this._ground.material.color.setHex(preset.groundColor);
      }
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
