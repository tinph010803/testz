import { io } from 'socket.io-client';

const socket = io('https://testz-six.vercel.app:5005', {
  autoConnect: false, // Chỉ kết nối khi đã login
});

export default socket;
