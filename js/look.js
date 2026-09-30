// Helpers for "can the player see this spot right now?"
// Horror events use this so they only change things outside the view.

// True when the spot is in front of the player, inside a wide view cone.
export function lookingAt(player, x, z, cone = 0.35) {
  const dx = x - player.x;
  const dz = z - player.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 0.8) return true;

  const forwardX = -Math.sin(player.yaw);
  const forwardZ = -Math.cos(player.yaw);
  return (dx / distance) * forwardX + (dz / distance) * forwardZ > cone;
}

// True when the spot is behind the player and not in the same cell.
export function behindPlayer(player, world, x, z) {
  const here = world.cellAt(player.x, player.z);
  const there = world.cellAt(x, z);
  if (here.c === there.c && here.r === there.r) return false;
  return !lookingAt(player, x, z, 0.15);
}
