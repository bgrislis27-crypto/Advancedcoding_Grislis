// This file makes the random hills and bumpy ground.
// The world uses these numbers so the terrain is not a flat rectangle.

export function createNoise(seed = 1337) {
  // Turn two grid numbers into a random-looking 0 to 1 value.
  // The same input always gives the same output, so the hills stay still.
  function hash(ix, iy) {
    let n = ix * 374761393 + iy * 668265263 + seed * 1442695041;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967296;
  }

  // Smooth the blend between 0 and 1 so hills don't look like sharp stairs.
  function fade(t) {
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Smooth random value at any x, y point.
  function noise2(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = fade(x - x0);
    const fy = fade(y - y0);
    const a = lerp(hash(x0, y0), hash(x0 + 1, y0), fx);
    const b = lerp(hash(x0, y0 + 1), hash(x0 + 1, y0 + 1), fx);
    return lerp(a, b, fy);
  }

  // Add several layers of noise together so you get both big hills and small bumps.
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

// Ease from 0 to 1 as x goes from edge0 to edge1. Useful for blending grass into rock.
export function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
