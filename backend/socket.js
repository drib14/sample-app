const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
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

    // JWT authentication middleware for sockets
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
      }
    });

    io.on('connection', async (socket) => {
      console.log('Client connected:', socket.id, 'User:', socket.user.id);
      const currentUserId = socket.user.id;

      // Automatically join personal room using authenticated user ID
      socket.join(currentUserId);
      console.log(`User ${currentUserId} joined their room`);

      try {
        await User.findByIdAndUpdate(currentUserId, { isOnline: true });
        io.emit('user_status_change', { userId: currentUserId, isOnline: true });
      } catch (e) {
        console.error('Error setting user online status', e);
      }

      // Chat Events
      socket.on('typing', ({ conversationId, recipientId }) => {
        io.to(recipientId).emit('typing', { conversationId, userId: currentUserId });
      });

      socket.on('stop_typing', ({ conversationId, recipientId }) => {
        io.to(recipientId).emit('stop_typing', { conversationId, userId: currentUserId });
      });

      socket.on('message_delivered', async ({ messageId, senderId, conversationId }) => {
        // Find message and update if needed, but since we are just passing events,
        // we emit to sender that the message was delivered.
        // In a real DB we might want to update Message.findByIdAndUpdate(messageId, { status: 'delivered' })
        try {
          const Message = require('./models/Message');
          await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
          io.to(senderId).emit('message_delivered_ack', { messageId, conversationId });
        } catch (e) {
          console.error(e);
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
