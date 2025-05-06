// utils/socketCall.ts
import { io } from 'socket.io-client';

const SOCKET_CALL_URL = import.meta.env.VITE_SOCKET_CALL_URL || 'http://localhost:8001';

const socketCall = io(SOCKET_CALL_URL, {
  autoConnect: false,
});

export default socketCall;
