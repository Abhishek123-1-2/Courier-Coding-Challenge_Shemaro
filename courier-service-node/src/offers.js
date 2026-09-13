'use strict';

// Add a new offer here and it just works everywhere else.
const OFFER_REGISTRY = {
  OFR001: { discount: 10, distMin: 0, distMax: 200, distMaxExclusive: true, weightMin: 70, weightMax: 200 },
  OFR002: { discount: 7, distMin: 50, distMax: 150, weightMin: 100, weightMax: 250 },
  OFR003: { discount: 5, distMin: 50, distMax: 250, weightMin: 10, weightMax: 150 },
};

function getDiscountPercent(offerCode, weight, distance) {
  const offer = OFFER_REGISTRY[offerCode];
  if (!offer) return 0;

  const distOk = offer.distMaxExclusive
    ? distance >= offer.distMin && distance < offer.distMax
    : distance >= offer.distMin && distance <= offer.distMax;
  const weightOk = weight >= offer.weightMin && weight <= offer.weightMax;

  return distOk && weightOk ? offer.discount : 0;
}

module.exports = { OFFER_REGISTRY, getDiscountPercent };
