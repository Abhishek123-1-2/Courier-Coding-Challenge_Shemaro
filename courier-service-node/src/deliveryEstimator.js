'use strict';

// Time is floored to 2 decimals at each leg (not rounded) - that's what
// lines up with the sample output (100/70 -> 1.42, not 1.43).
function oneWayTime(distance, speed) {
  return Math.floor((distance / speed) * 100) / 100;
}

// Picks the best shipment for one vehicle out of the packages still
// waiting: most packages first, then heaviest total, then soonest to
// finish. Brute-forces subsets with a weight prune - plenty fast for the
// batch sizes this challenge deals with. For much bigger fleets this is
// the spot to swap in a proper knapsack DP.
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
      deliveryTimes.set(pkg.id, null); // can't ever fit on any vehicle
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
