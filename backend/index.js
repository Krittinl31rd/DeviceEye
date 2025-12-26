import { DeviceManager } from "./modbus/deviceManager.js";
import { loadConfig } from "../store/configStore.js";

const manager = new DeviceManager();

manager = new DeviceManager({
    onChange: (changes) => {
        console.log(changes)
    }
});

const config = loadConfig();
config.devices.forEach(d => manager.addDevice(d));


