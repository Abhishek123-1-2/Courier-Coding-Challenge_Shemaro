'use strict';

const { Package } = require('./models');

class InputValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputValidationError';
  }
}

function toNumber(token, field, { allowZero = true } = {}) {
  if (token === '' || Number.isNaN(Number(token))) {
    throw new InputValidationError(`${field} must be a number, got "${token}"`);
  }
  const value = Number(token);
  if (value < 0 || (!allowZero && value <= 0)) {
    throw new InputValidationError(`${field} must be ${allowZero ? 'non-negative' : 'greater than 0'}, got "${token}"`);
  }
  return value;
}

function toPositiveInt(token, field) {
  if (!/^\d+$/.test(token) || Number(token) <= 0) {
    throw new InputValidationError(`${field} must be a positive integer, got "${token}"`);
  }
  return Number(token);
}

function parseInput(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new InputValidationError('Input is empty.');
  }

  const header = lines[0].split(/\s+/);
  if (header.length !== 2) {
    throw new InputValidationError(`First line must be "base_delivery_cost no_of_packages", got "${lines[0]}"`);
  }
  const baseDeliveryCost = toNumber(header[0], 'base_delivery_cost');
  const noOfPackages = toPositiveInt(header[1], 'no_of_packages');

  if (lines.length < 1 + noOfPackages) {
    throw new InputValidationError(`Expected ${noOfPackages} package line(s) but only found ${lines.length - 1}.`);
  }

  const packages = [];
  const seenIds = new Set();

  for (let i = 0; i < noOfPackages; i++) {
    const line = lines[1 + i];
    const tokens = line.split(/\s+/);
    if (tokens.length !== 4) {
      throw new InputValidationError(`Package line ${i + 1} must have 4 fields, got "${line}"`);
    }
    const [pkgId, weightToken, distanceToken, offerCode] = tokens;

    if (seenIds.has(pkgId)) {
      throw new InputValidationError(`Duplicate package id "${pkgId}".`);
    }
    seenIds.add(pkgId);

    const weight = toNumber(weightToken, `weight for ${pkgId}`, { allowZero: false });
    const distance = toNumber(distanceToken, `distance for ${pkgId}`);

    packages.push(new Package(pkgId, weight, distance, offerCode));
  }

  const remaining = lines.slice(1 + noOfPackages);
  let vehicleFleet = null;

  if (remaining.length > 0) {
    if (remaining.length > 1) {
      throw new InputValidationError(`Unexpected extra line(s) after the vehicle line: ${JSON.stringify(remaining.slice(1))}`);
    }
    const [countToken, speedToken, weightToken] = remaining[0].split(/\s+/);
    if (!countToken || !speedToken || !weightToken || remaining[0].split(/\s+/).length !== 3) {
      throw new InputValidationError(`Vehicle line must have 3 fields "no_of_vehicles max_speed max_carriable_weight", got "${remaining[0]}"`);
    }
    vehicleFleet = {
      count: toPositiveInt(countToken, 'no_of_vehicles'),
      maxSpeed: toNumber(speedToken, 'max_speed', { allowZero: false }),
      maxWeight: toNumber(weightToken, 'max_carriable_weight', { allowZero: false }),
    };
  }

  return { baseDeliveryCost, packages, vehicleFleet };
}

module.exports = { parseInput, InputValidationError };
