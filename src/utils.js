'use strict';

const Promise = require(`bluebird`);
const i2c = require(`i2c`);

function createWire(address, opt) {
  const instance = new i2c(address, opt);

  return Promise.promisifyAll(instance);
}

function crc8(data) {
  const length = data.length;
  const POLYNOMIAL = 0x31; // x8 + x5 + x4 + 1
  let crc = 0xFF; // initial data
  let idx = 0;

  for (let j = length; j > 0; --j) {
    crc ^= data[idx];
    idx = idx + 1;

    for (let i = 8; i > 0; --i) {
      crc = (crc & 0x80)
        ? (crc << 1) ^ POLYNOMIAL
        : (crc << 1);
      crc = crc & 255;
    }
  }

  return crc;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), ms);
  });
}

module.exports = {
  crc8,
  createWire,
  delay
};