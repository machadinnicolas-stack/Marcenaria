// Renders the metal sample plates off the main thread: colour pixels plus a specular map (how strongly each point
// reflects), in CSS pixels so the look is identical at any device pixel ratio.

// Integer-hash value noise: no lookup table, so no visible repetition across a large plate.
function hash(x, y, seed) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(x, y, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, seed);
  const b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed);
  const d = hash(ix + 1, iy + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(x, y, octaves, seed) {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o += 1) {
    sum += amplitude * noise(x * frequency, y * frequency, seed + o * 17);
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return sum / norm;
}

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const RUST = [[88, 36, 17], [142, 62, 28], [190, 100, 47]];

function renderPlate(finishId, width, height, dpr) {
  const pw = Math.max(1, Math.round(width * dpr));
  const ph = Math.max(1, Math.round(height * dpr));
  const base = new Uint8ClampedArray(pw * ph * 4);
  const spec = new Uint8ClampedArray(pw * ph * 4);

  for (let py = 0; py < ph; py += 1) {
    const y = py / dpr;
    const v = py / ph;
    for (let px = 0; px < pw; px += 1) {
      const x = px / dpr;
      const u = px / pw;
      let r;
      let g;
      let b;
      let sp;

      if (finishId === 'aco') {
        const fine = noise(x / 240, y / 0.85, 4) - 0.5;
        const mid = noise(x / 520 + 9, y / 2.6, 5) - 0.5;
        const band = fbm(x / 420, y / 70, 2, 6) - 0.5;
        const scratch = Math.max(0, noise(x / 700, y / 0.7, 7) - 0.9) * 5;
        const t = 1 + fine * 0.2 + mid * 0.14 + band * 0.1 + scratch * 0.12;
        r = 166 * t;
        g = 171 * t;
        b = 176 * t;
        sp = 0.5 + fine * 1.2 + mid * 0.7 + scratch;
      } else if (finishId === 'corten') {
        const broad = fbm(x / 170, y / 170, 4, 11);
        const mid = fbm(x / 40, y / 40, 3, 12);
        const fine = noise(x / 2.8, y / 2.8, 13) - 0.5;
        const grit = noise(x / 1.3, y / 1.3, 16) - 0.5;
        const runs = fbm(x / 9, y / 240, 2, 14) - 0.5;
        const pits = Math.max(0, noise(x / 3.4, y / 3.4, 15) - 0.8) * 3;
        const t = clamp01((broad * 0.62 + mid * 0.38 - 0.24) / 0.52);
        const k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
        const c0 = t < 0.5 ? RUST[0] : RUST[1];
        const c1 = t < 0.5 ? RUST[1] : RUST[2];
        const shade = 1 + fine * 0.12 + grit * 0.08 - pits * 0.28 - runs * 0.14;
        r = (c0[0] + (c1[0] - c0[0]) * k) * shade;
        g = (c0[1] + (c1[1] - c0[1]) * k) * shade;
        b = (c0[2] + (c1[2] - c0[2]) * k) * shade;
        sp = 0.5 + fine * 0.45 + t * 0.2 - pits;
      } else {
        // Powder coat: a faint orange-peel texture that only really shows inside the highlight.
        const peel = noise(x / 3.4, y / 3.4, 1) - 0.5;
        const peel2 = noise(x / 9, y / 9, 2) - 0.5;
        const cloud = fbm(x / 230, y / 230, 3, 3) - 0.5;
        const t = 1 + peel * 0.035 + peel2 * 0.035 + cloud * 0.07;
        r = 41 * t;
        g = 43 * t;
        b = 46 * t;
        sp = 0.82 + peel * 0.16 + peel2 * 0.14;
      }

      const light = 1.05 - 0.1 * v - 0.05 * u;
      const i = (py * pw + px) * 4;
      base[i] = r * light;
      base[i + 1] = g * light;
      base[i + 2] = b * light;
      base[i + 3] = 255;
      const sv = clamp01(sp) * 255;
      spec[i] = sv;
      spec[i + 1] = sv;
      spec[i + 2] = sv;
      spec[i + 3] = 255;
    }
  }
  return { pw, ph, base, spec };
}

self.onmessage = ({ data }) => {
  const { key, finishId, width, height, dpr } = data;
  const { pw, ph, base, spec } = renderPlate(finishId, width, height, dpr);
  self.postMessage({ key, pw, ph, base, spec }, [base.buffer, spec.buffer]);
};
