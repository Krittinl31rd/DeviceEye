import { BrowserWindow } from "electron";
import { DeviceManager } from "../backend/modbus/deviceManager.js"
import { addConfig, loadConfig, removeConfig } from "../store/configStore.js"

let manager = null

export function startModbus(mainWindow) {
    if (manager) {
        return { status: "already_running" };
    }

    manager = new DeviceManager({
        onChange: (changes) => {
            console.log(changes)
            mainWindow.webContents.send("modbus:change", changes);
        }
    });

    const config = loadConfig();
    config.devices.forEach(d => manager.addDevice(d));

    return { status: "started", devices: config.devices.length };
}

export function stopModbus(ip) {
    if (!manager) return { status: "not_running" };

    manager.removeDevice(ip)
    manager = null;
    return { status: "stopped" };
}


export function addModbus(data) {
    addConfig(data)
    if (!manager) return { status: "not_running" };
    manager.addDevice(data);
    return { status: "started", message: `add ${data.ip} success` };
}

export function removeModbus(ip) {
    const dev = removeConfig(ip)
    if (!manager) return { status: "not_running", dev };
    manager.removeDevice(ip);
    return { status: "started", message: `remove ${data.ip} success` };
}





// {
//       "ip": "127.0.0.1",
//       "port": 502,
//       "tags": [
//         {
//           "id": "Control-Devices",
//           "unitId": 1,
//           "fc": 3,
//           "start": 0,
//           "length": 100,
//           "interval": 1000,
//           "enabled": true
//         },
//         {
//           "id": "Meter",
//           "unitId": 2,
//           "fc": 2,
//           "start": 0,
//           "length": 10,
//           "interval": 1000,
//           "enabled": true
//         }
//       ]
//     }