import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import Avatar from './Avatar';
import ReactionPicker from './ReactionPicker';
import api from '../utils/api';

const CommentItem = ({ comment, currentUser, onReplyClick }) => {
  const [reactions, setReactions] = useState(comment.reactions || []);

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

  // Group reactions for display
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex gap-3 mb-4">
      <Avatar user={comment.author} size="sm" />
      <div className="flex-1">
        <div className="bg-brown-50 rounded-2xl px-4 py-2 inline-block">
          <p className="font-semibold text-sm text-brown-900">
            {comment.author.firstName} {comment.author.lastName}
          </p>
          {comment.content && <p className="text-sm text-brown-800 mt-1">{comment.content}</p>}
          {comment.gifUrl && (
            <img src={comment.gifUrl} alt="GIF comment" className="mt-2 rounded-lg max-w-xs h-auto" />
          )}
        </div>

        <div className="flex items-center gap-4 mt-1 ml-2">
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
            <div className="flex items-center gap-1 bg-white border border-brown-100 rounded-full px-2 py-0.5 shadow-sm text-xs">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <span key={emoji} className="flex items-center gap-1">
                  {emoji} <span className="text-brown-500">{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
