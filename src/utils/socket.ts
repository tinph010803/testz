import { io } from 'socket.io-client';

const socket = io('http://localhost:5005', {
  autoConnect: false, // Chỉ kết nối khi đã login
});

export default socket;
