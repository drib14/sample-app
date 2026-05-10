const { Server } = require('socket.io');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "*", // allow all or specifically frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"]
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join_user_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
