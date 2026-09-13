'use strict';

const { getDiscountPercent } = require('./offers');

function calculateBaseDeliveryCost(baseDeliveryCost, weight, distance) {
  return baseDeliveryCost + weight * 10 + distance * 5;
}

function processPackage(baseDeliveryCost, pkg) {
  const cost = calculateBaseDeliveryCost(baseDeliveryCost, pkg.weight, pkg.distance);
  const discountPercent = getDiscountPercent(pkg.offerCode, pkg.weight, pkg.distance);
  const discount = (cost * discountPercent) / 100;

  return { discount, totalCost: cost - discount };
}

module.exports = { calculateBaseDeliveryCost, processPackage };
