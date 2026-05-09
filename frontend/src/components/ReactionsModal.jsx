import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Avatar from './Avatar';

const ReactionsModal = ({ isOpen, onClose, reactions }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="p-4 border-b border-brown-100 flex items-center justify-between bg-brown-50">
            <h3 className="font-bold text-brown-900 text-lg">Reactions</h3>
            <button onClick={onClose} className="text-brown-500 hover:text-brown-700 bg-brown-100 hover:bg-brown-200 p-1.5 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto custom-scrollbar p-2">
            {reactions && reactions.length > 0 ? (
              reactions.map((reaction, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 hover:bg-brown-50 rounded-xl transition-colors">
                  <Avatar user={reaction.user} size="md" />
                  <div className="flex-1">
                    <p className="font-semibold text-brown-900 text-sm">
                      {reaction.user.firstName} {reaction.user.lastName}
                    </p>
                    <p className="text-xs text-brown-500">@{reaction.user.username}</p>
                  </div>
                  <div className="text-2xl">{reaction.emoji}</div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-brown-400">
                No reactions yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReactionsModal;
