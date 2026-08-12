/**
 * main.js — Entry point for Mounir Academy Cinematic Experience
 * أكاديمية منير — نقطة البداية للتجربة السينمائية
 *
 * Architecture:
 * - Lenis smooth scrolling
 * - GSAP ScrollTrigger drives the Three.js scene
 * - All assets load with graceful fallbacks
 * - Placeholder geometry used until real GLB files are added
 */

import * as THREE from 'three';
import Lenis from 'lenis';

// ── Core Systems ──────────────────────────────────────────────────────────────
import sceneManager from './core/SceneManager.js';
import assetManager from './core/AssetManager.js';
import performanceManager from './core/PerformanceManager.js';
import CameraController from './core/CameraController.js';

// ── Train Systems ─────────────────────────────────────────────────────────────
import trainPath from './train/TrainPath.js';
import TrainController from './train/TrainController.js';

// ── Stations ─────────────────────────────────────────────────────────────────
// (Handled by HTML StationJourneySystem — no 3D station objects needed)

// ── Environment ───────────────────────────────────────────────────────────────
import EnvironmentManager from './environment/EnvironmentManager.js';
import ParallaxEnvironment from './environment/ParallaxEnvironment.js';

// ── Story ─────────────────────────────────────────────────────────────────────
import storyState from './storytelling/StoryState.js';
import StoryTimeline from './storytelling/StoryTimeline.js';

// ── UI ────────────────────────────────────────────────────────────────────────
import JourneyProgress from './ui/JourneyProgress.js';
import NarratorSystem from './ui/NarratorSystem.js';
import StationJourneySystem from './ui/StationJourneySystem.js';

// ── GSAP globals (loaded as UMD scripts in HTML) ──────────────────────────────
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

// =============================================================================
// MAIN INIT
// =============================================================================

async function init() {
  console.log('[Mounir] Initializing cinematic experience...');

  // ── Performance Detection ──────────────────────────────────────────────────
  performanceManager.init();
  const isMobile = performanceManager.isMobile();
  console.log(`[Mounir] Device: ${isMobile ? 'Mobile' : 'Desktop'} | Quality: ${performanceManager.getLevel()}`);

  // ── Setup Canvas & Scene ───────────────────────────────────────────────────
  const canvas = document.getElementById('experience-canvas');
  if (!canvas) {
    console.error('[Mounir] Canvas not found!');
    return;
  }

  sceneManager.init(canvas);
  const scene = sceneManager.getScene();
  const renderer = sceneManager.getRenderer();
  const camera = sceneManager.getCamera();

  // Apply quality settings
  renderer.setPixelRatio(performanceManager.getPixelRatio());

  // ── Camera Controller ──────────────────────────────────────────────────────
  const cameraController = new CameraController(camera);

  // ── Lenis Smooth Scrolling ─────────────────────────────────────────────────
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 1.8,
  });

  // Connect Lenis to GSAP ticker smoothly
  if (gsap) {
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(500, 33);
  } else {
    // Fallback RAF loop for Lenis without GSAP
    function rafLenis(time) {
      lenis.raf(time);
      requestAnimationFrame(rafLenis);
    }
    requestAnimationFrame(rafLenis);
  }

  // ── Environment Setup ──────────────────────────────────────────────────────
  const environmentManager = new EnvironmentManager();
  environmentManager.init(scene, performanceManager);

  const parallaxEnv = new ParallaxEnvironment();
  parallaxEnv.init(scene);

  // ── Train Path ─────────────────────────────────────────────────────────────
  trainPath.createRailMesh(scene);

  // ── Train Controller ───────────────────────────────────────────────────────
  const trainController = new TrainController(assetManager);
  await trainController.init(trainPath);
  scene.add(trainController.getGroup());
  cameraController.setTrainRef(trainController.getGroup());

  // ── Journey Progress UI ────────────────────────────────────────────────────
  const journeyProgress = new JourneyProgress();
  journeyProgress.init();

  // ── Narrator System (text bubbles while train moves) ───────────────────────
  const narrator = new NarratorSystem();
  narrator.init();
  narrator.onStateChange('hero');

  // ── Station Journey System (signs + course detail panels) ─────────────────
  const stationJourney = new StationJourneySystem();
  stationJourney.init((speed) => {
    // Called when train should slow/stop at a station
    trainController.setSpeed(speed);
  });

  // Re-enable Lenis when panel closes
  window.addEventListener('sj-panel-close', () => {
    if (lenis) lenis.start();
  });
  window.addEventListener('sj-panel-open', () => {
    if (lenis) lenis.stop();
  });

  // ── Story Timeline ─────────────────────────────────────────────────────────
  const storyTimeline = new StoryTimeline();
  storyTimeline.init({
    lenis,
    trainController,
    trainPath,
    cameraController,
    environmentManager,
    parallaxEnv,
    storyState,
    journeyProgress,
  });

  // ── Render Loop ────────────────────────────────────────────────────────────
  let lastTime = 0;

  sceneManager.startLoop((delta, time) => {
    // Update all systems
    cameraController.update(delta, time);
    trainController.update(delta, time);

    environmentManager.update(delta, time);
    parallaxEnv.update(camera);

    // ScrollTrigger refresh on first tick
  });

  // ── Loading Screen Removal ─────────────────────────────────────────────────
  const loadingEl = document.getElementById('loading-screen');
  if (loadingEl) {
    if (gsap) {
      gsap.to(loadingEl, {
        opacity: 0,
        duration: 1,
        delay: 0.5,
        onComplete: () => loadingEl.remove(),
      });
    } else {
      setTimeout(() => loadingEl.remove(), 1000);
    }
  }

  // ── Initial Hero Reveal ────────────────────────────────────────────────────
  _playHeroReveal(gsap, cameraController);

  // ── Window Resize ──────────────────────────────────────────────────────────
  sceneManager.onResize(() => {
    if (ScrollTrigger) ScrollTrigger.refresh();
  });

  console.log('[Mounir] ✓ Experience initialized. All systems running.');
}

// =============================================================================
// HERO INTRO ANIMATION (plays on page load before scrolling)
// =============================================================================

function _playHeroReveal(gsap, cameraController) {
  if (!gsap) return;

  // Fade in the page
  gsap.from('#scroll-content', {
    opacity: 0,
    duration: 1.5,
    ease: 'power2.out',
  });

  // Camera cinematic intro: pull back slightly, then settle
  gsap.from('#hero-section .hero-body-content', {
    y: 40,
    opacity: 0,
    duration: 1.8,
    delay: 0.4,
    ease: 'power3.out',
  });

  gsap.from('#hero-section .hero-stats-bar', {
    y: 30,
    opacity: 0,
    duration: 1.4,
    delay: 0.9,
    ease: 'power3.out',
  });

  // Animate train arrival (train slides in from left)
  // This will be handled by TrainController's initial animation
}

// =============================================================================
// START
// =============================================================================

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
