// import { io } from 'socket.io-client';

// const socket = io('http://localhost:5005', {
//   autoConnect: false, // Chỉ kết nối khi đã login
// });

// export default socket;

import { io } from 'socket.io-client';

const VITE_API_URL_CHAT = import.meta.env.VITE_API_URL_CHAT;

const socket = io(VITE_API_URL_CHAT, {
  autoConnect: false
});

export default socket;