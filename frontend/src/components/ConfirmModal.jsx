import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          <div className="p-5 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-brown-900 text-xl mb-2">{title}</h3>
            <p className="text-brown-500 text-sm mb-6">{message}</p>

            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl font-medium text-brown-600 bg-brown-50 hover:bg-brown-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
