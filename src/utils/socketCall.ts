import { io } from 'socket.io-client';

const socketCall = io('http://localhost:8001', {
  autoConnect: false,
});

export default socketCall;
