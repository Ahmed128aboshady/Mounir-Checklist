import * as THREE from 'three';

const STATION_CONFIGS = [
  {
    key: 'station-library',
    arabicName: 'محطة المعرفة',
    color: 0xfbbf24,
    position: new THREE.Vector3(-15, 0, -140),
    description: 'مكتبة المعرفة — اكتشف عالم الكتب والقراءة',
    ctaUrl: 'prophets.html'
  },
  {
    key: 'station-creativity',
    arabicName: 'محطة الإبداع',
    color: 0xf97316,
    position: new THREE.Vector3(-22, 0, -145),
    description: 'استوديو الإبداع — رسم وتصميم وفن',
    ctaUrl: '#'
  },
  {
    key: 'station-technology',
    arabicName: 'محطة التكنولوجيا',
    color: 0x06b6d4,
    position: new THREE.Vector3(-19, 0, -152),
    description: 'مختبر التكنولوجيا — برمجة وذكاء اصطناعي',
    ctaUrl: 'katalog.html'
  },
  {
    key: 'station-science',
    arabicName: 'محطة العلوم',
    color: 0x10b981,
    position: new THREE.Vector3(-12, 0, -155),
    description: 'مختبر العلوم — تجارب وفلك واكتشافات',
    ctaUrl: '#'
  },
  {
    key: 'station-future',
    arabicName: 'محطة المستقبل',
    color: 0x8b5cf6,
    position: new THREE.Vector3(-8, 0, -150),
    description: 'بوابة المستقبل — مهارات الغد',
    ctaUrl: '#'
  },
];

export default class StationManager {
  constructor() {
    this._stations = {};
    this._scene = null;
    this._camera = null;
    this._renderer = null;
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._hoveredKey = null;
    this._isInteractive = false;
    this._onClickCallbacks = {};
  }

  async init(scene, camera, renderer, assetManager) {
    this._scene = scene;
    this._camera = camera;
    this._renderer = renderer;

    try {
      const Station = (await import('./Station.js')).default;

      await Promise.all(STATION_CONFIGS.map(async config => {
        const station = new Station(config.key, config);
        await station.init(assetManager);
        station.setVisible(false);
        scene.add(station.getGroup());
        this._stations[config.key] = station;
      }));

      // Setup mouse interaction
      renderer.domElement.addEventListener('mousemove', e => this._onMouseMove(e));
      renderer.domElement.addEventListener('click', e => this._onMouseClick(e));
      renderer.domElement.addEventListener('touchstart', e => this._onTouch(e), { passive: true });
    } catch (error) {
      console.error('Error initializing StationManager:', error);
    }

    return this;
  }

  setInteractive(v) {
    this._isInteractive = v;
  }

  setVisible(v) {
    Object.values(this._stations).forEach(s => s.setVisible(v));
  }

  focusStation(key) {
    Object.values(this._stations).forEach(s => s.setFocus(false));
    if (key && this._stations[key]) this._stations[key].setFocus(true);
  }

  onStationClick(key, cb) {
    this._onClickCallbacks[key] = cb;
  }

  getStation(key) {
    return this._stations[key];
  }

  update(delta, time) {
    Object.values(this._stations).forEach(s => s.update(delta, time));
  }

  _onMouseMove(event) {
    if (!this._isInteractive) return;
    
    // Calculate normalized device coords
    const rect = this._renderer.domElement.getBoundingClientRect();
    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast against station interact boxes
    this._raycaster.setFromCamera(this._mouse, this._camera);
    const interactMeshes = Object.values(this._stations)
                                 .map(s => s.getInteractMesh())
                                 .filter(Boolean);
    
    const hits = this._raycaster.intersectObjects(interactMeshes, false);

    const newHovered = hits.length > 0 ? hits[0].object.userData.stationKey : null;

    if (newHovered !== this._hoveredKey) {
      if (this._hoveredKey) this._stations[this._hoveredKey]?.setHover(false);
      this._hoveredKey = newHovered;
      if (this._hoveredKey) {
        this._stations[this._hoveredKey]?.setHover(true);
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = '';
      }
    }
  }

  _onMouseClick(event) {
    if (!this._isInteractive || !this._hoveredKey) return;
    
    const cb = this._onClickCallbacks[this._hoveredKey];
    if (cb) cb(this._hoveredKey, this._stations[this._hoveredKey]?.getConfig());
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('station-click', { detail: { key: this._hoveredKey } }));
  }

  _onTouch(event) {
    // Convert touch to click-like interaction
    if (event.touches.length === 0) return;
    const touch = event.touches[0];
    this._onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    setTimeout(() => this._onMouseClick({}), 100);
  }
}
