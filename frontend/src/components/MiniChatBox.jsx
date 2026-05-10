import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { X, Minus, Image as ImageIcon, Send, Paperclip, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import Avatar from './Avatar';
import { format } from 'date-fns';
import MessageBubble from './MessageBubble';
import GifPicker from './GifPicker';

const MiniChatBox = ({ conversation, positionIndex }) => {
  const { closeMiniChat, socket, onlineUsers, fetchConversations } = useChat();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  const otherParticipant = conversation.participants.find(p => p._id !== user.id);
  const isOnline = onlineUsers.has(otherParticipant?._id);

  useEffect(() => {
    fetchMessages();

    if (socket) {
      socket.on('receive_message', handleNewMessage);
      socket.on('typing', handleTyping);
      socket.on('stop_typing', handleStopTyping);
      socket.on('message_delivered_ack', handleDeliveredAck);
      socket.on('messages_seen', handleSeenAck);
      socket.on('message_edited', handleMessageEdited);
      socket.on('message_deleted', handleMessageDeleted);
    }

    return () => {
      if (socket) {
        socket.off('receive_message', handleNewMessage);
        socket.off('typing', handleTyping);
        socket.off('stop_typing', handleStopTyping);
        socket.off('message_delivered_ack', handleDeliveredAck);
        socket.off('messages_seen', handleSeenAck);
        socket.off('message_edited', handleMessageEdited);
        socket.off('message_deleted', handleMessageDeleted);
      }
    };
  }, [conversation._id, socket]);

  useEffect(() => {
    scrollToBottom();
    // Mark as seen when opening or new messages arrive
    if (!isMinimized && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender._id !== user.id && lastMsg.status !== 'seen') {
        api.put(`/messages/${conversation._id}/seen`).catch(console.error);
        setMessages(prev => prev.map(m => m.sender._id !== user.id ? { ...m, status: 'seen' } : m));
      }
    }
  }, [messages, isMinimized]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/${conversation._id}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewMessage = (msg) => {
    if (msg.conversationId === conversation._id) {
      setMessages(prev => [...prev, msg]);
      if (!isMinimized) {
        api.put(`/messages/${conversation._id}/seen`).catch(console.error);
      }
    }
  };

  const handleTyping = ({ conversationId }) => {
    if (conversationId === conversation._id) setIsTyping(true);
  };

  const handleStopTyping = ({ conversationId }) => {
    if (conversationId === conversation._id) setIsTyping(false);
  };

  const handleDeliveredAck = ({ messageId, conversationId }) => {
    if (conversationId === conversation._id) {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'delivered' } : m));
    }
  };

  const handleSeenAck = ({ conversationId }) => {
    if (conversationId === conversation._id) {
      setMessages(prev => prev.map(m => m.sender._id === user.id && m.status !== 'seen' ? { ...m, status: 'seen' } : m));
    }
  };

  const handleMessageEdited = (updatedMsg) => {
    setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
  };

  const handleMessageDeleted = ({ messageId }) => {
    setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, text: '', media: [], gifUrl: null } : m));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (socket && otherParticipant) {
      socket.emit('typing', { conversationId: conversation._id, recipientId: otherParticipant._id });

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { conversationId: conversation._id, recipientId: otherParticipant._id });
      }, 2000);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 5) {
        alert("Maximum 5 files allowed");
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = null;
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;

    if (editingMessage) {
      try {
        const res = await api.put(`/messages/msg/${editingMessage._id}`, { text });
        setMessages(prev => prev.map(m => m._id === res.data._id ? res.data : m));
        setEditingMessage(null);
        setText('');
      } catch (err) {
        console.error(err);
      }
      return;
    }

    const formData = new FormData();
    if (text.trim()) formData.append('text', text);
    files.forEach(f => formData.append('media', f));

    setText('');
    setFiles([]);

    if (socket && otherParticipant) {
      socket.emit('stop_typing', { conversationId: conversation._id, recipientId: otherParticipant._id });
    }

    try {
      const res = await api.post(`/messages/${conversation._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => {
        if (prev.find(m => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setText('');
  };

  const handleGifSelect = async (gifUrl) => {
    setShowGifPicker(false);
    try {
      const res = await api.post(`/messages/${conversation._id}`, { gifUrl });
      setMessages(prev => {
        if (prev.find(m => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      if (socket && otherParticipant) {
        socket.emit('stop_typing', { conversationId: conversation._id, recipientId: otherParticipant._id });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteConversation = async () => {
    try {
      await api.delete(`/messages/conversations/${conversation._id}`);
      await fetchConversations();
      closeMiniChat(conversation._id);
    } catch (err) {
      console.error(err);
    }
  };

  const rightOffset = 24 + (positionIndex * 340); // 320px width + 20px gap

  return (
    <div
      className="fixed bottom-0 z-[60] bg-white border border-brown-200 shadow-xl rounded-t-xl overflow-hidden flex flex-col transition-all duration-300"
      style={{ width: '320px', right: `${rightOffset}px`, height: isMinimized ? '48px' : '450px', maxHeight: '80vh' }}
    >
      {/* Header */}
      <div
        className="bg-brown-50 px-3 py-2 border-b border-brown-200 flex items-center justify-between cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
             <Avatar src={otherParticipant?.profilePicture} alt="User" fallback={otherParticipant?.firstName[0]} size="sm" />
             {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
          </div>
          <div>
            <p className="text-sm font-semibold text-brown-900 leading-tight">{otherParticipant?.firstName} {otherParticipant?.lastName}</p>
            {isOnline && <p className="text-[10px] text-green-600">Active now</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 text-brown-500">
          <button onClick={(e) => { e.stopPropagation(); deleteConversation(); }} className="p-1 hover:bg-red-100 hover:text-red-500 rounded" title="Delete Conversation">
             <Trash2 size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1 hover:bg-brown-200 rounded">
             <Minus size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); closeMiniChat(conversation._id); }} className="p-1 hover:bg-brown-200 rounded">
             <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-3 bg-white flex flex-col gap-2">
            {messages.map((msg, idx) => {
              const isMine = msg.sender._id === user.id;
              const showAvatar = !isMine && (idx === 0 || messages[idx-1].sender._id !== msg.sender._id);

              return (
                <div key={msg._id} className="flex flex-col relative w-full overflow-visible">
                   <MessageBubble
                     msg={msg}
                     isMine={isMine}
                     showAvatar={showAvatar}
                     showTime={false}
                     activeOtherParticipant={otherParticipant}
                     onEditSelect={(m) => {
                       setEditingMessage(m);
                       setText(m.text);
                     }}
                   />

                  {/* Read Receipts (only show on last message if it's mine) */}
                  {isMine && idx === messages.length - 1 && !msg.isDeleted && (
                    <div className="self-end mt-1 mr-1">
                      {msg.status === 'seen' && (
                        <img src={otherParticipant?.profilePicture || 'default'} alt="Seen" className="w-3.5 h-3.5 rounded-full object-cover" onError={(e) => e.target.style.display='none'} />
                      )}
                      {msg.status === 'delivered' && (
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px]">✓</div>
                      )}
                      {msg.status === 'sent' && (
                        <div className="w-3.5 h-3.5 rounded-full border border-brown-300 flex items-center justify-center text-brown-400 text-[8px]">✓</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2 max-w-[85%] items-end mt-2">
                 <div className="w-6 shrink-0 flex items-end pb-1">
                    <Avatar src={otherParticipant?.profilePicture} fallback={otherParticipant?.firstName[0]} size="xs" />
                 </div>
                 <div className="bg-brown-100 px-3 py-2 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-brown-400 rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-brown-400 rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-brown-400 rounded-full" />
                 </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t border-brown-100 bg-white flex flex-col gap-1">
            {editingMessage && (
              <div className="flex items-center justify-between bg-brown-50 px-2 py-1 rounded-lg border border-brown-200">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-brown-600">Editing message</p>
                  <p className="text-xs text-brown-900 truncate">{editingMessage.text}</p>
                </div>
                <button onClick={cancelEdit} className="p-1 hover:bg-brown-200 rounded-full text-brown-500"><X size={12} /></button>
              </div>
            )}
            {files.length > 0 && !editingMessage && (
              <div className="flex gap-1 overflow-x-auto pb-1">
                {files.map((file, i) => (
                  <div key={i} className="relative w-10 h-10 shrink-0 bg-brown-100 rounded-lg overflow-hidden border border-brown-200">
                    {file.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-0.5">
                        <span className="text-[8px] text-brown-600 font-semibold truncate w-full text-center">{file.name}</span>
                      </div>
                    )}
                    <button onClick={() => removeFile(i)} className="absolute top-0.5 right-0.5 bg-white rounded-full p-0.5 shadow-md hover:bg-red-50 text-red-500">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative">
              <AnimatePresence>
                {showGifPicker && <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />}
              </AnimatePresence>
              <form onSubmit={handleSend} className="flex items-end gap-2 bg-brown-50 rounded-2xl p-1 border border-brown-200">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!!editingMessage} className="p-1.5 text-brown-400 hover:text-brown-600 rounded-full transition disabled:opacity-50">
                  <Paperclip size={18} />
                </button>
                <button type="button" onClick={() => setShowGifPicker(!showGifPicker)} disabled={!!editingMessage} className="p-1 text-brown-400 hover:text-brown-600 rounded-full transition disabled:opacity-50">
                  <div className="font-black text-[8px] border-[1.5px] border-current rounded px-1 flex items-center justify-center h-[14px]">GIF</div>
                </button>
                <textarea
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Aa"
                  className="flex-1 max-h-20 min-h-[32px] bg-transparent outline-none resize-none py-1.5 text-sm text-brown-900"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <button type="submit" disabled={!text.trim() && files.length === 0} className="p-1.5 text-brown-600 hover:bg-brown-200 rounded-full transition disabled:opacity-50">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MiniChatBox;
