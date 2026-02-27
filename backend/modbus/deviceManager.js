// import { ModbusClient } from "./client.js";
// import { PollingScheduler } from "./scheduler.js";

// export class DeviceManager {
//   constructor({ onChange, onStatus, socket } = {}) {
//     this.devices = new Map();
//     this.status = new Map();
//     this.onChange = onChange;
//     this.onStatus = onStatus;
//     this.running = false;
//     this.socket = socket;
//     this.allowReconnect = true;
//   }

//   loadDevices(devices) {
//     if (this.running) {
//       throw new Error("Cannot modify devices while running");
//     }

//     this.devices.forEach(d => d.scheduler.stop());
//     this.devices.clear();

//     devices.forEach(device => {
//       const client = new ModbusClient(device.ip, device.port);

//       client.on("state", status => {
//         const payload = {
//           ip: device.ip,
//           ...status
//         };
//         this.status.set(device.ip, payload);
//         this.onStatus?.(payload);
//         this.socket?.send("modbus:status", payload);
//       });


//       const scheduler = new PollingScheduler(client, device.ip);

//       device.tags.forEach(tag => {
//         scheduler.addTag({
//           ...tag,
//           onRead: ({ data, ts }) => {
//             if (data.length > 0) {
//               const payload = {
//                 ip: device.ip,
//                 unitId: tag.unitId,
//                 fc: tag.fc,
//                 start: tag.start,
//                 data: data.map(d => ({
//                   address: Number(d.address),
//                   value: Number(d.value),
//                 })),
//                 ts
//               }
//               this.onChange?.(payload);
//               this.socket?.send("modbus:data", payload);
//             }
//           }
//         });
//       });

//       this.devices.set(device.ip, { client, scheduler });
//     });
//   }

//   getStatus(ip) {
//     return this.status.get(ip);
//   }

//   startAll() {
//     if (this.running) return;

//     this.devices.forEach(d => d.scheduler.start());
//     this.running = true;
//     console.log("[MODBUS] START");
//   }

//   stopAll() {
//     if (!this.running) return;

//     this.devices.forEach(d => {
//       d.scheduler.stop()
//       d.client?.disconnect?.();
//     });

//     this.status.clear();
//     this.running = false;

//     this.socket?.disconnect?.();

//     console.log("[MODBUS] STOP");
//   }

// }

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

    // stop + destroy ของเก่าให้หมด
    this.devices.forEach(d => {
      d.scheduler.stop();
      d.client?.disconnect?.();
    });

    this.devices.clear();

    devices.forEach(device => {

      const client = new ModbusClient(device.ip, device.port);

      const scheduler = new PollingScheduler(client, device.ip);

      client.on("state", status => {
        const payload = {
          ip: device.ip,
          ...status
        };

        this.status.set(device.ip, payload);
        this.onStatus?.(payload);
        this.socket?.send("modbus:status", payload);
      });

      device.tags.forEach(tag => {
        scheduler.addTag({
          ...tag,
          onRead: ({ data, ts }) => {
            if (!this.running) return; // ✅ ป้องกันยิงตอน stop

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
              };

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

    this.running = true;

    this.devices.forEach(d => {
      // ✅ เปิด reconnect ก่อน start
      d.client?.enableReconnect?.(true);
      d.scheduler.start();
    });

    console.log("[MODBUS] START");
  }

  stopAll() {
    if (!this.running) return;

    this.running = false;

    this.devices.forEach(d => {
      // ✅ ปิด reconnect ก่อน
      d.client?.enableReconnect?.(false);

      d.scheduler.stop();
      d.client?.disconnect?.();
    });

    this.status.clear();
    this.socket?.disconnect?.();

    console.log("[MODBUS] STOP");
  }
}