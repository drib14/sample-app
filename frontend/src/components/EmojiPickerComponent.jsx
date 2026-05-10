import React, { useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { motion } from 'framer-motion';

const EmojiPickerComponent = ({ onSelect, onClose }) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden"
      ref={pickerRef}
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji) => {
          onSelect(emoji.native);
        }}
        theme="light"
        previewPosition="none"
        skinTonePosition="none"
      />
    </motion.div>
  );
};

export default EmojiPickerComponent;
