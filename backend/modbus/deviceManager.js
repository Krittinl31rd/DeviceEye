import { ModbusClient } from "./client.js";
import { PollingScheduler } from "./scheduler.js";

export class DeviceManager {
  constructor({ onChange, onStatus, socket } = {}) {
    this.devices = new Map();
    this.status = new Map();
    this.onChange = onChange;
    this.onStatus = onStatus;
    this.running = false;
    this.socket = socket;
  }

  loadDevices(devices) {
    if (this.running) {
      throw new Error("Cannot modify devices while running");
    }

    this.devices.forEach(d => d.scheduler.stop());
    this.devices.clear();

    devices.forEach(device => {
      const client = new ModbusClient(device.ip, device.port);

      client.on("state", status => {
        const payload = {
          ip: device.ip,
          ...status
        };
        this.status.set(device.ip, payload);
        this.onStatus?.(payload);
        this.socket?.send("modbus:status", payload);
      });


      const scheduler = new PollingScheduler(client, device.ip);

      device.tags.forEach(tag => {
        scheduler.addTag({
          ...tag,
          onRead: ({ data, ts }) => {
            if (data.length > 0) {
              const payload = {
                ip: device.ip,
                unitId: tag.unitId,
                fc: tag.fc,
                start: tag.start,
                data: data.map(d => ({
                  address: Number(d.address),
                  value: Number(d.value),
                })),
                ts
              }
              this.onChange?.(payload);
              this.socket?.send("modbus:data", payload);
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

    this.devices.forEach(d => {
      d.scheduler.stop()
      d.client?.disconnect?.();
    });

    this.status.clear();
    this.running = false;

    this.socket?.disconnect?.();

    console.log("[MODBUS] STOP");
  }

}

