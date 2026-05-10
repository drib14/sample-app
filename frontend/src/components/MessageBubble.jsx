import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Copy, Edit2, Trash2, X } from 'lucide-react';
import Avatar from './Avatar';
import { format } from 'date-fns';
import api from '../utils/api';

const MessageBubble = ({ msg, isMine, showAvatar, showTime, activeOtherParticipant, onEditSelect }) => {
  const [showActions, setShowActions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setShowActions(false);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/messages/msg/${msg._id}`);
      setShowActions(false);
    } catch (error) {
      console.error('Failed to delete message', error);
    }
  };

  if (msg.isDeleted) {
    return (
      <div className="flex flex-col">
        {showTime && <p className="text-[10px] text-brown-400 text-center my-4">{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</p>}
        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          <div className={`flex gap-3 max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isMine && (
                <div className="w-8 shrink-0 flex items-end pb-1">
                  {showAvatar && <Avatar src={msg.sender?.profilePicture} fallback={msg.sender?.firstName?.[0]} size="sm" />}
                </div>
            )}
            <div className={`px-4 py-2.5 rounded-2xl text-[14px] italic text-brown-400 border border-brown-200 bg-brown-50`}>
              This message was unsent.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {showTime && <p className="text-[10px] text-brown-400 text-center my-4">{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</p>}
      <div
        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} relative`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowActions(false); }}
      >
        <div className={`flex gap-3 max-w-[70%] group ${isMine ? 'flex-row-reverse' : 'flex-row'} items-center`}>
          {!isMine && (
              <div className="w-8 shrink-0 flex items-end self-end pb-1">
                {showAvatar && <Avatar src={msg.sender?.profilePicture} fallback={msg.sender?.firstName?.[0]} size="sm" />}
              </div>
          )}

          <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
            {msg.text && (
              <div className={`px-4 py-2.5 rounded-2xl text-[15px] relative ${isMine ? 'bg-brown-800 text-white rounded-br-sm shadow-sm' : 'bg-white border border-brown-200 text-brown-900 rounded-bl-sm shadow-sm'}`}>
                {msg.text}
                {msg.isEdited && <span className={`text-[10px] ml-2 ${isMine ? 'text-brown-300' : 'text-brown-400'}`}>(edited)</span>}
              </div>
            )}

            {msg.gifUrl && (
              <img src={msg.gifUrl} alt="GIF" className="max-w-[200px] rounded-xl shadow-sm border border-brown-200" />
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

          {/* Actions Button */}
          <div className={`relative flex items-center justify-center opacity-0 transition-opacity duration-200 ${isHovered ? 'opacity-100' : ''}`}>
             <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 text-brown-400 hover:bg-brown-100 rounded-full transition-colors"
             >
                <MoreVertical size={16} />
             </button>

             {/* Dropdown menu */}
             <AnimatePresence>
               {showActions && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className={`absolute top-0 ${isMine ? 'right-8' : 'left-8'} bg-white border border-brown-100 shadow-lg rounded-xl overflow-hidden z-20 flex flex-col min-w-[120px]`}
                 >
                   {msg.text && (
                     <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 text-xs text-brown-700 hover:bg-brown-50 transition-colors text-left w-full">
                       <Copy size={12} /> Copy
                     </button>
                   )}
                   {isMine && msg.text && !msg.gifUrl && msg.media?.length === 0 && (
                     <button onClick={() => { onEditSelect(msg); setShowActions(false); }} className="flex items-center gap-2 px-3 py-2 text-xs text-brown-700 hover:bg-brown-50 transition-colors text-left w-full">
                       <Edit2 size={12} /> Edit
                     </button>
                   )}
                   {isMine && (
                     <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left w-full border-t border-brown-50">
                       <Trash2 size={12} /> Unsend
                     </button>
                   )}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
