import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { addModbus, removeModbus, startModbus, stopModbus } from "../services/modbusService.js";
import { loadConfig } from "../store/configStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    mainWindow.webContents.openDevTools();

    // DEV
    mainWindow.loadURL("http://localhost:5173");

    // PROD (ตอน build)
    // mainWindow.loadFile(path.join(__dirname, "../renderer/dist/index.html"));
});


ipcMain.handle("modbus:start", () => {
    return startModbus(win);
});

ipcMain.handle("modbus:stop", (_, ip) => {
    return stopModbus(ip);
});

ipcMain.handle("modbus:config", () => {
    return loadConfig()
})

ipcMain.handle("modbus:add_config", (_, data) => {
    return addModbus(data)
})

ipcMain.handle("modbus:remove_config", (_, ip) => {
    return removeModbus(ip)
})
