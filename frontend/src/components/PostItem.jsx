import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import MediaCarousel from './MediaCarousel';
import ReactionPicker from './ReactionPicker';
import CommentItem from './CommentItem';
import GifPicker from './GifPicker';
import DropdownMenu from './DropdownMenu';
import ReactionsModal from './ReactionsModal';
import ConfirmModal from './ConfirmModal';
import RichText from './RichText';
import MentionsTextarea from './MentionsTextarea';
import EmojiPickerComponent from './EmojiPickerComponent';
import { Smile } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const PostItem = ({ post: initialPost, currentUser, onPostDeleted }) => {
  const [post, setPost] = useState(initialPost);
  const [reactions, setReactions] = useState(initialPost.reactions || []);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(initialPost.content || '');
  const [currentContent, setCurrentContent] = useState(initialPost.content || '');

  // Modals state
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAuthor = currentUser._id === post.author._id;

  const handleReact = async (emoji) => {
    try {
      const res = await api.post(`/posts/${post._id}/react`, { emoji }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setReactions(res.data);
    } catch (err) {
      toast.error('Failed to react');
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
      toast.success('Post updated!');
    } catch (err) {
      toast.error('Failed to update post');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      if (onPostDeleted) onPostDeleted(post._id);
      toast.success('Post deleted successfully');
    } catch (err) {
      toast.error('Failed to delete post');
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
      toast.error('Failed to load comments');
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
      toast.error('Failed to post comment');
    }
  };

  const handleCommentDeleted = (commentId) => {
    setComments(comments.filter(c => c._id !== commentId && c.parentComment !== commentId));
  };

  const handlePollVote = async (optionId) => {
    try {
      const res = await api.post(`/posts/${post._id}/poll/vote`, { optionId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setPost({ ...post, poll: res.data });
    } catch (err) {
      toast.error('Failed to vote');
    }
  };

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const topLevelComments = comments.filter(c => !c.parentComment);

  const renderReplies = (parentId, depth = 1) => {
    const replies = comments.filter(c => c.parentComment === parentId);
    if (replies.length === 0) return null;

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

  // Poll calculations
  const totalVotes = post.poll ? post.poll.options.reduce((acc, opt) => acc + opt.votes.length, 0) : 0;
  const userVotedOption = post.poll ? post.poll.options.find(opt => opt.votes.includes(currentUser._id)) : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brown-100 p-4 sm:p-6 mb-6 relative">
      {/* Context Header (Feeling, Tags, Location) */}
      {(post.feeling || (post.tags && post.tags.length > 0) || post.location) && (
        <div className="flex flex-wrap gap-x-1 gap-y-1 items-center text-sm text-brown-600 mb-3 pb-3 border-b border-brown-50">
          <Link to={`/profile/${post.author.username}`} className="font-semibold text-brown-800 hover:underline">{post.author.firstName}</Link>
          <span>is</span>
          {post.feeling && <span className="font-semibold text-brown-800">feeling {post.feeling}</span>}
          {post.tags && post.tags.length > 0 && (
            <span>
              with {' '}
              {post.tags.map((tag, i) => (
                <span key={tag._id}>
                  <Link to={`/profile/${tag.username}`} className="font-semibold text-brown-800 hover:underline">{tag.firstName}</Link>
                  {i < post.tags.length - 1 ? ', ' : ''}
                </span>
              ))}
            </span>
          )}
          {post.location && (
            <span>
              at <span className="font-semibold text-brown-800">{post.location}</span>
            </span>
          )}
        </div>
      )}

      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.author.username}`} className="shrink-0 hover:opacity-80 transition-opacity">
            <Avatar user={post.author} />
          </Link>
          <div>
            <h3 className="font-bold text-brown-900 flex items-center gap-2">
              <Link to={`/profile/${post.author.username}`} className="hover:underline">{post.author.firstName} {post.author.lastName}</Link>
            </h3>
            <p className="text-xs text-brown-400">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <DropdownMenu
          isAuthor={isAuthor}
          username={post.author.username}
          onEdit={() => setIsEditing(true)}
          onDelete={() => setShowDeleteModal(true)}
        />
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {isEditing ? (
          <div className="w-full bg-brown-50 border border-brown-200 rounded-xl p-3 flex flex-col gap-2 mb-3">
            <MentionsTextarea
              value={editContent}
              onChange={setEditContent}
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
          currentContent && <RichText text={currentContent} />
        )}

        <MediaCarousel media={post.media} />

        {/* Poll UI */}
        {post.poll && post.poll.options && (
          <div className="mt-4 p-4 border border-brown-200 rounded-xl bg-brown-50/50">
            <h4 className="font-bold text-brown-900 mb-3">{post.poll.question}</h4>
            <div className="space-y-2">
              {post.poll.options.map(opt => {
                const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
                const isSelected = userVotedOption && userVotedOption._id === opt._id;

                return (
                  <button
                    key={opt._id}
                    onClick={() => handlePollVote(opt._id)}
                    className={`relative w-full text-left overflow-hidden rounded-lg border transition-colors ${isSelected ? 'border-brown-500' : 'border-brown-200 hover:border-brown-300'}`}
                  >
                    <div
                      className={`absolute top-0 left-0 h-full transition-all duration-500 ${isSelected ? 'bg-brown-200' : 'bg-brown-100'}`}
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative z-10 px-4 py-2 flex justify-between items-center text-sm font-medium text-brown-900">
                      <span>{opt.text}</span>
                      <span>{percentage}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-brown-500 mt-2 text-right">{totalVotes} votes</p>
          </div>
        )}
      </div>

      {/* Reactions Display */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="flex items-center gap-2 mb-4 py-2 border-b border-brown-50">
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => setShowReactionsModal(true)}
              className="flex items-center gap-1 bg-brown-50 hover:bg-brown-100 text-brown-700 px-2.5 py-1 rounded-full text-sm transition-colors cursor-pointer"
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
                <MentionsTextarea
                  value={commentText}
                  onChange={setCommentText}
                  placeholder={replyingTo ? "Write a reply... Use @ to mention" : "Write a comment... Use @ to mention"}
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
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-brown-400 hover:text-brown-600 rounded-lg hover:bg-brown-100 transition-colors flex items-center justify-center"
                    title="Add Emoji"
                  >
                    <Smile size={20} />
                  </button>

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
                  {showEmojiPicker && (
                    <EmojiPickerComponent
                      onSelect={(emoji) => setCommentText(prev => prev + emoji)}
                      onClose={() => setShowEmojiPicker(false)}
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

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </div>
  );
};

export default PostItem;
