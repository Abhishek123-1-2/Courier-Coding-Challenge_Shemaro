'use strict';

class Package {
  constructor(id, weight, distance, offerCode) {
    this.id = id;
    this.weight = weight;
    this.distance = distance;
    this.offerCode = offerCode;
  }
}

class Vehicle {
  constructor(id) {
    this.id = id;
    this.availableAt = 0;
  }
}

module.exports = { Package, Vehicle };
