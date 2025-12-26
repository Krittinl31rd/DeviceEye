import fs from 'fs';

const FILE = './store/config.json';

export function saveConfig(config) {
  fs.writeFileSync(FILE, JSON.stringify(config, null, 2));
}

export function loadConfig() {
  if (!fs.existsSync(FILE)) return { devices: [] }; // คืนค่า default
  return JSON.parse(fs.readFileSync(FILE));
}


export function addConfig(data) {
  const config = loadConfig();
  config.devices.push(data);   // เพิ่ม device
  saveConfig(config);          // บันทึกกลับไฟล์
  return config;
}

export function removeConfig(ip) {
  const config = loadConfig();
  config.devices = config.devices.filter(dev => dev.ip !== ip);
  saveConfig(config);

  return config;
}

