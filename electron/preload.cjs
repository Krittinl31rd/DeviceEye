const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("modbusAPI", {
  start: () => ipcRenderer.invoke("modbus:start_all"),
  stopAll: () => ipcRenderer.invoke("modbus:stop_all"),
  onChange: (callback) => {
    ipcRenderer.on("modbus:change", (_, data) => callback(data));
  },
  onStatus: (callback) => {
    ipcRenderer.on("modbus:status", (_, data) => callback(data));
  },
  writeModbus: (payload) => ipcRenderer.invoke("modbus:write", payload),

  getConfig: () => ipcRenderer.invoke("modbus:config"),
  addConfig: (data) => ipcRenderer.invoke("modbus:add_config", data),
  removeConfig: (ip) => ipcRenderer.invoke("modbus:remove_config", ip),
  updateConfig: (data) => ipcRenderer.invoke("modbus:update_config", data),

});
