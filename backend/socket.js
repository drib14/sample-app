const { Server } = require('socket.io');
const User = require('./models/User');

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
      let currentUserId = null;

      // For a more secure app, we should decode the jwt token passed during connection
      // For now, to solve CastError artifacts when ID is mock ("user123"), validate the ID
      socket.on('join_user_room', async (userId) => {
        if (!userId || userId.length !== 24) return;

        socket.join(userId);
        currentUserId = userId;
        console.log(`User ${userId} joined their room`);

        try {
          await User.findByIdAndUpdate(userId, { isOnline: true });
          io.emit('user_status_change', { userId, isOnline: true });
        } catch (e) {
          console.error('Error setting user online status', e);
        }
      });

      socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id);
        if (currentUserId) {
          try {
            await User.findByIdAndUpdate(currentUserId, { isOnline: false });
            io.emit('user_status_change', { userId: currentUserId, isOnline: false });
          } catch (e) {
            console.error('Error setting user offline status', e);
          }
        }
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
