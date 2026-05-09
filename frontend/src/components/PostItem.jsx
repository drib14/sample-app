import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import Avatar from './Avatar';
import MediaCarousel from './MediaCarousel';
import ReactionPicker from './ReactionPicker';
import CommentItem from './CommentItem';
import GifPicker from './GifPicker';
import DropdownMenu from './DropdownMenu';
import ReactionsModal from './ReactionsModal';
import api from '../utils/api';

const PostItem = ({ post, currentUser, onPostDeleted }) => {
  const [reactions, setReactions] = useState(post.reactions || []);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [currentContent, setCurrentContent] = useState(post.content || '');

  // Reactions Modal state
  const [showReactionsModal, setShowReactionsModal] = useState(false);

  const isAuthor = currentUser._id === post.author._id;

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

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await api.put(`/posts/${post._id}`, { content: editContent }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setCurrentContent(res.data.content);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      if (onPostDeleted) onPostDeleted(post._id);
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

  const handleCommentDeleted = (commentId) => {
    setComments(comments.filter(c => c._id !== commentId && c.parentComment !== commentId));
  };

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const topLevelComments = comments.filter(c => !c.parentComment);

  // Recursive function to render replies
  const renderReplies = (parentId, depth = 1) => {
    const replies = comments.filter(c => c.parentComment === parentId);
    if (replies.length === 0) return null;

    // Prevent nesting too deep on UI
    const paddingLeft = depth > 3 ? 'pl-2' : 'pl-4';

    return (
      <div className={`ml-4 sm:ml-10 border-l-2 border-brown-100 ${paddingLeft}`}>
        {replies.map(reply => (
          <div key={reply._id}>
            <CommentItem
              comment={reply}
              currentUser={currentUser}
              onReplyClick={setReplyingTo}
              onCommentDeleted={handleCommentDeleted}
            />
            {renderReplies(reply._id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brown-100 p-4 sm:p-6 mb-6 relative">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
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
        <DropdownMenu
          isAuthor={isAuthor}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
        />
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {isEditing ? (
          <div className="w-full bg-brown-50 border border-brown-200 rounded-xl p-3 flex flex-col gap-2 mb-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full resize-none outline-none text-brown-900 bg-transparent custom-scrollbar"
              rows="3"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm font-medium text-brown-500 hover:bg-brown-100 rounded-lg">
                Cancel
              </button>
              <button onClick={handleUpdate} className="px-3 py-1 text-sm font-medium text-white bg-brown-600 hover:bg-brown-700 rounded-lg">
                Save
              </button>
            </div>
          </div>
        ) : (
          currentContent && <p className="text-brown-800 whitespace-pre-wrap leading-relaxed">{currentContent}</p>
        )}
        <MediaCarousel media={post.media} />
      </div>

      {/* Reactions Display */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="flex items-center gap-2 mb-4 py-2 border-b border-brown-50">
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => setShowReactionsModal(true)}
              className="flex items-center gap-1 bg-brown-50 hover:bg-brown-100 text-brown-700 px-2.5 py-1 rounded-full text-sm transition-colors"
            >
              {emoji} {count}
            </button>
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
                    onCommentDeleted={handleCommentDeleted}
                  />
                  {/* Recursively Render Replies */}
                  {renderReplies(comment._id)}
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
              <div className="flex-1 relative flex items-center bg-brown-50 border border-transparent focus-within:border-brown-200 rounded-xl px-2 py-1 transition-colors">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                  className="w-full bg-transparent px-2 py-2 text-brown-900 resize-none outline-none text-sm custom-scrollbar"
                  rows="1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                />

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setShowGifPicker(!showGifPicker)}
                    className="p-2 text-brown-400 hover:text-brown-600 rounded-lg hover:bg-brown-100 transition-colors flex items-center justify-center"
                    title="Add GIF"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                      <path d="M6 10v4"></path>
                      <path d="M10 10v4"></path>
                      <path d="M14 10v4"></path>
                      <path d="M18 10v4"></path>
                      <path d="M6 10h12"></path>
                      <path d="M6 14h12"></path>
                    </svg>
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => submitComment()}
                    disabled={!commentText.trim() && !replyingTo}
                    className="p-2 bg-brown-500 hover:bg-brown-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:bg-brown-300 shadow-sm ml-1 flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ x: 0, y: 0 }}
                      whileTap={{ x: 10, y: -10, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Send size={16} className="-ml-0.5 mt-0.5" />
                    </motion.div>
                  </motion.button>
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

      <ReactionsModal
        isOpen={showReactionsModal}
        onClose={() => setShowReactionsModal(false)}
        reactions={reactions}
      />
    </div>
  );
};

export default PostItem;
