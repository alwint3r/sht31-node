'use strict';

const Promise = require(`bluebird`);
const i2c = require(`i2c`);

function createWire(address, opt) {
  const instance = new i2c(address, opt);

  return Promise.promisifyAll(instance);
}

function writeCommand(wire, cmd) {
  return wire.writeAsync([cmd >> 8, cmd & 0xFF]);
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

/* command */

const SHT31_SOFTRESET = 0x30A2;
const SHT31_MEAS_HIGHREP = 0x2400;

class SHT31 {
  constructor(address = 0x44, deviceNo = 1) {
    this.wire = createWire(address, {
      device: `/dev/i2c-${deviceNo}`,
    });

    this.writeCommand = writeCommand.bind(this, this.wire);
  }

  reset() {
    return this.writeCommand(SHT31_SOFTRESET);
  }

  init() {
    return this.reset().then(() => this);
  }

  readSensorData() {
    return this.writeCommand(SHT31_MEAS_HIGHREP)
      .then(() => delay(500))
      .then(() => this.wire.readAsync(6))
      .then((read) => {
        let rawTemperature;
        let rawHumidity;

        rawTemperature = read[0];
        rawTemperature = rawTemperature << 8;
        rawTemperature = rawTemperature | read[1];

        if (read[2] !== crc8(read.slice(0, 2))) {
          return Promise.reject(new Error(`Invalid CRC data!`));
        }

        rawHumidity = read[3];
        rawHumidity = rawHumidity << 8;
        rawHumidity = rawHumidity | read[4];

        if (read[5] !== crc8(read.slice(3, 5))) {
          return Promise.reject(new Error(`Invalid CRC data!`));
        }

        let temperature = rawTemperature;
        temperature = temperature * 175;
        temperature = temperature / 0xFFFF;
        temperature = -45 + temperature;

        let humidity = rawHumidity;
        humidity = humidity * 100;
        humidity = humidity / 0xFFFF;

        return {
          temperature,
          humidity,
        };
      });
  }
}

module.exports = SHT31;
