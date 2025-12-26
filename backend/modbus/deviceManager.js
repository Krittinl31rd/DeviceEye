import { ModbusClient } from "./client.js";
import { PollingScheduler } from "./scheduler.js";


export class DeviceManager {
  constructor({ onChange } = {}) {
    this.devices = new Map();
    this.onChange = onChange;
  }

  addDevice(device) {
    console.log('[DEVICE] ADD', device.ip);
    const client = new ModbusClient(device.ip, device.port);
    const scheduler = new PollingScheduler(client, device.ip);

    device.tags.forEach(tag => {
      scheduler.addTag({
        ...tag,
        onRead: ({ data, ts }) => {
          if (data.length > 0) {
            const changes = {
              ip: device.ip,
              unitId: tag.unitId,
              fc: tag.fc,
              start: tag.start,
              data,
              ts
            }
            // console.log('[CHANGE]', changes);
            this.onChange?.(changes);
            //  broadcast WS / save DB
          }
        },

        onError: (err) => {
          console.error('[ERROR]', tag.id, err);
        }
      });
    });

    scheduler.start();
    this.devices.set(device.ip, { client, scheduler });
  }

  removeDevice(ip) {
    const d = this.devices.get(ip);
    d?.scheduler.stop();
    this.devices.delete(ip);
  }
}
