import { io } from "socket.io-client";

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
            reconnection: true
        });

        this.socket.on("connect", () => {
            console.log("[SOCKET] connected", this.socket.id);
            this.ready = true;

            this.onStatus?.({
                state: "connected", // connected | disconnected | error
                url: cfg.url
            });

            this.queue.forEach(({ event, payload }) => {
                this.socket.emit(event, payload);
            });
            this.queue.length = 0;
        });

        this.socket.on("disconnect", () => {
            console.log("[SOCKET] disconnected");
            this.ready = false;

            this.onStatus?.({
                state: "disconnected", // connected | disconnected | error
                url: cfg.url
            });
        });

        this.socket.on("connect_error", err => {
            console.error("[SOCKET] error", err.message);
            this.ready = false;

            this.onStatus?.({
                state: "error", // connected | disconnected | error
                url: cfg.url
            });
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
        this.socket?.disconnect();
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
