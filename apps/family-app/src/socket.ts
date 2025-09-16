import { io } from 'socket.io-client';

const socketBaseUrl =
  (import.meta as any).env?.VITE_SOCKET_IO_URL ||
  `${location.protocol === 'https:' ? 'https' : 'http'}://${location.hostname}:3001`;

export const socket = io(socketBaseUrl, {
  path: '/socket.io',
  transports: ['polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

export function registerUser(userId: string) {
  const doRegister = () => socket.emit('register', { userId });
  if (socket.connected) {
    doRegister();
  } else {
    socket.once('connect', doRegister);
  }
}