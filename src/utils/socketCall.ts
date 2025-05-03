import { io } from 'socket.io-client';

const socketCall = io('https://testz-six.vercel.app:8001', {
  autoConnect: false,
});

export default socketCall;
