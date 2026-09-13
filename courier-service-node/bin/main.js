#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const { parseInput, InputValidationError } = require('../src/inputParser');
const { processPackage } = require('../src/costCalculator');
const { scheduleDeliveries } = require('../src/deliveryEstimator');

function formatAmount(value) {
  const rounded = Math.round(value * 100) / 100;
  return String(parseFloat(rounded.toFixed(2)));
}

function readInput(argv) {
  const filePath = argv[2];
  if (filePath) {
    return fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
  }
  return fs.readFileSync(0, 'utf8');
}

function main() {
  let rawInput;
  try {
    rawInput = readInput(process.argv);
  } catch (err) {
    console.error(`Could not read input: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  let parsed;
  try {
    parsed = parseInput(rawInput);
  } catch (err) {
    if (!(err instanceof InputValidationError)) throw err;
    console.error(`Invalid input: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const { baseDeliveryCost, packages, vehicleFleet } = parsed;

  const costResults = new Map(
    packages.map((pkg) => [pkg.id, processPackage(baseDeliveryCost, pkg)])
  );

  const deliveryTimes = vehicleFleet ? scheduleDeliveries(packages, vehicleFleet) : null;

  const lines = packages.map((pkg) => {
    const { discount, totalCost } = costResults.get(pkg.id);
    const row = [pkg.id, formatAmount(discount), formatAmount(totalCost)];

    if (deliveryTimes) {
      const time = deliveryTimes.get(pkg.id);
      if (time === null) {
        console.error(`Warning: ${pkg.id} (${pkg.weight}kg) is heavier than any vehicle's limit (${vehicleFleet.maxWeight}kg) and can't be delivered.`);
        row.push('NA');
      } else {
        row.push(time.toFixed(2));
      }
    }

    return row.join(' ');
  });

  console.log(lines.join('\n'));
}

main();
