import { io } from "socket.io-client";

export class OutboundSocket {
    constructor({ url, token }) {
        this.url = url;
        this.token = token;
        this.socket = null;
        this.connected = false;
    }

    connect() {
        if (this.socket) return;

        this.socket = io(this.url, {
            transports: ["websocket"],
            auth: {
                token: this.token
            },
            reconnection: true
        });

        this.socket.on("connect", () => {
            this.connected = true;
            console.log("[SOCKET] connected:", this.socket.id);
        });

        this.socket.on("disconnect", () => {
            this.connected = false;
            console.log("[SOCKET] disconnected");
        });

        this.socket.on("connect_error", err => {
            console.error("[SOCKET] error", err.message);
        });
    }

    send(event, payload) {
        if (!this.connected) return;
        this.socket.emit(event, payload);
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
        this.connected = false;
    }
}
