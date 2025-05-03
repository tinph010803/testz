// File: utils/commentSocket.ts
import { io } from 'socket.io-client';

const commentSocket = io('http://localhost:5004', {
  autoConnect: false,
  transports: ["websocket"],
});

export default commentSocket;
