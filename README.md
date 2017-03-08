SHT31 Library for Node.js
=========================

Read temperature and humidity from SHT31 via i2c on a Raspberry Pi.


## Usage

```js
const SHT31 = require(`sht31`);
const sht31 = new SHT31(0x44, 1); // address: 0x44, device = /dev/i2c-1

sht31
  .init()
  .then(() => sht31.readSensorData())
  .then((data) => {
    console.log(data);
  })
  .catch((err) => {
    // ...
    // Handle errors
  });
```
