import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Edit2, Trash2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DropdownMenu = ({ onEdit, onDelete, isAuthor, username }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-brown-400 hover:text-brown-700 hover:bg-brown-50 rounded-full transition-colors"
      >
        <MoreHorizontal size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-brown-100 py-1 z-10"
          >
            <Link
              to={`/profile/${username}`}
              className="w-full text-left px-4 py-2 text-sm text-brown-700 hover:bg-brown-50 flex items-center gap-2"
            >
              <User size={16} /> View Profile
            </Link>

            {isAuthor && (
              <>
                <button
                  onClick={() => { setIsOpen(false); onEdit(); }}
                  className="w-full text-left px-4 py-2 text-sm text-brown-700 hover:bg-brown-50 flex items-center gap-2 border-t border-brown-50"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  onClick={() => { setIsOpen(false); onDelete(); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-brown-50"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DropdownMenu;
