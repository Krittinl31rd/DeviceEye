import { ModbusClient } from "./client.js";
import { PollingScheduler } from "./scheduler.js";

export class DeviceManager {
  constructor({ onChange, onStatus } = {}) {
    this.devices = new Map();
    this.status = new Map();
    this.onChange = onChange;
    this.onStatus = onStatus;
    this.running = false;
  }

  loadDevices(devices) {
    if (this.running) {
      throw new Error("Cannot modify devices while running");
    }

    this.devices.forEach(d => d.scheduler.stop());
    this.devices.clear();

    devices.forEach(device => {
      const client = new ModbusClient(device.ip, device.port);

      client.on('state', status => {
        this.status.set(device.ip, status);
        this.onStatus?.(status);
      });

      const scheduler = new PollingScheduler(client, device.ip);

      device.tags.forEach(tag => {
        scheduler.addTag({
          ...tag,
          onRead: ({ data, ts }) => {
            if (data.length > 0) {
              this.onChange?.({
                ip: device.ip,
                unitId: tag.unitId,
                fc: tag.fc,
                start: tag.start,
                data,
                ts
              });
            }
          }
        });
      });

      this.devices.set(device.ip, { client, scheduler });
    });
  }

  getStatus(ip) {
    return this.status.get(ip);
  }

  startAll() {
    if (this.running) return;

    this.devices.forEach(d => d.scheduler.start());
    this.running = true;
    console.log("[MODBUS] START");
  }

  stopAll() {
    if (!this.running) return;

    this.devices.forEach(d => d.scheduler.stop());
    this.running = false;
    console.log("[MODBUS] STOP");
  }
}

