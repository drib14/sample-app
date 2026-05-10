import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api'; // assuming an api instance exists

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeMiniChats, setActiveMiniChats] = useState([]); // Array of conversation objects to show at bottom right
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (token && user) {
      // Connect to socket with JWT auth
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: {
          token
        }
      });

      setSocket(newSocket);

      // Fetch initial conversations
      fetchConversations();

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      newSocket.on('user_status_change', ({ userId, isOnline }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (isOnline) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });

        // Update conversation participants' online status if needed
        setConversations(prev => prev.map(conv => {
          const updatedParticipants = conv.participants.map(p =>
            p._id === userId ? { ...p, isOnline } : p
          );
          return { ...conv, participants: updatedParticipants };
        }));
      });

      newSocket.on('receive_message', (message) => {
        // Update the conversations list with new latest message
        setConversations(prev => {
          const convIndex = prev.findIndex(c => c._id === message.conversationId);
          if (convIndex > -1) {
            const updatedConv = { ...prev[convIndex], latestMessage: message, updatedAt: message.createdAt };
            const newConvs = [...prev];
            newConvs.splice(convIndex, 1);
            return [updatedConv, ...newConvs];
          }
          return prev; // If not in list, might want to fetch again
        });

        // If the mini chat isn't open, we emit a message delivered event back to sender
        // Assuming we know senderId from message
        if (message.sender._id !== user.id) {
          newSocket.emit('message_delivered', {
            messageId: message._id,
            senderId: message.sender._id,
            conversationId: message.conversationId
          });
        }
      });

      newSocket.on('update_conversation', (data) => {
        setConversations(prev => {
          const convIndex = prev.findIndex(c => c._id === data.conversationId);
          if (convIndex > -1) {
            const updatedConv = { ...prev[convIndex], latestMessage: data.message, updatedAt: data.message.createdAt };
            const newConvs = [...prev];
            newConvs.splice(convIndex, 1);
            return [updatedConv, ...newConvs];
          } else {
            // New conversation created, fetch all to guarantee correct population
            fetchConversations();
            return prev;
          }
        });
      });

      newSocket.on('messages_seen', ({ conversationId, seenBy }) => {
        // Update local state if needed
      });

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setConversations([]);
      setActiveMiniChats([]);
    }
  }, [token]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
      // Initialize online users from conversation participants
      const active = new Set();
      res.data.forEach(conv => {
        conv.participants.forEach(p => {
          if (p.isOnline) active.add(p._id);
        });
      });
      setOnlineUsers(active);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const openMiniChat = (conversation) => {
    setActiveMiniChats(prev => {
      // Limit to 3 active mini chats max
      const exists = prev.find(c => c._id === conversation._id);
      if (exists) return prev;
      if (prev.length >= 3) {
        return [...prev.slice(1), conversation];
      }
      return [...prev, conversation];
    });
  };

  const closeMiniChat = (conversationId) => {
    setActiveMiniChats(prev => prev.filter(c => c._id !== conversationId));
  };

  const unreadCount = conversations.reduce((count, conv) => {
    if (conv.latestMessage &&
        conv.latestMessage.sender._id !== user?.id &&
        conv.latestMessage.status !== 'seen') {
      return count + 1;
    }
    return count;
  }, 0);

  return (
    <ChatContext.Provider value={{
      socket,
      conversations,
      activeMiniChats,
      onlineUsers,
      unreadCount,
      openMiniChat,
      closeMiniChat,
      fetchConversations
    }}>
      {children}
    </ChatContext.Provider>
  );
};
