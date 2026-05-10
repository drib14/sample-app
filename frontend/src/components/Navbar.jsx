import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home, User as UserIcon, Settings, LogOut, Handshake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import NotificationBell from './NotificationBell';
import HandshakeModal from './HandshakeModal';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHandshakeOpen, setIsHandshakeOpen] = useState(false);

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
    <nav className="bg-white sticky top-0 z-50 border-b border-brown-100 shadow-sm">
      <div className="w-full px-4 py-3 flex items-center justify-between">

        {/* Left: Blank or functional balance */}
        <div className="flex-1 hidden md:flex"></div>

        {/* Center: Main Nav */}
        <div className="flex-1 flex justify-center items-center gap-8">
          <Link to="/dashboard" className="group flex flex-col items-center text-brown-400 hover:text-brown-900 transition-colors relative p-2">
            <Home size={28} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -bottom-4 opacity-0 group-hover:opacity-100 text-xs font-bold transition-opacity">Home</span>
          </Link>
          <button onClick={() => setIsHandshakeOpen(true)} className="group flex flex-col items-center text-brown-400 hover:text-brown-900 transition-colors relative p-2">
            <Handshake size={28} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -bottom-4 opacity-0 group-hover:opacity-100 text-xs font-bold transition-opacity">Connect</span>
          </button>
        </div>

        {/* Right: Search, Notifications, Trademark, Dropdown */}
        <div className="flex-1 flex items-center justify-end gap-4">

          <div className="relative hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 pl-10 pr-4 py-2 bg-brown-50 border border-transparent focus:border-brown-200 rounded-full text-sm text-brown-900 outline-none transition-all"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-xl shadow-lg border border-brown-100 py-2 z-50">
                {isSearching ? (
                  <p className="px-4 py-2 text-sm text-brown-500 text-center">Searching...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map(resUser => (
                    <Link
                      key={resUser._id}
                      to={`/profile/${resUser.username}`}
                      onClick={() => setSearchQuery('')}
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

          <h1 className="text-2xl font-black tracking-tighter text-brown-900 hidden md:block cursor-pointer ml-4 mr-2 select-none hover:text-brown-700 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
            Maki
          </h1>
        </div>
      </div>
      <HandshakeModal isOpen={isHandshakeOpen} onClose={() => setIsHandshakeOpen(false)} />
    </nav>
  );
};

export default Navbar;
