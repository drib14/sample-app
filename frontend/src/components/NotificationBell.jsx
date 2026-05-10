import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import socket from '../utils/socket';

const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    socket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off('new_notification');
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put('/notifications/read', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    try {
      await api.delete('/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like': return 'liked your post.';
      case 'comment': return 'commented on your post.';
      case 'mention': return 'mentioned you.';
      case 'connection_request': return 'sent you a connection request.';
      case 'connection_accepted': return 'accepted your connection request.';
      default: return 'interacted with you.';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-brown-500 hover:bg-brown-50 rounded-full transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-brown-100 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-brown-100 flex flex-col gap-2 bg-brown-50">
              <h3 className="font-bold text-brown-900">Notifications</h3>
              <div className="flex justify-between items-center text-xs">
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-brown-500 hover:text-brown-700 transition-colors"
                  disabled={unreadCount === 0}
                >
                  <Check size={12} /> Mark all read
                </button>
                <button
                  onClick={deleteAllNotifications}
                  className="flex items-center gap-1 text-red-400 hover:text-red-600 transition-colors"
                  disabled={notifications.length === 0}
                >
                  <Trash2 size={12} /> Clear all
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-brown-400">No notifications yet.</div>
              ) : (
                notifications.map(notification => (
                  <Link
                    key={notification._id}
                    to={notification.post ? `/dashboard` : `/profile/${notification.sender?.username}`} // Simplistic routing for now
                    onClick={() => setIsOpen(false)}
                    className={`block p-4 border-b border-brown-50 hover:bg-brown-50 transition-colors ${!notification.read ? 'bg-brown-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {notification.sender?.profilePicture ? (
                        <img src={notification.sender.profilePicture} alt="User" className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-brown-200 rounded-full flex items-center justify-center font-bold text-brown-600 shrink-0 text-sm">
                          {notification.sender?.firstName?.[0]}{notification.sender?.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-brown-800 leading-tight">
                          <span className="font-bold">{notification.sender?.firstName} {notification.sender?.lastName}</span> {getNotificationText(notification)}
                        </p>
                        <p className="text-xs text-brown-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
