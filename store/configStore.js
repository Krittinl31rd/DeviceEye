import fs from "fs";
import path from "path";
import { app } from "electron";

/* ===== PATH ===== */
const STORE_DIR = path.join(app.getPath("userData"), "store");
const FILE = path.join(STORE_DIR, "config.json");

/* ===== UTILS ===== */
function ensureDir() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function ensureConfigShape(config) {
  if (!config || typeof config !== "object") {
    return { devices: [] };
  }

  if (!Array.isArray(config.devices)) {
    config.devices = [];
  }

  return config;
}

/* ===== CORE ===== */
export function loadConfig() {
  ensureDir();

  if (!fs.existsSync(FILE)) {
    const init = { devices: [] };
    fs.writeFileSync(FILE, JSON.stringify(init, null, 2));
    return init;
  }

  const raw = JSON.parse(fs.readFileSync(FILE, "utf-8"));
  return ensureConfigShape(raw);
}

export function saveConfig(config) {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(config, null, 2));
}

/* ===== CRUD ===== */
export function addConfig(data) {
  const config = loadConfig();

  const exists = config.devices.find(dev => dev.ip === data.ip);
  if (exists) return false;

  config.devices.push(data);
  saveConfig(config);
  return true;
}

export function removeConfig(ip) {
  const config = loadConfig();

  const before = config.devices.length;
  config.devices = config.devices.filter(dev => dev.ip !== ip);

  if (before === config.devices.length) return false;

  saveConfig(config);
  return true;
}

export function updateConfig(data) {
  const config = loadConfig();

  const index = config.devices.findIndex(dev => dev.ip === data.ip);
  if (index === -1) return false;

  config.devices[index] = {
    ...config.devices[index],
    ...data,
  };

  saveConfig(config);
  return true;
}
