import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import Avatar from './Avatar';
import MediaCarousel from './MediaCarousel';
import ReactionPicker from './ReactionPicker';
import CommentItem from './CommentItem';
import GifPicker from './GifPicker';
import api from '../utils/api';

const PostItem = ({ post, currentUser }) => {
  const [reactions, setReactions] = useState(post.reactions || []);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // stores comment object if replying
  const [loadingComments, setLoadingComments] = useState(false);

  const handleReact = async (emoji) => {
    try {
      const res = await api.post(`/posts/${post._id}/react`, { emoji }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setReactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/posts/${post._id}/comments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setComments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const submitComment = async (gifUrl = null) => {
    if (!commentText.trim() && !gifUrl) return;

    try {
      const res = await api.post(`/posts/${post._id}/comments`, {
        content: commentText,
        gifUrl: gifUrl,
        parentCommentId: replyingTo?._id || null
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });

      setComments([...comments, res.data]);
      setCommentText('');
      setReplyingTo(null);
      setShowGifPicker(false);
    } catch (err) {
      console.error(err);
    }
  };

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  // Organize comments into top-level and replies
  const topLevelComments = comments.filter(c => !c.parentComment);
  const replies = comments.filter(c => c.parentComment);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brown-100 p-4 sm:p-6 mb-6">
      {/* Post Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar user={post.author} />
        <div>
          <h3 className="font-bold text-brown-900 flex items-center gap-2">
            {post.author.firstName} {post.author.lastName}
            <span className="text-sm font-normal text-brown-400">@{post.author.username}</span>
          </h3>
          <p className="text-xs text-brown-400">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {post.content && <p className="text-brown-800 whitespace-pre-wrap leading-relaxed">{post.content}</p>}
        <MediaCarousel media={post.media} />
      </div>

      {/* Reactions Display */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="flex items-center gap-2 mb-4 py-2 border-b border-brown-50">
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <span key={emoji} className="flex items-center gap-1 bg-brown-50 text-brown-700 px-2.5 py-1 rounded-full text-sm">
              {emoji} {count}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-2 border-t border-brown-50">
        <ReactionPicker onReact={handleReact} currentReactions={reactions} currentUserId={currentUser._id} />

        <button
          onClick={toggleComments}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-brown-500 hover:bg-brown-50 transition-colors font-medium"
        >
          <MessageCircle size={20} />
          Comment
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-brown-100">
          {loadingComments ? (
            <p className="text-center text-brown-400 text-sm">Loading comments...</p>
          ) : (
            <div className="space-y-4 mb-4">
              {topLevelComments.map(comment => (
                <div key={comment._id}>
                  <CommentItem
                    comment={comment}
                    currentUser={currentUser}
                    onReplyClick={setReplyingTo}
                  />
                  {/* Render Replies */}
                  <div className="ml-10 border-l-2 border-brown-100 pl-4">
                    {replies.filter(r => r.parentComment === comment._id).map(reply => (
                      <CommentItem
                        key={reply._id}
                        comment={reply}
                        currentUser={currentUser}
                        onReplyClick={setReplyingTo}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          <div className="flex flex-col gap-2">
            {replyingTo && (
              <div className="flex items-center justify-between text-sm text-brown-500 bg-brown-50 p-2 rounded-lg">
                <span>Replying to <span className="font-semibold">{replyingTo.author.firstName}</span></span>
                <button onClick={() => setReplyingTo(null)} className="text-red-400 hover:text-red-600">Cancel</button>
              </div>
            )}

            <div className="flex items-end gap-3 relative">
              <Avatar user={currentUser} size="sm" />
              <div className="flex-1 relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                  className="w-full bg-brown-50 border border-transparent focus:border-brown-200 rounded-xl px-4 py-3 text-brown-900 resize-none outline-none text-sm"
                  rows="1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                />

                <div className="absolute right-2 bottom-2">
                  <button
                    onClick={() => setShowGifPicker(!showGifPicker)}
                    className="p-1.5 text-brown-400 hover:text-brown-600 rounded-lg hover:bg-brown-100 transition-colors"
                  >
                    <span className="font-bold text-xs">GIF</span>
                  </button>
                </div>

                <AnimatePresence>
                  {showGifPicker && (
                    <GifPicker
                      onSelect={(url) => submitComment(url)}
                      onClose={() => setShowGifPicker(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostItem;
