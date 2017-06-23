SHT31 Library for Node.js
=========================

Read temperature and humidity from SHT31 via i2c on a Raspberry Pi.

## Requirements

* Have Node v6 or newer installed.
* I2C enabled. See [this link](https://learn.sparkfun.com/tutorials/raspberry-pi-spi-and-i2c-tutorial) for more information about enabling I2C on Raspberry Pi.

## Installation

```bash
npm install --save sht31
```

or if you're using yarnpkg

```bash
yarnpkg add sht31
```

## Usage Example

```js
const SHT31 = require(`sht31`);

// NOTE: you might need to change the I2C bus number or
// SHT31 address.
// In this case, SHT31 address is 0x44
// and I2C bus number is 1
const sht31 = new SHT31(0x44, 1); 

sht31
  .init()
  .then(() => sht31.readSensorData())
  .then((data) => {
    // data object follows this format:
    // { temperature: Number, humidity: Number }
    // temperature is in celcius unit.
    console.log(data);
  })
  .catch((err) => {
    // Handle error here
    // ...
  });
```
