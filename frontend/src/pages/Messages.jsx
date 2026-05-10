import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import { Search, Send, Paperclip, MoreVertical, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const Messages = () => {
  const navigate = useNavigate();
  const { conversations, socket, onlineUsers, fetchConversations } = useChat();
  const [activeTab, setActiveTab] = useState('connected'); // 'connected' or 'requests'
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', handleNewMessage);
      socket.on('typing', handleTyping);
      socket.on('stop_typing', handleStopTyping);
      socket.on('message_delivered_ack', handleDeliveredAck);
      socket.on('messages_seen', handleSeenAck);
    }
    return () => {
      if (socket) {
        socket.off('receive_message', handleNewMessage);
        socket.off('typing', handleTyping);
        socket.off('stop_typing', handleStopTyping);
        socket.off('message_delivered_ack', handleDeliveredAck);
        socket.off('messages_seen', handleSeenAck);
      }
    };
  }, [socket, activeConversation]);

  useEffect(() => {
    scrollToBottom();
    // Mark as seen
    if (activeConversation && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender._id !== user.id && lastMsg.status !== 'seen') {
        api.put(`/messages/${activeConversation._id}/seen`).catch(console.error);
        setMessages(prev => prev.map(m => m.sender._id !== user.id ? { ...m, status: 'seen' } : m));
      }
    }
  }, [messages, activeConversation]);

  const fetchMessages = async (conversationId) => {
    try {
      const res = await api.get(`/messages/${conversationId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewMessage = (msg) => {
    if (activeConversation && msg.conversationId === activeConversation._id) {
      setMessages(prev => [...prev, msg]);
      api.put(`/messages/${activeConversation._id}/seen`).catch(console.error);
    }
  };

  const handleTyping = ({ conversationId }) => {
    if (activeConversation && conversationId === activeConversation._id) setIsTyping(true);
  };

  const handleStopTyping = ({ conversationId }) => {
    if (activeConversation && conversationId === activeConversation._id) setIsTyping(false);
  };

  const handleDeliveredAck = ({ messageId, conversationId }) => {
    if (activeConversation && conversationId === activeConversation._id) {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'delivered' } : m));
    }
  };

  const handleSeenAck = ({ conversationId }) => {
    if (activeConversation && conversationId === activeConversation._id) {
      setMessages(prev => prev.map(m => m.sender._id === user.id && m.status !== 'seen' ? { ...m, status: 'seen' } : m));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    const otherParticipant = activeConversation?.participants.find(p => p._id !== user.id);
    if (socket && otherParticipant) {
      socket.emit('typing', { conversationId: activeConversation._id, recipientId: otherParticipant._id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { conversationId: activeConversation._id, recipientId: otherParticipant._id });
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
    // reset input
    e.target.value = null;
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!text.trim() && files.length === 0) || !activeConversation) return;

    const formData = new FormData();
    if (text.trim()) formData.append('text', text);
    files.forEach(f => formData.append('media', f));

    setText('');
    setFiles([]);

    const otherParticipant = activeConversation.participants.find(p => p._id !== user.id);
    if (socket && otherParticipant) {
      socket.emit('stop_typing', { conversationId: activeConversation._id, recipientId: otherParticipant._id });
    }

    try {
      const res = await api.post(`/messages/${activeConversation._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Ensure we don't duplicate message if socket arrives first
      setMessages(prev => {
        if (prev.find(m => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const acceptRequest = async () => {
    if (!activeConversation) return;
    try {
      await api.put(`/messages/conversations/${activeConversation._id}/accept`);
      await fetchConversations();
      setActiveConversation({ ...activeConversation, isRequest: false });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteConversation = async () => {
    if (!activeConversation) return;
    try {
      await api.delete(`/messages/conversations/${activeConversation._id}`);
      await fetchConversations();
      setActiveConversation(null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delay = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?query=${searchQuery}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleStartChat = async (targetUserId) => {
    try {
      const res = await api.post('/messages/conversations', { targetUserId });
      await fetchConversations();
      setActiveConversation(res.data);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  const connectedConvs = conversations.filter(c => !c.isRequest);
  const requestConvs = conversations.filter(c => c.isRequest);

  const renderConversationList = (list) => {
    return list.map(conv => {
      const otherParticipant = conv.participants.find(p => p._id !== user.id);
      const isUnread = conv.latestMessage && conv.latestMessage.sender._id !== user.id && conv.latestMessage.status !== 'seen';
      const isActive = activeConversation?._id === conv._id;

      return (
        <div
          key={conv._id}
          onClick={() => setActiveConversation(conv)}
          className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-brown-50 ${isActive ? 'bg-brown-100' : 'hover:bg-brown-50'}`}
        >
          <div className="relative">
             <Avatar src={otherParticipant?.profilePicture} alt="User" fallback={otherParticipant?.firstName[0]} size="md" />
             {onlineUsers.has(otherParticipant?._id) && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <p className={`text-sm truncate ${isUnread ? 'font-bold text-brown-900' : 'font-semibold text-brown-800'}`}>
                {otherParticipant?.firstName} {otherParticipant?.lastName}
              </p>
              {conv.updatedAt && (
                <span className="text-[10px] text-brown-400 whitespace-nowrap ml-2">
                  {format(new Date(conv.updatedAt), 'MMM d')}
                </span>
              )}
            </div>
            <p className={`text-xs truncate ${isUnread ? 'font-semibold text-brown-900' : 'text-brown-500'}`}>
              {conv.latestMessage ? (
                <>
                  {conv.latestMessage.sender._id === user.id && 'You: '}
                  {conv.latestMessage.text || 'Sent an attachment'}
                </>
              ) : 'Start a conversation'}
            </p>
          </div>
          {isUnread && <div className="w-2.5 h-2.5 bg-brown-600 rounded-full shrink-0"></div>}
        </div>
      );
    });
  };

  const activeOtherParticipant = activeConversation?.participants.find(p => p._id !== user.id);

  return (
    <div className="min-h-screen bg-brown-50 flex flex-col font-sans">
      <Navbar user={user} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 gap-4 h-[calc(100vh-70px)]">

        {/* Sidebar */}
        <div className="w-full md:w-80 lg:w-96 bg-white rounded-2xl shadow-sm border border-brown-200 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-brown-100 relative">
            <h1 className="text-xl font-bold text-brown-900 mb-4">Chats</h1>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" size={18} />
              <input
                type="text"
                placeholder="Search to start chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-brown-50 rounded-full text-sm outline-none focus:ring-2 focus:ring-brown-200 transition-all"
              />
            </div>

            {searchQuery.trim().length > 0 && (
              <div className="absolute top-[100px] left-4 right-4 bg-white rounded-xl shadow-lg border border-brown-100 py-2 z-50 max-h-60 overflow-y-auto">
                {isSearching ? (
                  <p className="px-4 py-2 text-sm text-brown-500 text-center">Searching...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map(resUser => (
                    <div
                      key={resUser._id}
                      onClick={() => handleStartChat(resUser._id)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-brown-50 transition-colors cursor-pointer"
                    >
                      <Avatar src={resUser.profilePicture} fallback={resUser.firstName[0]} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-brown-900 leading-tight">{resUser.firstName} {resUser.lastName}</p>
                        <p className="text-xs text-brown-400">@{resUser.username}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-2 text-sm text-brown-500 text-center">No users found.</p>
                )}
              </div>
            )}

            <div className="flex gap-2 p-1 bg-brown-50 rounded-lg">
              <button
                onClick={() => setActiveTab('connected')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'connected' ? 'bg-white text-brown-900 shadow-sm' : 'text-brown-500 hover:text-brown-700'}`}
              >
                Connected
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'requests' ? 'bg-white text-brown-900 shadow-sm' : 'text-brown-500 hover:text-brown-700'}`}
              >
                Requests {requestConvs.length > 0 && `(${requestConvs.length})`}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'connected' ? (
              connectedConvs.length > 0 ? renderConversationList(connectedConvs) : (
                <div className="p-8 text-center text-brown-400">
                  <p className="text-sm">No connected conversations yet.</p>
                </div>
              )
            ) : (
              requestConvs.length > 0 ? renderConversationList(requestConvs) : (
                <div className="p-8 text-center text-brown-400">
                  <p className="text-sm">No message requests.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-1 bg-white rounded-2xl shadow-sm border border-brown-200 flex-col overflow-hidden relative">
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-brown-100 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar src={activeOtherParticipant?.profilePicture} alt="User" fallback={activeOtherParticipant?.firstName[0]} size="lg" />
                    {onlineUsers.has(activeOtherParticipant?._id) && <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-brown-900">{activeOtherParticipant?.firstName} {activeOtherParticipant?.lastName}</h2>
                    <p className="text-xs text-brown-500">
                      {onlineUsers.has(activeOtherParticipant?._id) ? <span className="text-green-600 font-medium">Active now</span> : 'Offline'}
                    </p>
                  </div>
                </div>
                <button className="p-2 text-brown-400 hover:bg-brown-50 rounded-full transition">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-brown-50/30 flex flex-col gap-4">
                {/* Request Notice */}
                {activeConversation.isRequest && (
                  <div className="bg-white border border-brown-200 p-4 rounded-xl text-center mb-4 mx-auto max-w-sm shadow-sm">
                    <Avatar src={activeOtherParticipant?.profilePicture} fallback={activeOtherParticipant?.firstName[0]} size="xl" className="mx-auto mb-2" />
                    <h3 className="font-bold text-brown-900">{activeOtherParticipant?.firstName} isn't a connection</h3>
                    <p className="text-xs text-brown-500 mt-1 mb-4">You can accept their request to reply, or delete it.</p>
                    <div className="flex gap-2 justify-center">
                      <button onClick={deleteConversation} className="px-4 py-1.5 bg-red-100 text-red-600 text-sm font-semibold rounded-full hover:bg-red-200 transition">Delete</button>
                      <button onClick={acceptRequest} className="px-4 py-1.5 bg-brown-900 text-white text-sm font-semibold rounded-full hover:bg-brown-800 transition">Accept</button>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isMine = msg.sender._id === user.id;
                  const showAvatar = !isMine && (idx === 0 || messages[idx-1].sender._id !== msg.sender._id);
                  const showTime = idx === 0 || new Date(msg.createdAt) - new Date(messages[idx-1].createdAt) > 3600000; // 1 hour

                  return (
                    <div key={msg._id} className="flex flex-col">
                      {showTime && <p className="text-[10px] text-brown-400 text-center my-4">{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</p>}
                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`flex gap-3 max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isMine && (
                             <div className="w-8 shrink-0 flex items-end pb-1">
                                {showAvatar && <Avatar src={msg.sender.profilePicture} fallback={msg.sender.firstName[0]} size="sm" />}
                             </div>
                          )}

                          <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                            {msg.text && (
                              <div className={`px-4 py-2.5 rounded-2xl text-[15px] ${isMine ? 'bg-brown-800 text-white rounded-br-sm shadow-sm' : 'bg-white border border-brown-200 text-brown-900 rounded-bl-sm shadow-sm'}`}>
                                {msg.text}
                              </div>
                            )}

                            {msg.media && msg.media.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 max-w-[250px]">
                                {msg.media.map((item, i) => (
                                  <div key={i} className="rounded-lg overflow-hidden border border-brown-200 bg-white">
                                    {item.type === 'image' ? (
                                      <img src={item.url} alt="attachment" className="max-h-32 object-contain" />
                                    ) : item.type === 'video' ? (
                                      <video src={item.url} controls className="max-h-32 object-contain" />
                                    ) : (
                                      <a href={item.url} target="_blank" rel="noreferrer" className="block p-2 text-xs text-blue-600 underline">
                                        View Attachment
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {msg.linkPreview && (
                              <a href={msg.linkPreview.url} target="_blank" rel="noopener noreferrer" className="block w-64 border border-brown-200 rounded-xl overflow-hidden bg-white mt-1 hover:opacity-90 shadow-sm">
                                {msg.linkPreview.image && <img src={msg.linkPreview.image} alt="Preview" className="w-full h-32 object-cover" />}
                                <div className="p-3">
                                  <p className="text-sm font-bold text-brown-900 truncate">{msg.linkPreview.title}</p>
                                  <p className="text-xs text-brown-500 line-clamp-2 mt-1">{msg.linkPreview.description}</p>
                                </div>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Read Receipts */}
                        {isMine && idx === messages.length - 1 && (
                          <div className="mt-1 mr-1">
                            {msg.status === 'seen' && (
                              <img src={activeOtherParticipant?.profilePicture || 'default'} alt="Seen" className="w-4 h-4 rounded-full object-cover shadow-sm" onError={(e) => e.target.style.display='none'} />
                            )}
                            {msg.status === 'delivered' && (
                              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px]">✓</div>
                            )}
                            {msg.status === 'sent' && (
                              <div className="w-4 h-4 rounded-full border border-brown-300 flex items-center justify-center text-brown-400 text-[10px]">✓</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex gap-3 max-w-[70%] items-end mt-2">
                     <div className="w-8 shrink-0 flex items-end pb-1">
                        <Avatar src={activeOtherParticipant?.profilePicture} fallback={activeOtherParticipant?.firstName[0]} size="sm" />
                     </div>
                     <div className="bg-white border border-brown-200 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center shadow-sm">
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-brown-400 rounded-full" />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-brown-400 rounded-full" />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-brown-400 rounded-full" />
                     </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-brown-100 flex flex-col gap-2">
                {files.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {files.map((file, i) => (
                      <div key={i} className="relative w-16 h-16 shrink-0 bg-brown-100 rounded-lg overflow-hidden border border-brown-200">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-1">
                            <span className="text-[10px] text-brown-600 font-semibold truncate w-full text-center">{file.name}</span>
                          </div>
                        )}
                        <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-md hover:bg-red-50 text-red-500">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSend} className="flex items-end gap-3 bg-brown-50 rounded-2xl p-2 border border-brown-200">
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-brown-400 hover:text-brown-700 hover:bg-brown-100 rounded-full transition">
                    <Paperclip size={20} />
                  </button>
                  <textarea
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Message..."
                    disabled={activeConversation.isRequest}
                    className="flex-1 max-h-32 min-h-[40px] bg-transparent outline-none resize-none py-2 text-[15px] text-brown-900 placeholder:text-brown-400 disabled:opacity-50"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={(!text.trim() && files.length === 0) || activeConversation.isRequest}
                    className="p-2 bg-brown-900 text-white hover:bg-brown-800 rounded-full transition disabled:opacity-50 disabled:bg-brown-200 disabled:text-brown-400"
                  >
                    <Send size={18} className="ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-brown-400">
              <div className="w-24 h-24 bg-brown-50 rounded-full flex items-center justify-center mb-6">
                 <Send size={48} className="text-brown-300 opacity-50" />
              </div>
              <h3 className="text-2xl font-bold text-brown-900 mb-2">Your Messages</h3>
              <p className="text-sm">Select a conversation or start a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
