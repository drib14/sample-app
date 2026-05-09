import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ModalWrapper = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
        {/* Background Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ y: '100%', opacity: 1, scale: 1 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '100%', opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden"
        >
          {/* Mobile Handle */}
          <div className="w-full flex justify-center py-2 sm:hidden cursor-pointer" onClick={onClose}>
            <div className="w-12 h-1.5 bg-brown-200 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="px-4 py-3 sm:py-4 border-b border-brown-100 flex items-center justify-between bg-brown-50">
            <h3 className="font-bold text-brown-900 text-lg">{title}</h3>
            <button onClick={onClose} className="text-brown-500 hover:text-brown-700 bg-brown-100 hover:bg-brown-200 p-1.5 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModalWrapper;
