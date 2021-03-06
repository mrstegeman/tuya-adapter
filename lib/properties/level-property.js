'use strict';

const TuyaProperty = require('./tuya-property');
const remap = require('../helpers').remap;

class LevelProperty extends TuyaProperty {
  constructor(device, cnf) {
    super(device, 'level', {
      label: 'Level',
      type: 'integer',
      '@type': 'LevelProperty',
      value: 1,
      min: 0,
      max: 100,
      multipleOf: 0.1,
    }, cnf);

    if (!this.device.ownconf.minlevel || !this.device.ownconf.maxlevel) {
      if (!this.device.ownconf.minlevel) {
        console.info(this.id, 'Set minlevel to default 0');
        this.device.ownconf.minlevel = 0;
      }
      if (!this.device.ownconf.maxlevel) {
        console.info(this.id, 'Set maxlevel to default 1000');
        this.device.ownconf.maxlevel = 1000;
      }
      this.device.saveOwnConfig();
    }
  }

  update(value) {
    super.update(value);
    this.setCachedValueAndNotify(remap(value, this.device.ownconf.minlevel, this.device.ownconf.maxlevel, 0, 100, 0.1));
  }

  setValue(value) {
    return new Promise(((resolve) => {
      super.setValue(value).then((updatedValue) => {
        this.setTuyapi(updatedValue);
        resolve(updatedValue);
      }).catch(((err) => {
        if (err.startsWith('Value is not a multiple of: ')) {
          const val = Math.round(value/0.1)*0.1;
          this.setTuyapi(val);
          this.setCachedValueAndNotify(val);
          resolve(val);
        } else {
          console.error(this.id, 'Error during setValue', err);
        }
      }).bind(this));
    }).bind(this));
  }

  setTuyapi(value) {
    const v = remap(value, 0, 100, this.device.ownconf.minlevel, this.device.ownconf.maxlevel, 1);
    const cmd = {dps: this.dps, set: v};
    console.debug(this.id, 'Execute tuyapi command', cmd);
    this.device.tuyapi.set(cmd);
    return v;
  }

  autodps(obj) {
    return Object.keys(obj).find((x) => (typeof (obj[x]) === 'number'));
  }
}

module.exports = LevelProperty;
