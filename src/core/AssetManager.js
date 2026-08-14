import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

class AssetManager {
  constructor() {
    this._cache = new Map();
    this._loading = new Map();
    this._totalAssets = 0;
    this._loadedAssets = 0;

    // Initialize loaders
    this._textureLoader = new THREE.TextureLoader();
    this._gltfLoader = new GLTFLoader();
    
    // Setup DRACO loader for compressed geometry
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.167.1/examples/jsm/libs/draco/');
    this._gltfLoader.setDRACOLoader(dracoLoader);
  }

  /**
   * Load an OBJ model with optional MTL materials
   */
  async loadOBJ(key, objUrl, mtlUrl = null, fallbackFn = null) {
    if (this._cache.has(key)) return this._cache.get(key);
    if (this._loading.has(key)) return this._loading.get(key);

    const loadPromise = new Promise((resolve) => {
      const objLoader = new OBJLoader();

      if (mtlUrl) {
        const mtlLoader = new MTLLoader();
        mtlLoader.load(
          mtlUrl,
          (materials) => {
            materials.preload();
            objLoader.setMaterials(materials);
            objLoader.load(
              objUrl,
              (obj) => {
                this._loadedAssets++;
                const result = { type: 'obj', object: obj };
                this._cache.set(key, result);
                resolve(result);
              },
              undefined,
              (error) => {
                console.error(`[AssetManager] Error loading OBJ ${key}:`, error);
                const fallbackObj = fallbackFn ? fallbackFn() : this._createDefaultFallback(key);
                const result = { type: 'obj', object: fallbackObj };
                this._cache.set(key, result);
                resolve(result);
              }
            );
          },
          undefined,
          (error) => {
            console.warn(`[AssetManager] Could not load MTL for ${key}, loading raw OBJ:`, error);
            objLoader.load(
              objUrl,
              (obj) => {
                this._loadedAssets++;
                const result = { type: 'obj', object: obj };
                this._cache.set(key, result);
                resolve(result);
              },
              undefined,
              () => {
                const fallbackObj = fallbackFn ? fallbackFn() : this._createDefaultFallback(key);
                const result = { type: 'obj', object: fallbackObj };
                this._cache.set(key, result);
                resolve(result);
              }
            );
          }
        );
      } else {
        objLoader.load(
          objUrl,
          (obj) => {
            this._loadedAssets++;
            const result = { type: 'obj', object: obj };
            this._cache.set(key, result);
            resolve(result);
          },
          undefined,
          () => {
            const fallbackObj = fallbackFn ? fallbackFn() : this._createDefaultFallback(key);
            const result = { type: 'obj', object: fallbackObj };
            this._cache.set(key, result);
            resolve(result);
          }
        );
      }
    });

    this._loading.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * Load a GLTF/GLB file with optional fallback
   */
  async loadGLTF(key, url, fallbackFn = null) {
    if (this._cache.has(key)) return this._cache.get(key);
    if (this._loading.has(key)) return this._loading.get(key);

    const loadPromise = new Promise((resolve) => {
      this._gltfLoader.load(
        url,
        (gltf) => {
          this._loadedAssets++;
          const result = { type: 'gltf', object: gltf.scene, gltf };
          this._cache.set(key, result);
          resolve(result);
        },
        undefined, // Progress callback not used per asset
        (error) => {
          console.error(`[AssetManager] Error loading GLTF ${key} from ${url}:`, error);
          // Fallback handling
          this._loadedAssets++;
          const fallbackObj = fallbackFn ? fallbackFn() : this._createDefaultFallback(key);
          const result = { type: 'gltf', object: fallbackObj, gltf: { scene: fallbackObj } };
          this._cache.set(key, result);
          resolve(result);
        }
      );
    });

    this._loading.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * Load a texture with a solid color fallback
   */
  async loadTexture(key, url, fallbackColor = '#0a0a1a') {
    if (this._cache.has(key)) return this._cache.get(key);
    if (this._loading.has(key)) return this._loading.get(key);

    const loadPromise = new Promise((resolve) => {
      this._textureLoader.load(
        url,
        (texture) => {
          this._loadedAssets++;
          const result = { type: 'texture', object: texture };
          this._cache.set(key, result);
          resolve(result);
        },
        undefined,
        (error) => {
          console.error(`[AssetManager] Error loading texture ${key} from ${url}:`, error);
          this._loadedAssets++;
          
          // Create 4x4 canvas fallback
          const canvas = document.createElement('canvas');
          canvas.width = 4;
          canvas.height = 4;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = fallbackColor;
            ctx.fillRect(0, 0, 4, 4);
          }
          const fallbackTexture = new THREE.CanvasTexture(canvas);
          const result = { type: 'texture', object: fallbackTexture };
          this._cache.set(key, result);
          resolve(result);
        }
      );
    });

    this._loading.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * Preload a list of assets
   */
  async preload(list) {
    this._totalAssets += list.length;
    const promises = list.map(item => {
      if (item.type === 'gltf') {
        return this.loadGLTF(item.key, item.url, item.fallback);
      } else if (item.type === 'texture') {
        return this.loadTexture(item.key, item.url, item.fallbackColor);
      }
      return Promise.resolve(null);
    });
    return Promise.all(promises);
  }

  /**
   * Get main 3D object or texture from cache
   */
  get(key) {
    const asset = this._cache.get(key);
    return asset ? asset.object : null;
  }

  /**
   * Get full asset cache entry
   */
  getAsset(key) {
    return this._cache.get(key) || null;
  }

  /**
   * Deep clone a 3D model
   */
  cloneModel(key) {
    const asset = this.get(key);
    if (!asset) return null;
    return asset.clone(true);
  }

  /**
   * Free memory by disposing geometries and materials
   */
  dispose(key) {
    const asset = this._cache.get(key);
    if (!asset) return;

    if (asset.type === 'gltf' && asset.object) {
      asset.object.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    } else if (asset.type === 'texture' && asset.object) {
      asset.object.dispose();
    }

    this._cache.delete(key);
    this._loading.delete(key);
  }

  /**
   * Get overall loading progress (0.0 to 1.0)
   */
  getProgress() {
    if (this._totalAssets === 0) return 1;
    return Math.min(this._loadedAssets / this._totalAssets, 1);
  }

  /**
   * Route to specific fallback creator based on key prefix
   */
  _createDefaultFallback(key) {
    if (key.startsWith('train')) return this.createTrainPlaceholder();
    if (key.startsWith('character')) return this.createCharacterPlaceholder(key.includes('girl') ? 'girl' : 'boy', key);
    if (key.startsWith('station')) return this.createStationPlaceholder(key);
    if (key.startsWith('tunnel')) return this.createTunnelPlaceholder();
    if (key.startsWith('bridge')) return this.createBridgePlaceholder();
    if (key.startsWith('railway')) return this.createRailwayPlaceholder();
    if (key.startsWith('mountain')) return this.createEnvironmentMountain();
    
    // Generic fallback cube
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xff00ff }));
    mesh.name = key;
    return mesh;
  }

  // --- Fallback Generators ---

  createTrainPlaceholder() {
    const group = new THREE.Group();
    group.name = 'TrainPlaceholder';

    // ─── Train is oriented along the Z axis ──────────────────────────────
    // Front of train: negative Z (-Z)
    // Rear of train:  positive Z (+Z)
    // This matches the path direction (travels in -Z direction)

    // Body — long side along Z
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.7 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 6), bodyMat);
    body.position.y = 1.5;
    body.castShadow = true;
    group.add(body);

    // Roof — slightly wider and narrower than body, along Z
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, metalness: 0.6, roughness: 0.4 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, 5.8), roofMat);
    roof.position.y = 2.73;
    group.add(roof);

    // Front face plate (at -Z end)
    const frontMat = new THREE.MeshStandardMaterial({ color: 0x92400e, metalness: 0.8 });
    const front = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.0, 0.3), frontMat);
    front.position.set(0, 1.5, -3.15); // -Z = front
    group.add(front);

    // Chimney — on TOP near the front (-Z side)
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.9, 10), roofMat);
    chimney.name = 'chimney';
    chimney.position.set(0, 3.25, -1.8); // top, towards front
    group.add(chimney);

    // Headlight — on the front face at -Z
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffee88,
      emissiveIntensity: 2.5
    });
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), headlightMat);
    headlight.name = 'headlight';
    headlight.position.set(0, 1.6, -3.2); // front center
    group.add(headlight);

    // Wheels — 4 wheels, positioned at front and rear Z positions
    // rotated so they spin on X axis (roll along Z direction)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.95, roughness: 0.3 });
    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 2.7, 16);
    // Wheel cylinders lie flat on X axis (axle along X)
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelZPositions = [-1.8, 1.8]; // front and rear axles
    wheelZPositions.forEach((z, i) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.name = `wheel-${i}`;
      wheel.position.set(0, 0.55, z); // axle spans full width
      wheel.castShadow = true;
      group.add(wheel);
    });

    // Windows — on left (+X) and right (-X) sides, spaced along Z
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x4499cc,
      emissive: 0x224466,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const windowGeo = new THREE.BoxGeometry(0.08, 0.7, 0.8);

    const windowZPositions = [-1.5, 0, 1.5]; // three windows per side
    const windowXSides = [1.26, -1.26];      // left and right

    windowZPositions.forEach(z => {
      windowXSides.forEach(x => {
        const win = new THREE.Mesh(windowGeo, windowMat);
        win.position.set(x, 1.7, z);
        group.add(win);
      });
    });

    return group;
  }

  createCharacterPlaceholder(type, key) {
    const group = new THREE.Group();
    group.name = key;
    
    // Determine color
    let color = 0xcccccc;
    if (key.includes('boy-01')) color = 0x3b82f6;
    else if (key.includes('boy-02')) color = 0x06b6d4;
    else if (key.includes('girl-hijab-01')) color = 0xec4899;
    else if (key.includes('girl-hijab-02')) color = 0x8b5cf6;

    const mat = new THREE.MeshStandardMaterial({ color });
    
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), mat);
    body.position.y = 1.6;
    group.add(body);

    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffddaa });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4), headMat);
    head.position.y = 2.6;
    group.add(head);

    // Hijab
    if (type === 'girl') {
      const hijab = new THREE.Mesh(new THREE.SphereGeometry(0.45), mat);
      hijab.position.y = 2.6;
      hijab.position.z = -0.05;
      group.add(hijab);
    }

    // Legs & Arms
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const limbGeo = new THREE.BoxGeometry(0.2, 1, 0.2);
    
    const legL = new THREE.Mesh(limbGeo, limbMat);
    legL.position.set(-0.2, 0.5, 0);
    const legR = new THREE.Mesh(limbGeo, limbMat);
    legR.position.set(0.2, 0.5, 0);
    
    const armL = new THREE.Mesh(limbGeo, mat);
    armL.position.set(-0.5, 1.5, 0);
    const armR = new THREE.Mesh(limbGeo, mat);
    armR.position.set(0.5, 1.5, 0);

    group.add(legL, legR, armL, armR);
    return group;
  }

  createStationPlaceholder(key) {
    const group = new THREE.Group();
    group.name = key;

    let color = 0xaaaaaa;
    if (key.includes('library')) color = 0xfbbf24;
    else if (key.includes('creativity')) color = 0xf97316;
    else if (key.includes('technology')) color = 0x06b6d4;
    else if (key.includes('science')) color = 0x10b981;
    else if (key.includes('future')) color = 0x8b5cf6;

    // Platform
    const platMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 6), platMat);
    platform.position.y = 0.25;
    group.add(platform);

    // Building
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: color, emissiveIntensity: 0.2 });
    const bldg = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 4), bldgMat);
    bldg.position.y = 3.5;
    bldg.position.z = -1;
    group.add(bldg);

    // Glowing Sphere Top
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 1 });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1), sphereMat);
    sphere.position.y = 7.5;
    sphere.position.z = -1;
    group.add(sphere);

    // Light
    const light = new THREE.PointLight(color, 2, 20);
    light.position.set(0, 5, 2);
    group.add(light);

    return group;
  }

  createTunnelPlaceholder() {
    const group = new THREE.Group();
    const geo = new THREE.CylinderGeometry(4, 4, 25, 16, 1, true);
    const mat = new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.BackSide, roughness: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = 3;
    group.add(mesh);
    return group;
  }

  createBridgePlaceholder() {
    const group = new THREE.Group();
    
    // Deck
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, 4), deckMat);
    deck.position.y = 4;
    group.add(deck);

    // Pillars
    const pillarGeo = new THREE.BoxGeometry(1, 4, 1);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    [-8, 0, 8].forEach(x => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(x, 2, 0);
      group.add(p);
    });

    return group;
  }

  createRailwayPlaceholder(length = 60) {
    const group = new THREE.Group();
    
    // Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    const railGeo = new THREE.BoxGeometry(length, 0.2, 0.2);
    
    const rail1 = new THREE.Mesh(railGeo, railMat);
    rail1.position.set(0, 0.1, 1.3);
    const rail2 = new THREE.Mesh(railGeo, railMat);
    rail2.position.set(0, 0.1, -1.3);
    group.add(rail1, rail2);

    // Sleepers
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x3d2314 });
    const sleeperGeo = new THREE.BoxGeometry(0.4, 0.1, 3.2);
    
    const count = Math.floor(length / 1.2);
    const startX = -length / 2;
    for (let i = 0; i < count; i++) {
      const s = new THREE.Mesh(sleeperGeo, sleeperMat);
      s.position.set(startX + i * 1.2, 0.05, 0);
      group.add(s);
    }

    return group;
  }

  createEnvironmentMountain(color = 0x1a1a2e) {
    const geo = new THREE.ConeGeometry(20, 30, 8);
    // Add some noise to vertices for rough look
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > -10) {
        pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 2);
        pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 2);
      }
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
    return new THREE.Mesh(geo, mat);
  }
}

export default new AssetManager();
