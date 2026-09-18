/**
 * Tiny 2D value-noise helper used to shape hills, grass, and mountain ridges.
 */
export function createNoise(seed = 1337) {
  function hash(ix, iy) {
    let n = ix * 374761393 + iy * 668265263 + seed * 1442695041;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967296;
  }

  function fade(t) {
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function noise2(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = fade(x - x0);
    const fy = fade(y - y0);
    const a = lerp(hash(x0, y0), hash(x0 + 1, y0), fx);
    const b = lerp(hash(x0, y0 + 1), hash(x0 + 1, y0 + 1), fx);
    return lerp(a, b, fy);
  }

  function fbm(x, y, octaves = 5) {
    let value = 0;
    let amp = 0.5;
    let freq = 1;
    for (let i = 0; i < octaves; i++) {
      value += amp * noise2(x * freq, y * freq);
      freq *= 2;
      amp *= 0.5;
    }
    return value;
  }

  return { noise2, fbm };
}

export function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
