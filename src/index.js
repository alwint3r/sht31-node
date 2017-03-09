'use strict';

const Promise = require(`bluebird`);
const i2c = require(`i2c`);
const utils = require(`./utils`);

const SHT31_SOFTRESET = 0x30A2;
const SHT31_MEAS_HIGHREP = 0x2400;

class SHT31 {
  constructor(address, deviceNo) {
    this.address = address || 0x44;
    this.deviceNo = (!deviceNo && deviceNo !== 0) ? 1 : deviceNo;
    this.deviceFile = `/dev/ic2-${deviceNo}`;
    this.wire = utils.createWire(this.address, {
      device: this.deviceFile,
    });
  }

  writeCommand(cmd) {
    return this.wire.writeAsync([cmd >> 8, cmd & 0xFF]);
  }

  reset() {
    return this.writeCommand(SHT31_SOFTRESET);
  }

  init() {
    return this.reset().then(() => utils.delay(10));
  }

  readSensorData() {
    return this.writeCommand(SHT31_MEAS_HIGHREP)
      .then(() => utils.delay(500))
      .then(() => this.wire.readAsync(6))
      .then((read) => {
        let rawTemperature;
        let rawHumidity;

        rawTemperature = read[0];
        rawTemperature = rawTemperature << 8;
        rawTemperature = rawTemperature | read[1];

        if (read[2] !== utils.crc8(read.slice(0, 2))) {
          return Promise.reject(new Error(`Invalid CRC data!`));
        }

        rawHumidity = read[3];
        rawHumidity = rawHumidity << 8;
        rawHumidity = rawHumidity | read[4];

        if (read[5] !== utils.crc8(read.slice(3, 5))) {
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
