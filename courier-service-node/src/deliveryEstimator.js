'use strict';

function oneWayTime(distance, speed) {
  return Math.floor((distance / speed) * 100) / 100;
}

function findBestShipment(packages, maxWeight) {
  const candidates = packages
    .map((pkg, idx) => ({ pkg, idx }))
    .filter(({ pkg }) => pkg.weight <= maxWeight);

  if (candidates.length === 0) return null;

  let best = null;

  function tryCombo(indices, weight, maxDist) {
    if (indices.length === 0) return;
    if (
      !best ||
      indices.length > best.indices.length ||
      (indices.length === best.indices.length && weight > best.weight) ||
      (indices.length === best.indices.length && weight === best.weight && maxDist < best.maxDist)
    ) {
      best = { indices: [...indices], weight, maxDist };
    }
  }

  function recurse(start, indices, weight, maxDist) {
    tryCombo(indices, weight, maxDist);
    for (let i = start; i < candidates.length; i++) {
      const { pkg } = candidates[i];
      if (weight + pkg.weight > maxWeight) continue;
      indices.push(candidates[i].idx);
      recurse(i + 1, indices, weight + pkg.weight, Math.max(maxDist, pkg.distance));
      indices.pop();
    }
  }

  recurse(0, [], 0, 0);
  return best;
}

function scheduleDeliveries(packages, { count, maxSpeed, maxWeight }) {
  const deliveryTimes = new Map();

  const deliverable = [];
  for (const pkg of packages) {
    if (pkg.weight > maxWeight) {
      deliveryTimes.set(pkg.id, null); 
    } else {
      deliverable.push(pkg);
    }
  }

  let remaining = deliverable;
  const vehicles = Array.from({ length: count }, (_, i) => ({ id: i + 1, availableAt: 0 }));

  while (remaining.length > 0) {
    vehicles.sort((a, b) => a.availableAt - b.availableAt || a.id - b.id);
    const vehicle = vehicles[0];

    const { indices, maxDist } = findBestShipment(remaining, maxWeight);
    const legTime = oneWayTime(maxDist, maxSpeed);

    for (const idx of indices) {
      const pkg = remaining[idx];
      deliveryTimes.set(pkg.id, vehicle.availableAt + oneWayTime(pkg.distance, maxSpeed));
    }

    vehicle.availableAt += 2 * legTime;

    const taken = new Set(indices);
    remaining = remaining.filter((_, idx) => !taken.has(idx));
  }

  return deliveryTimes;
}

module.exports = { scheduleDeliveries, findBestShipment, oneWayTime };
