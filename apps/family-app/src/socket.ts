import { io } from 'socket.io-client';

export const socket = io('http://localhost:3001', {
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