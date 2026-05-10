import { io } from 'socket.io-client';

const URL = 'http://localhost:5000'; // Make sure this matches backend URL
const socket = io(URL, {
  autoConnect: false, // We'll connect manually when logged in
});

export default socket;
