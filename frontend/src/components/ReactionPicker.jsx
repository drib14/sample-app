import React, { useState, useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus } from 'lucide-react';

const defaultEmojis = ['👍', '❤️', '😂'];

const ReactionPicker = ({ onReact, currentReactions, currentUserId }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji) => {
    onReact(emoji.native || emoji);
    setShowPicker(false);
  };

  // Find user's current reaction
  const userReaction = currentReactions?.find(r => r.user === currentUserId)?.emoji;

  return (
    <div className="relative flex items-center gap-1" ref={pickerRef}>
      <div className="flex gap-1 bg-brown-50 p-1 rounded-full border border-brown-100 shadow-sm">
        {defaultEmojis.map((emoji, index) => {
          const isActive = userReaction === emoji;
          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleEmojiSelect(emoji)}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-lg transition-colors ${isActive ? 'bg-brown-200 ring-2 ring-brown-400' : 'hover:bg-brown-100'}`}
            >
              {emoji}
            </motion.button>
          );
        })}

        <div className="w-px h-6 bg-brown-200 mx-1 self-center"></div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPicker(!showPicker)}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-brown-500 hover:text-brown-700 hover:bg-brown-100 transition-colors ${showPicker ? 'bg-brown-200' : ''}`}
        >
          <SmilePlus size={18} />
        </motion.button>
      </div>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 z-50 shadow-xl rounded-xl overflow-hidden border border-brown-200"
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
              skinTonePosition="none"
              previewPosition="none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReactionPicker;
