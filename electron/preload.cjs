const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("modbusAPI", {
  start: () => ipcRenderer.invoke("modbus:start"),
  stop: (ip) => ipcRenderer.invoke("modbus:stop", ip),
  onChange: (callback) => {
    ipcRenderer.on("modbus:change", (_, data) => callback(data));
  },

  getConfig: () => ipcRenderer.invoke("modbus:config"),
  addConfig: (data) => ipcRenderer.invoke("modbus:add_config", data),
  removeConfig: (ip) => ipcRenderer.invoke("modbus:remove_config", ip),
});
