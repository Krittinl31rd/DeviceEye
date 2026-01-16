import fs from "fs";

const FILE = "./store/socket.config.json";


const defaultConfig = {
    url: "http://localhost:3000",
    token: "",
    enabled: false
};

export function loadSocketConfig() {
    if (!fs.existsSync(FILE)) return defaultConfig;
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

export function saveSocketConfig(cfg) {
    fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2));
    return { status: "saved", message: "Save socket success" };
}
