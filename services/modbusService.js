import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { app } from "electron";

const isDev = !app.isPackaged;

function resolvePath(relativePath) {
  return isDev
    ? path.join(__dirname, "..", relativePath)
    : path.join(process.resourcesPath, relativePath);
}

/* ================= dynamic deps ================= */

let DeviceManager;
let OutboundSocket;
let configStore;
let socketStore;

async function loadDeps() {
  if (!DeviceManager) {
    ({ DeviceManager } = await import(
      pathToFileURL(
        resolvePath("backend/modbus/deviceManager.js")
      ).href
    ));
  }

  if (!OutboundSocket) {
    ({ OutboundSocket } = await import(
      pathToFileURL(
        resolvePath("services/socketClient.js")
      ).href
    ));
  }

  if (!configStore) {
    configStore = await import(
      pathToFileURL(
        resolvePath("store/configStore.js")
      ).href
    );
  }

  if (!socketStore) {
    socketStore = await import(
      pathToFileURL(
        resolvePath("store/socketConfig.js")
      ).href
    );
  }
}

/* ================= runtime ================= */

let manager = null;
let outbound = null;

async function ensureManager(mainWindow) {
  await loadDeps();

  if (!outbound) {
    outbound = new OutboundSocket({
      onStatus: status => {
        mainWindow.webContents.send("socket:status", status);
      }
    });

    outbound.connect(socketStore.loadSocketConfig());
  }

  if (!manager) {
    manager = new DeviceManager({
      socket: outbound,
      onChange: changes => {
        mainWindow.webContents.send("modbus:change", changes);

      },
      onStatus: status => {
        mainWindow.webContents.send("modbus:status", status);
      }
    });
  }
}

/* ================= API ================= */

export async function startModbus(mainWindow) {
  await ensureManager(mainWindow);

  if (manager.running) {
    return { running: manager.running, status: "already_running" };
  }

  outbound.connect(socketStore.loadSocketConfig());

  const cfg = configStore.loadConfig();
  manager.loadDevices(cfg.devices);
  manager.startAll();

  return { running: manager.running, status: "started" };
}

export function stopModbus() {
  if (!manager || !manager.running) {
    return { running: manager?.running, status: "already_stopped" };
  }

  manager.stopAll();
  return { running: manager.running, status: "stopped" };
}

export function stopSocket() {
  outbound?.disconnect();
  outbound = null;
}

export async function addModbus(device) {
  await loadDeps();

  if (manager?.running) {
    return {
      running: manager.running,
      status: "blocked",
      message: "Stop Modbus before adding device"
    };
  }

  const ok = configStore.addConfig(device);
  if (!ok) {
    return { status: "warning", message: "this device already exists" };
  }

  return { status: "saved", message: "adding device success" };
}

export async function removeModbus(ip) {
  await loadDeps();

  if (manager?.running) {
    return {
      running: manager.running,
      status: "blocked",
      message: "Stop Modbus before removing device"
    };
  }

  const ok = configStore.removeConfig(ip);
  if (!ok) {
    return { status: "warning", message: "device not found" };
  }

  return { status: "saved", message: "deleting device success" };
}

export async function updateModbus(device) {
  await loadDeps();

  if (manager?.running) {
    return {
      status: "blocked",
      message: "Stop Modbus before editing device"
    };
  }

  const ok = configStore.updateConfig(device);
  if (!ok) {
    return { status: "warning", message: "device not found" };
  }

  return { status: "saved", message: "updating device success" };
}

export async function writeModbus(payload) {
  if (!manager || !manager.running) {
    throw new Error("Modbus is not running");
  }

  const { ip, unitId, fc } = payload;
  const address = payload.address ?? payload.start;

  const device = manager.devices.get(ip);
  if (!device) {
    throw new Error("Device not found");
  }

  const client = device.client;

  switch (fc) {
    case 5:
      await client.writeSingle(unitId, 5, address, payload.value ? 1 : 0);
      break;

    case 6:
      await client.writeSingle(unitId, 6, address, Number(payload.value));
      break;

    case 15:
      await client.writeMultiCoil(
        unitId,
        address,
        payload.value.map(v => (v ? 1 : 0))
      );
      break;

    case 16:
      await client.writeMultiHolding(
        unitId,
        address,
        payload.value.map(Number)
      );
      break;

    default:
      throw new Error(`FC ${fc} is not writable`);
  }

  return {
    success: true,
    status: "ok",
    message: `Write ID ${unitId} | FC ${fc} | Addr ${address} = ${payload?.value}`
  };
}
