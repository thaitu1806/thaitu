/**
 * Ocean Animated Background (Sprite Sheet version)
 * Injects a deep-sea background with 3D sprite-animated fish & octopus.
 * Usage: add <script src="/ocean-bg.js"></script> to any HTML page.
 * Requires: /ocean-bg.css (auto-injected if missing) + sprite PNGs in /img/
 */
(function () {
  'use strict';
  if (document.querySelector('.ocean-bg')) return; // already injected

  // Auto-inject CSS if not already present
  if (!document.querySelector('link[href*="ocean-bg.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    const depth = (location.pathname.match(/\//g) || []).length - 1;
    const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
    link.href = prefix + 'ocean-bg.css';
    document.head.appendChild(link);
  }

  // Build the ocean container
  const ocean = document.createElement('div');
  ocean.className = 'ocean-bg';
  ocean.setAttribute('aria-hidden', 'true');

  // --- Sunbeams (5) ---
  const beams = document.createElement('div');
  beams.className = 'ocean-bg-beams';
  for (let i = 0; i < 5; i++) {
    const b = document.createElement('div');
    b.className = 'sunbeam';
    beams.appendChild(b);
  }
  ocean.appendChild(beams);

  // --- Bubbles (6) ---
  const bubbles = document.createElement('div');
  bubbles.className = 'ocean-bg-bubbles';
  for (let i = 0; i < 6; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';
    bubbles.appendChild(b);
  }
  ocean.appendChild(bubbles);

  // --- Fish (4: clown, blue, gold, clown) ---
  const fishTypes = ['clown', 'blue', 'gold', 'clown'];
  const fishGroup = document.createElement('div');
  fishGroup.className = 'ocean-bg-fish';
  fishTypes.forEach(type => {
    const fish = document.createElement('div');
    fish.className = 'fish fish--' + type;
    fishGroup.appendChild(fish);
  });
  ocean.appendChild(fishGroup);

  // --- Octopus (1) ---
  const octopus = document.createElement('div');
  octopus.className = 'octopus';
  ocean.appendChild(octopus);

  // --- Seaweed (4) ---
  const seaweedGroup = document.createElement('div');
  seaweedGroup.className = 'ocean-bg-seaweed';
  for (let i = 0; i < 4; i++) {
    const sw = document.createElement('div');
    sw.className = 'seaweed';
    seaweedGroup.appendChild(sw);
  }
  ocean.appendChild(seaweedGroup);

  // Insert as first child of body so it sits behind everything
  document.body.insertBefore(ocean, document.body.firstChild);
})();
