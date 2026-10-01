import { io, type Socket } from "socket.io-client";
import { clearToken, getToken } from "./auth";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      transports: ["websocket", "polling"],
      auth: { token: getToken() },
    });
    socket.on("connect_error", (err) => {
      if (err.message === "unauthorized") {
        clearToken();
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    });
  }
  return socket;
}

export function resetSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
