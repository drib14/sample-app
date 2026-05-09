import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Check, X } from 'lucide-react';
import Avatar from './Avatar';
import ReactionPicker from './ReactionPicker';
import DropdownMenu from './DropdownMenu';
import ReactionsModal from './ReactionsModal';
import api from '../utils/api';

const CommentItem = ({ comment, currentUser, onReplyClick, onCommentDeleted }) => {
  const [reactions, setReactions] = useState(comment.reactions || []);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');
  const [currentContent, setCurrentContent] = useState(comment.content || '');
  const [showReactionsModal, setShowReactionsModal] = useState(false);

  const isAuthor = currentUser._id === comment.author._id;

  const handleReact = async (emoji) => {
    try {
      const res = await api.post(`/comments/${comment._id}/react`, { emoji }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setReactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await api.put(`/comments/${comment._id}`, { content: editContent }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setCurrentContent(res.data.content);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.delete(`/comments/${comment._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      if (onCommentDeleted) onCommentDeleted(comment._id);
    } catch (err) {
      console.error(err);
    }
  };

  // Group reactions for display
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex gap-3 mb-4 group relative">
      <Avatar user={comment.author} size="sm" />
      <div className="flex-1 max-w-[calc(100%-2.5rem)]">
        <div className="flex items-start justify-between gap-2">
          {isEditing ? (
            <div className="w-full bg-white border border-brown-200 rounded-xl p-2 flex flex-col gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full resize-none outline-none text-sm text-brown-900 bg-transparent custom-scrollbar"
                rows="2"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="p-1 text-brown-400 hover:text-brown-600 rounded-lg hover:bg-brown-50">
                  <X size={16} />
                </button>
                <button onClick={handleUpdate} className="p-1 text-white bg-brown-500 hover:bg-brown-600 rounded-lg">
                  <Check size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-brown-50 rounded-2xl px-4 py-2 inline-block">
              <p className="font-semibold text-sm text-brown-900">
                {comment.author.firstName} {comment.author.lastName}
              </p>
              {currentContent && <p className="text-sm text-brown-800 mt-1 whitespace-pre-wrap">{currentContent}</p>}
              {comment.gifUrl && (
                <img src={comment.gifUrl} alt="GIF comment" className="mt-2 rounded-lg max-w-xs h-auto max-h-48 object-contain" />
              )}
            </div>
          )}

          {!isEditing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu
                isAuthor={isAuthor}
                onEdit={() => setIsEditing(true)}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-4 mt-1 ml-2">
          <span className="text-xs text-brown-400">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          <ReactionPicker onReact={handleReact} currentReactions={reactions} currentUserId={currentUser._id} />

          <button
            onClick={() => onReplyClick(comment)}
            className="text-xs font-medium text-brown-500 hover:text-brown-700 flex items-center gap-1"
          >
            <MessageSquare size={12} />
            Reply
          </button>

          {Object.keys(reactionCounts).length > 0 && (
            <button
              onClick={() => setShowReactionsModal(true)}
              className="flex items-center gap-1 bg-white border border-brown-100 hover:bg-brown-50 transition-colors rounded-full px-2 py-0.5 shadow-sm text-xs cursor-pointer"
            >
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <span key={emoji} className="flex items-center gap-1">
                  {emoji} <span className="text-brown-500">{count}</span>
                </span>
              ))}
            </button>
          )}
        </div>
      </div>

      <ReactionsModal
        isOpen={showReactionsModal}
        onClose={() => setShowReactionsModal(false)}
        reactions={reactions}
      />
    </div>
  );
};

export default CommentItem;
