import { DeviceManager } from "../backend/modbus/deviceManager.js";
import { addConfig, loadConfig, removeConfig, updateConfig } from "../store/configStore.js";

let manager = null;

function ensureManager(mainWindow) {
  if (!manager) {
    manager = new DeviceManager({
      onChange: changes => {
        mainWindow.webContents.send("modbus:change", changes);
      },
      onStatus: status => {
        mainWindow.webContents.send("modbus:status", status);
      }
    });
  }
}

export function startModbus(mainWindow) {
  ensureManager(mainWindow);

  if (manager.running) {
    return { running: manager?.running, status: "already_running" };
  }

  manager.loadDevices(loadConfig().devices);
  manager.startAll();

  return { running: manager?.running, status: "started" };
}

export function stopModbus() {
  if (!manager || !manager.running) {
    return { running: manager?.running, status: "already_stopped" };
  }

  manager.stopAll();
  return { running: manager?.running, status: "stopped" };
}


export function addModbus(device) {
  if (manager?.running) {
    return {
      running: manager.running,
      status: "blocked",
      message: "Stop Modbus before adding device"
    };
  }

  const isSuccess = addConfig(device);
  if (!isSuccess) return { status: "warning", message: "this device is already" };

  return { status: "saved", message: "adding device success" };
}

export function removeModbus(ip) {
  if (manager?.running) {
    return {
      running: manager.running,
      status: "blocked",
      message: "Stop Modbus before removing device"
    };
  }

  const isSuccess = removeConfig(ip);
  if (!isSuccess) return { status: "warning", message: "not found device this ip" };

  return { status: "saved", message: "deleting device success" };
}

export function updateModbus(device) {
  if (manager?.running) {
    return {
      status: "blocked",
      message: "Stop Modbus before editing device"
    };
  }

  const isSuccess = updateConfig(device);
  if (!isSuccess) return { status: "warning", message: "not found device this ip" };

  return { status: "saved", message: "updating device success" };
}


export async function writeModbus(payload) {

  if (!manager || !manager.running) {
    throw new Error("Modbus is not running");
  }

  const { ip, unitId, fc } = payload;

  const device = manager.devices.get(ip);
  if (!device) {
    throw new Error("Device not found");
  }

  const client = device.client;

  switch (fc) {
    // Write Single Coil
    case 5:
      await client.writeSingle(
        unitId,
        5,
        payload.address,
        payload.value ? 1 : 0
      );
      break;

    // Write Single Holding Register
    case 6:
      await client.writeSingle(
        unitId,
        6,
        payload.address,
        Number(payload.value)
      );
      break;

    // Write Multiple Coil
    case 15:
      await client.writeMulti(
        unitId,
        15,
        payload.start,
        payload.values
      );
      break;

    // Write Multiple Holding Registers
    case 16:
      await client.writeMulti(
        unitId,
        16,
        payload.start,
        payload.values.map(Number)
      );
      break;

    default:
      throw new Error(`FC ${fc} is not writable`);
  }

  return { success: true, status: "ok", message: `Write ID ${unitId} | FC ${fc} | Addr ${payload.address} | Value ${payload.value}` };
}
