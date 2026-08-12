const CHARACTER_SCENES = {
  hero: ['boy-01', 'boy-02', 'girl-hijab-01', 'girl-hijab-02'],
  journey: ['boy-01', 'girl-hijab-01'],
  technology: ['boy-02', 'girl-hijab-02'],
  creativity: ['boy-01', 'girl-hijab-01'],
  science: ['boy-02', 'girl-hijab-01'],
  knowledge: ['boy-01', 'girl-hijab-01'],
  achievement: ['boy-01', 'boy-02', 'girl-hijab-01', 'girl-hijab-02'],
  parent: ['boy-01', 'girl-hijab-01'],
};

export default class CharacterManager {
  constructor() {
    this._characters = {}; // key -> Character instance
    this._scene = null;
    this._assetManager = null;
    this._currentScene = null;
  }

  async init(scene, assetManager) {
    this._scene = scene;
    this._assetManager = assetManager;

    try {
      const Character = (await import('./Character.js')).default;

      // Create all 4 characters
      const defs = [
        { key: 'boy-01', type: 'boy' },
        { key: 'boy-02', type: 'boy' },
        { key: 'girl-hijab-01', type: 'girl' },
        { key: 'girl-hijab-02', type: 'girl' },
      ];

      await Promise.all(defs.map(async def => {
        const char = new Character(def.key, def.type);
        await char.load(assetManager);
        char.setVisible(false);
        scene.add(char.getGroup());
        this._characters[def.key] = char;
      }));
    } catch (error) {
      console.error('Error initializing CharacterManager:', error);
    }

    return this;
  }

  placeCharacters(sceneName) {
    // Hide all first
    Object.values(this._characters).forEach(c => c.setVisible(false));

    const activeKeys = CHARACTER_SCENES[sceneName] || [];
    this._currentScene = sceneName;

    // Position characters based on scene
    const positions = this._getPositionsForScene(sceneName);

    activeKeys.forEach((key, i) => {
      const char = this._characters[key];
      if (!char) return;
      const pos = positions[i] || [i * 1.2 - 1, 0, 0];
      char.setPosition(...pos);
      char.setVisible(true);
      char.play(sceneName === 'achievement' ? 'celebrate' : 'idle');
    });
  }

  playAll(animName) {
    Object.values(this._characters).forEach(c => c.play(animName));
  }

  getCharacter(key) {
    return this._characters[key];
  }

  update(delta, time) {
    Object.values(this._characters).forEach(c => c.update(delta, time));
  }

  _getPositionsForScene(sceneName) {
    // Return array of [x, y, z] positions for each character in that scene
    switch (sceneName) {
      case 'hero':
        // characters inside/around train
        return [[-2, 0, 1], [-1, 0, 2], [1, 0, 2], [2, 0, 1]];
      case 'journey':
        // inside train window area
        return [[-0.5, 0, 0], [0.5, 0, 0]];
      case 'achievement':
        // spread across the platform
        return [[-1.8, 0, 0], [-0.6, 0, 0], [0.6, 0, 0], [1.8, 0, 0]];
      default:
        // two characters side by side
        return [[-1, 0, 0], [1, 0, 0]];
    }
  }
}
