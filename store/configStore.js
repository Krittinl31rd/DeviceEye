import fs from 'fs';

const FILE = './store/config.json';

function ensureConfigShape(config) {
  if (!config || typeof config != "object") {
    return { devices: [] };
  }

  if (!Array.isArray(config.devices)) {
    config.devices = [];
  }

  return config;
}

export function saveConfig(config) {
  fs.writeFileSync(FILE, JSON.stringify(config, null, 2));
}

export function loadConfig() {
  if (!fs.existsSync(FILE)) {
    return { devices: [] };
  }

  const raw = JSON.parse(fs.readFileSync(FILE, "utf-8"));
  return ensureConfigShape(raw);
}


export function addConfig(data) {
  const config = loadConfig();

  const isAlready = config.devices.find(
    (dev) => dev.ip == data.ip
  );

  if (isAlready) {
    return false;
  }

  config.devices.push(data);
  saveConfig(config);

  return config;
}


export function removeConfig(ip) {
  const config = loadConfig();

  const isAlready = config.devices.find(
    (dev) => dev.ip == ip
  );

  if (!isAlready) {
    return false;
  }

  config.devices = config.devices.filter(
    (dev) => dev.ip != ip
  );

  saveConfig(config);
  return config;
}


export function updateConfig(data) {
  const config = loadConfig();

  const index = config.devices.findIndex(
    (dev) => dev.ip == data.ip
  );

  if (index == -1) {
    return false;
  }

  config.devices[index] = {
    ...config.devices[index], 
    ...data,                 
  };

  saveConfig(config);
  return true;
}


