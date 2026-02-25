import fs from "fs";
import path from "path";
import { app } from "electron";

/* ===== PATH ===== */
const STORE_DIR = path.join(app.getPath("userData"), "store");
const FILE = path.join(STORE_DIR, "socket.config.json");

/* ===== DEFAULT ===== */
const defaultConfig = {
  url: "http://localhost:3000",
  token: "",
  enabled: false,
};

/* ===== UTILS ===== */
function ensureDir() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

/* ===== CORE ===== */
export function loadSocketConfig() {
  ensureDir();

  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify(defaultConfig, null, 2));
    return { ...defaultConfig };
  }

  return {
    ...defaultConfig,
    ...JSON.parse(fs.readFileSync(FILE, "utf8")),
  };
}

export function saveSocketConfig(cfg) {
  ensureDir();
  fs.writeFileSync(
    FILE,
    JSON.stringify({ ...defaultConfig, ...cfg }, null, 2)
  );

  return { status: "saved", message: "Save socket success" };
}
