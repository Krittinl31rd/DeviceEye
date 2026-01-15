import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import {
  startModbus,
  stopModbus,
  addModbus,
  removeModbus,
  updateModbus,
  writeModbus
} from "../services/modbusService.js";
import { loadConfig } from "../store/configStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.webContents.openDevTools();

  // DEV
  mainWindow.loadURL("http://localhost:5173");

  // PROD (ตอน build)
  // mainWindow.loadFile(path.join(__dirname, "../renderer/dist/index.html"));
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("modbus:start_all", () => {
  return startModbus(mainWindow);
});

ipcMain.handle("modbus:stop_all", () => {
  return stopModbus()
});

ipcMain.handle("modbus:config", () => {
  return loadConfig();
});

ipcMain.handle("modbus:add_config", (_, data) => {
  return addModbus(data);
});

ipcMain.handle("modbus:remove_config", (_, ip) => {
  return removeModbus(ip);
});

ipcMain.handle("modbus:update_config", (_, data) => {
  return updateModbus(data);
});

ipcMain.handle("modbus:write", (_, payload) => {
  return writeModbus(payload);
});
