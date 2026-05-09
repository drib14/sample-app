import React, { useState, useRef } from 'react';
import { Image, X, Loader2 } from 'lucide-react';
import api from '../utils/api';
import Avatar from './Avatar';

const CreatePost = ({ user, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setError('');

    // Check file size (max 20MB total combined for simplicity, or per file)
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 20 * 1024 * 1024) {
      return setError('Total media size must be less than 20MB');
    }

    setMediaFiles(prev => [...prev, ...files]);

    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image'
    }));
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('content', content);
    mediaFiles.forEach(file => {
      formData.append('media', file);
    });

    try {
      const res = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('makiToken')}`
        }
      });

      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      if (onPostCreated) onPostCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brown-100 p-4 sm:p-6 mb-6">
      <div className="flex gap-4">
        <Avatar user={user} />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-brown-50 border border-transparent focus:border-brown-200 rounded-xl p-3 text-brown-900 resize-none outline-none custom-scrollbar"
            rows="3"
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {mediaPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {mediaPreviews.map((media, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-brown-200">
                  {media.type === 'video' ? (
                    <video src={media.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={media.url} alt="preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => removeMedia(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-brown-500 hover:bg-brown-50 px-3 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                <Image size={18} />
                Photo/Video
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && mediaFiles.length === 0)}
              className="bg-brown-600 hover:bg-brown-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
