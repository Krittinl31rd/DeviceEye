import { io } from "socket.io-client";
import { writeModbus } from "./modbusService.js";

export class OutboundSocket {
    constructor({ onStatus }) {
        this.socket = null;
        this.cfg = null;
        this.onStatus = onStatus;
        this.ready = false;
        this.queue = [];
    }

    connect(cfg) {
        if (!cfg?.enabled || !cfg.url) return;

        this.disconnect({ silent: true });
        this.cfg = cfg;

        this.socket = io(cfg.url, {
            transports: ["websocket"],
            auth: { token: cfg.token },
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000
        });

        this.socket.on("connect", () => {
            this.ready = true;
            this.onStatus?.({ state: "connected", url: cfg.url });

            // flush queue
            this.queue.forEach(({ event, payload }) => {
                this.socket.emit(event, payload);
            });
            this.queue.length = 0;
        });

        this.socket.on("disconnect", reason => {
            this.ready = false;
            this.onStatus?.({
                state: "disconnected",
                url: cfg.url,
                reason
            });
        });

        this.socket.on("connect_error", err => {
            this.ready = false;
            this.onStatus?.({
                state: "error",
                url: cfg.url,
                message: err.message
            });
        });

        // inbound command
        this.socket.on("modbus:write", async (payload, ack) => {
            try {
                const res = await writeModbus(payload);
                if (typeof ack === "function") {
                    ack(res?.success ? res.message : "Write Failed");
                }
            } catch (err) {
                console.error("[SOCKET WRITE ERROR]", err);
                if (typeof ack === "function") ack("Internal Error");
            }
        });
    }

    send(event, payload) {
        if (this.socket?.connected && this.ready) {
            this.socket.emit(event, payload);
        } else {
            this.queue.push({ event, payload });
        }
    }

    disconnect({ silent = false } = {}) {
        if (!this.socket) return;

        this.socket.removeAllListeners();
        this.socket.disconnect();

        this.socket = null;
        this.ready = false;
        this.queue.length = 0;

        if (!silent) {
            this.onStatus?.({
                state: "disconnected",
                url: this.cfg?.url
            });
        }
    }
}
