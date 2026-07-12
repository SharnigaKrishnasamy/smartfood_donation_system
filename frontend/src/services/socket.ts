import { io, Socket } from "socket.io-client";
import { getApiBaseUrl } from "./apiConfig";
import { getAccessToken } from "./api";

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket && socket.connected) return socket;

  socket = io(getApiBaseUrl(), {
    auth: { token: getAccessToken() },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
