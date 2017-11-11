'use strict';

const Promise = require(`bluebird`);
const utils = require(`./utils`);
const commands = require(`./commands`);

class SHT31 {
  constructor(address, deviceNo) {
    this.address = address || 0x44;
    this.deviceNo = (!deviceNo && deviceNo !== 0) ? 1 : deviceNo;
    this.deviceFile = `/dev/i2c-${deviceNo}`;
    this.wire = utils.createWire(this.address, {
      device: this.deviceFile,
    });
  }

  writeCommand(cmd) {
    return this.wire.writeAsync([cmd >> 8, cmd & 0xFF]);
  }

  reset() {
    return this.writeCommand(commands.SHT31_SOFTRESET);
  }

  init() {
    return this.reset().then(() => utils.delay(10));
  }

  readSensorData() {
    return this.writeCommand(commands.SHT31_MEAS_HIGHREP)
      .then(() => utils.delay(500))
      .then(() => this.wire.readAsync(6))
      .then((read) => {
        if (!read || !Array.isArray(read)) {
          return Promise.reject(new Error(`No data returned from sensor.`));
        }

        let rawTemperature;
        let rawHumidity;

        rawTemperature = read[0];
        rawTemperature <<= 8;
        rawTemperature |= read[1];

        if (read[2] !== utils.crc8(read.slice(0, 2))) {
          return Promise.reject(new Error(`Invalid CRC data!`));
        }

        rawHumidity = read[3];
        rawHumidity <<= 8;
        rawHumidity |= read[4];

        if (read[5] !== utils.crc8(read.slice(3, 5))) {
          return Promise.reject(new Error(`Invalid CRC data!`));
        }

        let temperature = rawTemperature;
        temperature *= 175;
        temperature /= 0xFFFF;
        temperature = -45 + temperature;

        let humidity = rawHumidity;
        humidity *= 100;
        humidity /= 0xFFFF;

        return {
          temperature,
          humidity,
        };
      });
  }

  readStatus() {
    return this.writeCommand(commands.SHT31_STATUS)
      .then(() => this.wire.readAsync(3))
      .then((read) => {

        if(read[2] !== utils.crc8(read.slice(0,2))) {
          return Promise.reject(new Error(`Invalid CRC data!`));
        }

        return {
          WriteStatus: !(read[1] & 0x01),
          CommandStatus: !(read[1] & 0x02),
          ResetDetected: !!(read[1] & 0x10),
          TempTrackingAlert: !!(read[0] & 0x04),
          RHTrackingAlert: !!(read[0] & 0x08),
          HeaterEnabled: !!(read[0] & 0x20),
          AlertPending: !!(read[0] & 0x80)
        };
      });
  }

  enableHeater(duration) {
    const cmd = this.writeCommand(commands.SHT31_HEATER_ON);
    if(duration) {
      return cmd
        .then(() => utils.delay(duration))
        .then(() => this.disableHeater());
    } else {
      return cmd;
    }
  }

  disableHeater(){
    return this.writeCommand(commands.SHT31_HEATER_OFF);
  }

}

module.exports = SHT31;
