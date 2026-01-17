import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
// import {
//   startModbus,
//   stopModbus,
//   addModbus,
//   removeModbus,
//   updateModbus,
//   writeModbus
// } from "../services/modbusService.js";
// import { loadConfig } from "../store/configStore.js";
// import { loadSocketConfig, saveSocketConfig } from "../store/socketConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
const isDev = !app.isPackaged;

let modbus;
let configStore;
let socketStore;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // build แล้ว
    mainWindow.loadFile(
      path.join(__dirname, "../renderer/dist/index.html")
    );
  }

});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function getResourcePath(relativePath) {
  return isDev
    ? path.join(__dirname, "..", relativePath)
    : path.join(process.resourcesPath, relativePath);
}

async function loadBackend() {
  if (!modbus) {
    modbus = await import(
      pathToFileURL(getResourcePath("services/modbusService.js")).href
    );
  }

  if (!configStore) {
    configStore = await import(
      pathToFileURL(getResourcePath("store/configStore.js")).href
    );
  }

  if (!socketStore) {
    socketStore = await import(
      pathToFileURL(getResourcePath("store/socketConfig.js")).href
    );
  }
}

ipcMain.handle("modbus:start_all", async () => {
  await loadBackend();
  return modbus.startModbus(mainWindow);
});

ipcMain.handle("modbus:stop_all", async () => {
  await loadBackend();
  return modbus.stopModbus();
});

ipcMain.handle("modbus:config", async () => {
  await loadBackend();
  return configStore.loadConfig();
});

ipcMain.handle("modbus:add_config", async (_, data) => {
  await loadBackend();
  return modbus.addModbus(data);
});

ipcMain.handle("modbus:remove_config", async (_, ip) => {
  await loadBackend();
  return modbus.removeModbus(ip);
});

ipcMain.handle("modbus:update_config", async (_, data) => {
  await loadBackend();
  return modbus.updateModbus(data);
});

ipcMain.handle("modbus:write", async (_, payload) => {
  await loadBackend();
  return modbus.writeModbus(payload);
});

ipcMain.handle("socket:config", async () => {
  await loadBackend();
  return socketStore.loadSocketConfig();
});

ipcMain.handle("socket:save", async (_, payload) => {
  await loadBackend();
  return socketStore.saveSocketConfig(payload);
});


