import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/controls/PointerLockControls.js';

const skyColor = 0x8ec5ff;

const scene = new THREE.Scene();
scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.Fog(0x9bcfff, 45, 180);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

const blocker = document.getElementById('blocker');
const selectedBlockLabel = document.getElementById('selected-block');

blocker.addEventListener('click', () => controls.lock());
controls.addEventListener('lock', () => {
  blocker.style.display = 'none';
});
controls.addEventListener('unlock', () => {
  blocker.style.display = 'flex';
});

document.addEventListener('contextmenu', (event) => event.preventDefault());

const ambientLight = new THREE.HemisphereLight(0xcfe8ff, 0x5a4832, 0.55);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff6e7, 1.05);
sunLight.position.set(60, 100, -30);
scene.add(sunLight);

const blockGroup = new THREE.Group();
scene.add(blockGroup);

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

function createCanvasTexture(draw, size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function sprinkleNoise(ctx, size, colors, density = 0.12) {
  const total = Math.floor(size * size * density);
  for (let i = 0; i < total; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(x, y, 1, 1);
  }
}

const textures = {
  grassTop: createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#2f8e24';
    ctx.fillRect(0, 0, size, size);
    sprinkleNoise(ctx, size, ['#3fa32e', '#28721d', '#2d8a28'], 0.35);
  }),
  grassSide: createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#29651c';
    ctx.fillRect(0, 0, size, size * 0.35);
    ctx.fillStyle = '#6b4a22';
    ctx.fillRect(0, size * 0.35, size, size * 0.65);
    sprinkleNoise(ctx, size, ['#2c691f', '#306f20', '#714a26', '#7d5028']);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < size; y += 6) {
      ctx.fillRect(0, size * 0.35 + y, size, 2);
    }
  }),
  dirt: createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#6c4322';
    ctx.fillRect(0, 0, size, size);
    sprinkleNoise(ctx, size, ['#5d3a1e', '#7b4e26', '#8b582e'], 0.3);
  }),
  stone: createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#858a90';
    ctx.fillRect(0, 0, size, size);
    sprinkleNoise(ctx, size, ['#6f7479', '#9ba1a6', '#7c8288'], 0.28);
  }),
  sand: createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#d9c37a';
    ctx.fillRect(0, 0, size, size);
    sprinkleNoise(ctx, size, ['#e4cd88', '#c9b06b', '#bfa763'], 0.24);
  }),
  logSide: createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#6a4a27';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(255, 224, 180, 0.3)';
    for (let x = 4; x < size; x += 8) {
      ctx.fillRect(x, 0, 2, size);
    }
    sprinkleNoise(ctx, size, ['#744e2b', '#5d3e20', '#856134'], 0.2);
  }),
  logTop: createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#aa7a42';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(80, 45, 18, 0.6)';
    ctx.lineWidth = 2;
    for (let r = size * 0.1; r < size * 0.5; r += size * 0.12) {
      ctx.beginPath();
      ctx.rect(size * 0.5 - r, size * 0.5 - r, r * 2, r * 2);
      ctx.stroke();
    }
    sprinkleNoise(ctx, size, ['#b68349', '#996c3b', '#bf8f53'], 0.18);
  }),
  leaves: createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#2c7f36';
    ctx.fillRect(0, 0, size, size);
    sprinkleNoise(ctx, size, ['#2f8b3c', '#276d31', '#359844', '#3fa24b'], 0.45);
  }),
  water: createCanvasTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(50, 130, 220, 0.8)');
    gradient.addColorStop(1, 'rgba(30, 90, 200, 0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    for (let y = 8; y < size; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(size * 0.25, y - 3, size * 0.5, y);
      ctx.quadraticCurveTo(size * 0.75, y + 3, size, y);
      ctx.stroke();
    }
  })
};

textures.water.wrapS = THREE.RepeatWrapping;
textures.water.wrapT = THREE.RepeatWrapping;
textures.water.repeat.set(2, 2);

const blockMaterials = {
  grass: [
    new THREE.MeshStandardMaterial({ map: textures.grassSide, roughness: 0.95, metalness: 0.05, flatShading: true }),
    new THREE.MeshStandardMaterial({ map: textures.grassSide, roughness: 0.95, metalness: 0.05, flatShading: true }),
    new THREE.MeshStandardMaterial({ map: textures.grassTop, roughness: 0.8, metalness: 0.05, flatShading: true }),
    new THREE.MeshStandardMaterial({ map: textures.dirt, roughness: 0.95, metalness: 0.05, flatShading: true }),
    new THREE.MeshStandardMaterial({ map: textures.grassSide, roughness: 0.95, metalness: 0.05, flatShading: true }),
    new THREE.MeshStandardMaterial({ map: textures.grassSide, roughness: 0.95, metalness: 0.05, flatShading: true })
  ],
  dirt: new THREE.MeshStandardMaterial({ map: textures.dirt, roughness: 0.95, metalness: 0.05, flatShading: true }),
  stone: new THREE.MeshStandardMaterial({ map: textures.stone, roughness: 0.85, metalness: 0.05, flatShading: true }),
  sand: new THREE.MeshStandardMaterial({ map: textures.sand, roughness: 0.88, metalness: 0.02, flatShading: true }),
  water: new THREE.MeshStandardMaterial({
    map: textures.water,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    roughness: 0.4,
    metalness: 0,
    flatShading: true
  }),
  log: [
    new THREE.MeshStandardMaterial({ map: textures.logSide, roughness: 0.9, metalness: 0.05, flatShading: true }),
    new THREE.MeshStandardMaterial({ map: textures.logSide, roughness: 0.9, metalness: 0.05, flatShading: true }),
    new THREE.MeshStandardMaterial({ map: textures.logTop, roughness: 0.8, metalness: 0.05, flatShading: true }),
    new THREE.MeshStandardMaterial({ map: textures.logTop, roughness: 0.8, metalness: 0.05, flatShading: true }),
    new THREE.MeshStandardMaterial({ map: textures.logSide, roughness: 0.9, metalness: 0.05, flatShading: true }),
    new THREE.MeshStandardMaterial({ map: textures.logSide, roughness: 0.9, metalness: 0.05, flatShading: true })
  ],
  leaves: new THREE.MeshStandardMaterial({ map: textures.leaves, roughness: 0.95, metalness: 0.03, flatShading: true })
};

const placeableTypes = ['grass', 'dirt', 'stone', 'sand', 'log', 'leaves'];
const blockDisplayNames = {
  grass: 'Grass',
  dirt: 'Dirt',
  stone: 'Stone',
  sand: 'Sand',
  log: 'Log',
  leaves: 'Leaves',
  water: 'Water'
};

let currentBlockType = placeableTypes[0];

function updateSelectedBlockLabel() {
  selectedBlockLabel.textContent = `Block: ${blockDisplayNames[currentBlockType]}`;
}

updateSelectedBlockLabel();

const blocks = new Map();

function blockKey(x, y, z) {
  return `${x},${y},${z}`;
}

function addBlock(type, x, y, z) {
  const key = blockKey(x, y, z);
  if (blocks.has(key)) {
    return null;
  }
  const material = blockMaterials[type];
  const mesh = new THREE.Mesh(cubeGeometry, material);
  mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
  mesh.userData = { position: { x, y, z }, type, key };
  const isSolid = type !== 'water';
  mesh.castShadow = isSolid;
  mesh.receiveShadow = type !== 'water';
  blockGroup.add(mesh);
  const data = {
    mesh,
    type,
    isSolid,
    position: new THREE.Vector3(x, y, z)
  };
  blocks.set(key, data);
  return data;
}

function removeBlockAt(x, y, z) {
  const key = blockKey(x, y, z);
  const data = blocks.get(key);
  if (!data) return null;
  blockGroup.remove(data.mesh);
  blocks.delete(key);
  return data;
}

function pseudoRandom(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const WORLD_SIZE = 44;
const HALF_WORLD = WORLD_SIZE / 2;
const WATER_LEVEL = 5;

function terrainHeight(x, z) {
  const nx = x / WORLD_SIZE;
  const nz = z / WORLD_SIZE;
  const base = Math.sin(nx * Math.PI * 2) * 2.2 + Math.cos(nz * Math.PI * 2) * 2.2;
  const detail = Math.sin((nx + nz) * Math.PI * 3) * 1.5;
  const radial = Math.cos(Math.sqrt(nx * nx + nz * nz) * Math.PI * 1.5) * 2.8;
  const random = pseudoRandom(x * 0.6, z * 0.6) * 1.8;
  let height = 6 + base + detail + radial + random;
  const dist = Math.sqrt((x) * (x) + (z) * (z)) / (WORLD_SIZE * 0.5);
  height -= Math.max(0, (dist - 0.5) * 6);
  return Math.max(2, Math.floor(height));
}

function generateWorld() {
  for (let x = -HALF_WORLD; x < HALF_WORLD; x++) {
    for (let z = -HALF_WORLD; z < HALF_WORLD; z++) {
      const h = terrainHeight(x, z);
      for (let y = 0; y < h; y++) {
        let type = 'dirt';
        if (y === 0) {
          type = 'stone';
        } else if (y < h - 4) {
          type = 'stone';
        } else if (y < h - 1) {
          type = 'dirt';
        } else {
          type = h <= WATER_LEVEL + 1 ? 'sand' : 'grass';
        }
        addBlock(type, x, y, z);
      }
      if (h < WATER_LEVEL) {
        for (let y = h; y < WATER_LEVEL; y++) {
          addBlock('water', x, y, z);
        }
      }
    }
  }
}

generateWorld();

function findTopBlock(x, z) {
  for (let y = 60; y >= 0; y--) {
    const data = blocks.get(blockKey(x, y, z));
    if (data && data.isSolid) {
      return { y, type: data.type };
    }
  }
  return null;
}

function createTree(x, groundHeight, z) {
  const treeHeight = 4 + Math.floor(pseudoRandom(x + 2.3, z + 1.7) * 2);
  for (let i = 0; i < treeHeight; i++) {
    const trunkY = groundHeight + i;
    if (!blocks.has(blockKey(x, trunkY, z))) {
      addBlock('log', x, trunkY, z);
    }
  }
  const canopyBase = groundHeight + treeHeight - 2;
  for (let y = canopyBase; y <= groundHeight + treeHeight + 1; y++) {
    const radius = y === groundHeight + treeHeight + 1 ? 1 : 2;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > radius + 1) continue;
        const leafX = x + dx;
        const leafZ = z + dz;
        if (Math.abs(dx) === radius && Math.abs(dz) === radius && radius > 1) continue;
        const leafY = y;
        if (!blocks.has(blockKey(leafX, leafY, leafZ))) {
          addBlock('leaves', leafX, leafY, leafZ);
        }
      }
    }
  }
}

for (let x = -HALF_WORLD + 2; x < HALF_WORLD - 2; x++) {
  for (let z = -HALF_WORLD + 2; z < HALF_WORLD - 2; z++) {
    const top = findTopBlock(x, z);
    if (!top) continue;
    if (top.type !== 'grass') continue;
    if (top.y <= WATER_LEVEL + 1) continue;
    if (pseudoRandom(x * 1.3, z * 0.9) > 0.82) {
      createTree(x, top.y + 1, z);
    }
  }
}

function findSpawnPoint() {
  const maxRadius = 10;
  for (let radius = 0; radius <= maxRadius; radius++) {
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        if (Math.abs(x) !== radius && Math.abs(z) !== radius) continue;
        const top = findTopBlock(x, z);
        if (top && top.type === 'grass') {
          return { x, z, y: top.y };
        }
      }
    }
  }
  return { x: 0, z: 0, y: WATER_LEVEL + 2 };
}

const spawnPoint = findSpawnPoint();
const player = {
  position: new THREE.Vector3(spawnPoint.x + 0.5, spawnPoint.y + 4, spawnPoint.z + 0.5),
  velocity: new THREE.Vector3(),
  onGround: false
};
controls.getObject().position.copy(player.position);

const playerHalfSize = new THREE.Vector3(0.35, 0.9, 0.35);
const boundsMin = new THREE.Vector3();
const boundsMax = new THREE.Vector3();

function updateBounds() {
  boundsMin.set(
    player.position.x - playerHalfSize.x,
    player.position.y - playerHalfSize.y,
    player.position.z - playerHalfSize.z
  );
  boundsMax.set(
    player.position.x + playerHalfSize.x,
    player.position.y + playerHalfSize.y,
    player.position.z + playerHalfSize.z
  );
}

updateBounds();

const keyStates = {};

window.addEventListener('keydown', (event) => {
  keyStates[event.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code.startsWith('Digit')) {
    const index = Number(event.code.replace('Digit', '')) - 1;
    if (index >= 0 && index < placeableTypes.length) {
      currentBlockType = placeableTypes[index];
      updateSelectedBlockLabel();
    }
  }
  if (event.code === 'Space' && controls.isLocked && player.onGround) {
    player.velocity.y = 8.5;
    player.onGround = false;
  }
});

window.addEventListener('keyup', (event) => {
  keyStates[event.code] = false;
});

const forwardVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);

function getMovementVectors() {
  controls.getDirection(forwardVector);
  forwardVector.y = 0;
  forwardVector.normalize();
  sideVector.crossVectors(forwardVector, upVector).normalize();
}

function moveAxis(axis, amount) {
  if (amount === 0) return;
  player.position[axis] += amount;
  updateBounds();

  const minX = Math.floor(boundsMin.x);
  const maxX = Math.floor(boundsMax.x);
  const minY = Math.floor(boundsMin.y);
  const maxY = Math.floor(boundsMax.y);
  const minZ = Math.floor(boundsMin.z);
  const maxZ = Math.floor(boundsMax.z);

  const half = axis === 'x' ? playerHalfSize.x : axis === 'y' ? playerHalfSize.y : playerHalfSize.z;
  let collided = false;
  let adjustment = amount > 0 ? Infinity : -Infinity;

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        const data = blocks.get(blockKey(x, y, z));
        if (!data || !data.isSolid) continue;
        const blockMinX = x;
        const blockMaxX = x + 1;
        const blockMinY = y;
        const blockMaxY = y + 1;
        const blockMinZ = z;
        const blockMaxZ = z + 1;
        const intersects =
          boundsMax.x > blockMinX &&
          boundsMin.x < blockMaxX &&
          boundsMax.y > blockMinY &&
          boundsMin.y < blockMaxY &&
          boundsMax.z > blockMinZ &&
          boundsMin.z < blockMaxZ;
        if (!intersects) continue;
        collided = true;
        const blockMinAxis = axis === 'x' ? blockMinX : axis === 'y' ? blockMinY : blockMinZ;
        const blockMaxAxis = blockMinAxis + 1;
        if (amount > 0) {
          const candidate = blockMinAxis - half;
          if (candidate < adjustment) {
            adjustment = candidate;
          }
        } else {
          const candidate = blockMaxAxis + half;
          if (candidate > adjustment) {
            adjustment = candidate;
          }
        }
      }
    }
  }

  if (collided) {
    player.position[axis] = adjustment;
    updateBounds();
    player.velocity[axis] = 0;
    if (axis === 'y' && amount < 0) {
      player.onGround = true;
    }
  }
}

const raycaster = new THREE.Raycaster();

renderer.domElement.addEventListener('mousedown', (event) => {
  if (!controls.isLocked) return;
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const intersects = raycaster.intersectObjects(blockGroup.children, false);
  if (intersects.length === 0) return;
  const intersect = intersects[0];
  const { type, position } = intersect.object.userData;
  if (!position) return;

  if (event.button === 0) {
    removeBlockAt(position.x, position.y, position.z);
  } else if (event.button === 2) {
    const normal = intersect.face.normal;
    const target = {
      x: position.x + normal.x,
      y: position.y + normal.y,
      z: position.z + normal.z
    };
    if (!blocks.has(blockKey(target.x, target.y, target.z))) {
      addBlock(currentBlockType, target.x, target.y, target.z);
    }
  }
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(0.05, clock.getDelta());

  if (controls.isLocked) {
    const wasOnGround = player.onGround;
    player.onGround = false;
    getMovementVectors();

    const acceleration = new THREE.Vector3();
    if (keyStates['KeyW']) acceleration.add(forwardVector);
    if (keyStates['KeyS']) acceleration.sub(forwardVector);
    if (keyStates['KeyA']) acceleration.add(sideVector);
    if (keyStates['KeyD']) acceleration.sub(sideVector);

    if (acceleration.lengthSq() > 0) {
      acceleration.normalize();
    }

    const moveSpeed = keyStates['ShiftLeft'] || keyStates['ShiftRight'] ? 32 : 20;
    player.velocity.x += acceleration.x * moveSpeed * delta;
    player.velocity.z += acceleration.z * moveSpeed * delta;

    const damping = wasOnGround ? 12 : 1.5;
    player.velocity.x -= player.velocity.x * damping * delta;
    player.velocity.z -= player.velocity.z * damping * delta;

    player.velocity.y -= 25 * delta;

    const deltaPosition = player.velocity.clone().multiplyScalar(delta);
    moveAxis('x', deltaPosition.x);
    moveAxis('z', deltaPosition.z);
    moveAxis('y', deltaPosition.y);

    controls.getObject().position.copy(player.position);

    if (player.position.y < -20) {
      player.position.set(spawnPoint.x + 0.5, spawnPoint.y + 6, spawnPoint.z + 0.5);
      player.velocity.set(0, 0, 0);
      controls.getObject().position.copy(player.position);
      updateBounds();
    }
  }

  textures.water.offset.x += delta * 0.06;
  textures.water.offset.y += delta * 0.02;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
