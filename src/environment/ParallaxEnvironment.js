import * as THREE from 'three';

export default class ParallaxEnvironment {
  constructor() {
    this._scene = null;
    this._layers = {}; // name -> {mesh, plane, baseZ, parallaxFactor}
    this._currentImage = null;
  }
  
  init(scene) {
    this._scene = scene;
    // Create 3 background plane layers
    // background: far (z=-200), wide (300x120), parallaxFactor=0.02
    // midground: mid (z=-100), medium (150x80), parallaxFactor=0.05
    // foreground: near (z=-20), smaller (80x50), parallaxFactor=0.08
    
    const layerDefs = [
      { name:'background', z:-200, w:300, h:120, factor:0.02 },
      { name:'midground',  z:-80,  w:150, h:60,  factor:0.05 },
    ];
    
    layerDefs.forEach(def => {
      const geo = new THREE.PlaneGeometry(def.w, def.h);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x0a0a1a,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, def.h * 0.3, def.z);
      this._scene.add(mesh);
      this._layers[def.name] = { mesh, baseZ: def.z, parallaxFactor: def.factor, mat };
    });
    
    return this;
  }
  
  setImage(layerName, url, opacity=1) {
    const layer = this._layers[layerName];
    if (!layer) return;
    
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        layer.mat.map = texture;
        layer.mat.color.set(0xffffff);
        layer.mat.needsUpdate = true;
        if (window.gsap) window.gsap.to(layer.mat, { opacity, duration: 1.5 });
        else layer.mat.opacity = opacity;
      },
      undefined,
      () => {
        // On error, use gradient fallback — do nothing (canvas stays colored)
        if (window.gsap) window.gsap.to(layer.mat, { opacity: 0.3, duration: 1 });
      }
    );
  }
  
  clearLayer(layerName) {
    const layer = this._layers[layerName];
    if (!layer) return;
    if (window.gsap) window.gsap.to(layer.mat, { opacity: 0, duration: 1 });
    else layer.mat.opacity = 0;
  }
  
  update(camera) {
    // Subtle parallax: shift each layer based on camera X and Y movement
    Object.values(this._layers).forEach(layer => {
      layer.mesh.position.x = -camera.position.x * layer.parallaxFactor;
      layer.mesh.position.y = (camera.position.y * layer.parallaxFactor * 0.5) + (layer.mesh.geometry.parameters.height * 0.3);
    });
  }
}
