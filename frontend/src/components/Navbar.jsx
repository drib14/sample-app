import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Home, User as UserIcon, Settings, LogOut, Handshake, Bookmark, Bell, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import NotificationBell from './NotificationBell';
import HandshakeModal from './HandshakeModal';
import { useChat } from '../context/ChatContext';

const Navbar = ({ user }) => {
  const { unreadCount, conversations, openMiniChat } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHandshakeOpen, setIsHandshakeOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMessagesDropdownOpen, setIsMessagesDropdownOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delay = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?query=${searchQuery}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
        });
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem('makiUser');
    localStorage.removeItem('makiToken');
    import('../utils/socket').then(({ default: socket }) => {
      socket.disconnect();
    });
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-white sticky top-0 z-50 border-b border-brown-100 shadow-sm">
        <div className="w-full px-4 py-3 flex items-center justify-between">

          {/* Left: Trademark & Search (Expandable) */}
          <div className="flex-1 flex items-center gap-4">
            {!showMobileSearch && (
              <Link to="/dashboard" className="text-2xl font-black tracking-tighter text-brown-900 cursor-pointer select-none hover:text-brown-700 transition-colors shrink-0" style={{ fontFamily: 'Georgia, serif' }}>
                Maki
              </Link>
            )}

            <div className={`relative ${showMobileSearch ? 'w-full flex-1' : 'w-auto'}`}>
              {!showMobileSearch && (
                 <button onClick={() => setShowMobileSearch(true)} className="p-2 text-brown-400 hover:bg-brown-50 rounded-full transition-colors flex items-center justify-center">
                    <Search size={22} />
                 </button>
              )}

              {showMobileSearch && (
                <div className="relative w-full flex items-center">
                  <Search className="absolute left-3 text-brown-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    autoFocus
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-brown-50 border border-transparent focus:border-brown-200 rounded-full text-sm text-brown-900 outline-none transition-all"
                  />
                  <button onClick={() => { setShowMobileSearch(false); setSearchQuery(''); }} className="absolute right-3 text-brown-400 hover:text-brown-600 p-1">
                    <LogOut size={16} className="rotate-180" />
                  </button>
                </div>
              )}

              {/* Search Results Dropdown */}
              {searchQuery.trim().length > 0 && showMobileSearch && (
                <div className="absolute top-full mt-2 left-0 w-full md:w-80 bg-white rounded-xl shadow-lg border border-brown-100 py-2 z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <p className="px-4 py-2 text-sm text-brown-500 text-center">Searching...</p>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(resUser => (
                      <Link
                        key={resUser._id}
                        to={`/profile/${resUser.username}`}
                        onClick={() => { setSearchQuery(''); setShowMobileSearch(false); }}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-brown-50 transition-colors"
                      >
                        {resUser.profilePicture ? (
                          <img src={resUser.profilePicture} alt="User" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-brown-200 rounded-full flex items-center justify-center text-xs font-bold text-brown-600">
                            {resUser.firstName[0]}{resUser.lastName[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-brown-900 leading-tight">{resUser.firstName} {resUser.lastName}</p>
                          <p className="text-xs text-brown-400">@{resUser.username}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="px-4 py-2 text-sm text-brown-500 text-center">No users found.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Notifications, Profile */}
          {!showMobileSearch && (
            <div className="flex-1 flex items-center justify-end gap-2 md:gap-4 shrink-0">
              {/* Messages Icon */}
              <div className="relative">
                <button
                  onClick={() => setIsMessagesDropdownOpen(!isMessagesDropdownOpen)}
                  className={`p-2 rounded-full transition-colors flex items-center justify-center relative ${isMessagesDropdownOpen ? 'bg-brown-100 text-brown-900' : 'text-brown-500 hover:bg-brown-50'}`}
                >
                  <MessageCircle size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {isMessagesDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-brown-100 py-2 z-50 flex flex-col max-h-[400px]"
                    >
                      <div className="px-4 py-2 border-b border-brown-50 flex justify-between items-center">
                        <h3 className="font-bold text-brown-900">Messages</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {conversations.length > 0 ? (
                          conversations.slice(0, 5).map(conv => {
                            const other = conv.participants.find(p => p._id !== user.id);
                            const isUnread = conv.latestMessage && conv.latestMessage.sender?._id !== user.id && conv.latestMessage.status !== 'seen';
                            return (
                              <div
                                key={conv._id}
                                onClick={() => {
                                  openMiniChat(conv);
                                  setIsMessagesDropdownOpen(false);
                                }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-brown-50 transition-colors cursor-pointer border-b border-brown-50 last:border-0"
                              >
                                <div className="w-10 h-10 rounded-full bg-brown-200 overflow-hidden shrink-0">
                                  {other?.profilePicture ? <img src={other.profilePicture} alt="User" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-brown-600 font-bold">{other?.firstName[0]}</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm truncate ${isUnread ? 'font-bold text-brown-900' : 'font-semibold text-brown-800'}`}>
                                    {other?.firstName} {other?.lastName}
                                  </p>
                                  <p className={`text-xs truncate ${isUnread ? 'font-semibold text-brown-900' : 'text-brown-500'}`}>
                                    {conv.latestMessage ? (conv.latestMessage.sender?._id === user.id ? `You: ${conv.latestMessage.text}` : conv.latestMessage.text) : 'Start a chat'}
                                  </p>
                                </div>
                                {isUnread && <div className="w-2.5 h-2.5 bg-brown-600 rounded-full shrink-0"></div>}
                              </div>
                            );
                          })
                        ) : (
                          <p className="px-4 py-6 text-sm text-center text-brown-400">No messages yet.</p>
                        )}
                      </div>
                      <div className="p-2 border-t border-brown-50">
                        <Link
                          to="/messages"
                          onClick={() => setIsMessagesDropdownOpen(false)}
                          className="block text-center text-sm font-semibold text-brown-600 hover:text-brown-900 py-1"
                        >
                          See all in Messenger
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NotificationBell user={user} />

              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-brown-50 transition-colors"
                >
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Me" className="w-8 h-8 rounded-full object-cover border border-brown-200" />
                  ) : (
                    <div className="w-8 h-8 bg-brown-200 rounded-full flex items-center justify-center font-bold text-brown-600 border border-brown-200">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                  )}
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-brown-100 py-2 z-50"
                    >
                      <Link to={`/profile/${user?.username}`} className="flex items-center gap-3 px-4 py-2 text-sm text-brown-700 hover:bg-brown-50 transition-colors">
                        <UserIcon size={16} /> View Profile
                      </Link>
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-brown-700 hover:bg-brown-50 transition-colors text-left cursor-not-allowed opacity-50">
                        <Settings size={16} /> Settings
                      </button>
                      <div className="my-1 border-t border-brown-50"></div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
                        <LogOut size={16} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
        <HandshakeModal isOpen={isHandshakeOpen} onClose={() => setIsHandshakeOpen(false)} />
      </nav>

      {/* Bottom Mobile Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-brown-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50 md:hidden pb-safe">
        <div className="flex justify-around items-center p-2">
          <Link to="/dashboard" className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-colors ${location.pathname === '/dashboard' ? 'text-brown-900' : 'text-brown-400 hover:text-brown-600'}`}>
            <Home size={24} />
          </Link>
          <button onClick={() => setShowMobileSearch(true)} className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-colors ${showMobileSearch ? 'text-brown-900' : 'text-brown-400 hover:text-brown-600'}`}>
            <Search size={24} />
          </button>
          <Link to="/saved" className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-colors ${location.pathname === '/saved' ? 'text-brown-900' : 'text-brown-400 hover:text-brown-600'}`}>
            <Bookmark size={24} />
          </Link>
          <button onClick={() => setIsHandshakeOpen(true)} className="p-3 rounded-xl flex flex-col items-center gap-1 transition-colors text-brown-400 hover:text-brown-600">
             <Handshake size={24} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;
