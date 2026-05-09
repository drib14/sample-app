import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Image, X, Loader2, Smile, MapPin, ListPlus, UserPlus } from 'lucide-react';
import api from '../utils/api';
import axios from 'axios';
import Avatar from './Avatar';
import ModalWrapper from './ModalWrapper';
import MentionsTextarea from './MentionsTextarea';

const feelings = ['Happy', 'Sad', 'Excited', 'Angry', 'Loved', 'Crazy', 'Blessed', 'Tired', 'Chill'];

const CreatePost = ({ user, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Post Options State
  const [feeling, setFeeling] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'feeling', 'location', 'tag', 'poll'
  const fileInputRef = useRef(null);

  // Location search state
  const [locQuery, setLocQuery] = useState('');
  const [locResults, setLocResults] = useState([]);

  // User search state
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);

  // Address Auto-complete using LocationIQ
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (locQuery.length > 2 && activeModal === 'location') {
        const token = import.meta.env.VITE_LOCATIONIQ_ACCESS_TOKEN;
        axios.get(`https://us1.locationiq.com/v1/autocomplete.php?key=${token}&q=${locQuery}&limit=5&format=json`)
          .then(res => setLocResults(res.data))
          .catch(err => console.error(err));
      } else {
        setLocResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [locQuery, activeModal]);

  // User search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (userQuery.length > 1 && activeModal === 'tag') {
        api.get(`/users/search?query=${userQuery}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
        })
        .then(res => setUserResults(res.data))
        .catch(err => console.error(err));
      } else {
        setUserResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [userQuery, activeModal]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (pollQuestion) {
      toast.error('You cannot add media to a poll post.');
      return;
    }

    if (mediaFiles.length + files.length > 100) {
      toast.error('You can only upload up to 100 files.');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 20MB limit.`);
        return false;
      }
      return true;
    });

    setMediaFiles(prev => [...prev, ...validFiles]);

    const newPreviews = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image'
    }));
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (userToTag) => {
    if (tags.find(t => t._id === userToTag._id)) {
      setTags(tags.filter(t => t._id !== userToTag._id));
    } else {
      setTags([...tags, userToTag]);
    }
  };

  const handlePollOptionChange = (idx, val) => {
    const newOpts = [...pollOptions];
    newOpts[idx] = val;
    setPollOptions(newOpts);
  };

  const handleSubmit = async () => {
    const hasPollOptions = pollOptions.filter(o => o.trim()).length >= 2;
    if (!content.trim() && mediaFiles.length === 0 && (!pollQuestion || !hasPollOptions)) {
      toast.error('Post must contain text, media, or a valid poll (min 2 options)');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('content', content);
    if (feeling) formData.append('feeling', feeling);
    if (location) formData.append('location', location);
    if (tags.length > 0) formData.append('tags', JSON.stringify(tags.map(t => t._id)));

    if (pollQuestion && hasPollOptions) {
      formData.append('pollQuestion', pollQuestion);
      formData.append('pollOptions', JSON.stringify(pollOptions.filter(o => o.trim())));
    }

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

      // Reset everything
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setFeeling('');
      setLocation('');
      setTags([]);
      setPollQuestion('');
      setPollOptions(['', '']);

      toast.success('Post created successfully!');
      if (onPostCreated) onPostCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const openPollModal = () => {
    if (mediaFiles.length > 0) {
      toast.error('You cannot add a poll to a post with media.');
      return;
    }
    setActiveModal('poll');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brown-100 p-4 sm:p-6 mb-6">

      {/* Context Header (Feeling, Tags, Location) */}
      {(feeling || tags.length > 0 || location) && (
        <div className="flex flex-wrap gap-x-2 gap-y-1 items-center text-sm text-brown-600 mb-3 pb-3 border-b border-brown-50">
          <span>{user.firstName} is</span>
          {feeling && <span className="font-semibold text-brown-800">feeling {feeling}</span>}
          {tags.length > 0 && (
            <span>
              with <span className="font-semibold text-brown-800">{tags.length} others</span>
            </span>
          )}
          {location && (
            <span>
              at <span className="font-semibold text-brown-800">{location}</span>
            </span>
          )}
          <button onClick={() => { setFeeling(''); setTags([]); setLocation(''); }} className="text-xs text-red-400 hover:text-red-600 ml-2">Clear</button>
        </div>
      )}

      <div className="flex gap-4">
        <Avatar user={user} />
        <div className="flex-1">
          <MentionsTextarea
            value={content}
            onChange={setContent}
            placeholder="What's on your mind? Mention someone with @"
            className="w-full bg-brown-50 border border-transparent focus:border-brown-200 rounded-xl p-3 text-brown-900 resize-none outline-none custom-scrollbar"
            rows="3"
          />

          {pollQuestion && (
            <div className="mt-3 p-4 bg-brown-50 rounded-xl border border-brown-200">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-brown-900">Poll: {pollQuestion}</h4>
                <button onClick={() => {setPollQuestion(''); setPollOptions(['','']);}} className="text-red-400"><X size={16}/></button>
              </div>
              <ul className="text-sm text-brown-600 list-disc pl-5">
                {pollOptions.filter(o => o.trim()).map((opt, i) => <li key={i}>{opt}</li>)}
              </ul>
            </div>
          )}

          {mediaPreviews.length > 0 && (
            <div className="flex overflow-x-auto gap-2 mt-3 pb-2 custom-scrollbar snap-x">
              {mediaPreviews.map((media, idx) => (
                <div key={idx} className="relative w-32 h-32 shrink-0 rounded-lg overflow-hidden border border-brown-200 snap-center">
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

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-y-3 mt-4 pt-3 border-t border-brown-50">
            <div className="flex flex-wrap gap-1 sm:gap-2">
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
                className="p-2 text-brown-500 hover:bg-brown-50 rounded-lg transition-colors flex items-center justify-center"
                title="Photo/Video"
              >
                <Image size={20} />
              </button>
              <button
                onClick={() => setActiveModal('tag')}
                className="p-2 text-brown-500 hover:bg-brown-50 rounded-lg transition-colors flex items-center justify-center"
                title="Tag Friends"
              >
                <UserPlus size={20} />
              </button>
              <button
                onClick={() => setActiveModal('feeling')}
                className="p-2 text-brown-500 hover:bg-brown-50 rounded-lg transition-colors flex items-center justify-center"
                title="Feeling/Activity"
              >
                <Smile size={20} />
              </button>
              <button
                onClick={() => setActiveModal('location')}
                className="p-2 text-brown-500 hover:bg-brown-50 rounded-lg transition-colors flex items-center justify-center"
                title="Check in Location"
              >
                <MapPin size={20} />
              </button>
              <button
                onClick={openPollModal}
                className="p-2 text-brown-500 hover:bg-brown-50 rounded-lg transition-colors flex items-center justify-center"
                title="Create Poll"
              >
                <ListPlus size={20} />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && mediaFiles.length === 0 && !pollQuestion)}
              className="bg-brown-600 hover:bg-brown-700 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModalWrapper isOpen={activeModal === 'feeling'} onClose={() => setActiveModal(null)} title="How are you feeling?">
        <div className="p-4 grid grid-cols-2 gap-2">
          {feelings.map(f => (
            <button
              key={f}
              onClick={() => { setFeeling(f); setActiveModal(null); }}
              className={`p-3 rounded-xl border ${feeling === f ? 'bg-brown-100 border-brown-300 font-bold' : 'bg-white border-brown-100 hover:bg-brown-50'} text-brown-800 transition-colors text-center`}
            >
              {f}
            </button>
          ))}
        </div>
      </ModalWrapper>

      <ModalWrapper isOpen={activeModal === 'location'} onClose={() => setActiveModal(null)} title="Search Location">
        <div className="p-4">
          <input
            type="text"
            placeholder="Where are you?"
            value={locQuery}
            onChange={e => setLocQuery(e.target.value)}
            className="w-full bg-brown-50 border border-brown-200 rounded-xl p-3 outline-none focus:border-brown-500 text-brown-900 mb-2"
          />
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {locResults.map(loc => (
              <button
                key={loc.place_id}
                onClick={() => { setLocation(loc.display_name.split(',')[0]); setActiveModal(null); }}
                className="w-full text-left p-3 hover:bg-brown-50 border-b border-brown-50 text-brown-800 text-sm"
              >
                {loc.display_name}
              </button>
            ))}
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper isOpen={activeModal === 'tag'} onClose={() => setActiveModal(null)} title="Tag Friends">
        <div className="p-4 flex flex-col h-[60vh]">
          <input
            type="text"
            placeholder="Search users..."
            value={userQuery}
            onChange={e => setUserQuery(e.target.value)}
            className="w-full bg-brown-50 border border-brown-200 rounded-xl p-3 outline-none focus:border-brown-500 text-brown-900 mb-4"
          />
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {userResults.map(u => {
              const isSelected = tags.find(t => t._id === u._id);
              return (
                <button
                  key={u._id}
                  onClick={() => toggleTag(u)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1 transition-colors ${isSelected ? 'bg-brown-100' : 'hover:bg-brown-50'}`}
                >
                  <Avatar user={u} size="md" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-brown-900">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-brown-500">@{u.username}</p>
                  </div>
                  {isSelected && <div className="w-5 h-5 bg-brown-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                </button>
              );
            })}
          </div>
          <button onClick={() => setActiveModal(null)} className="w-full py-3 bg-brown-600 text-white rounded-xl font-medium mt-4">
            Done
          </button>
        </div>
      </ModalWrapper>

      <ModalWrapper isOpen={activeModal === 'poll'} onClose={() => setActiveModal(null)} title="Create Poll">
        <div className="p-4 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Ask a question..."
            value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)}
            className="w-full bg-white border border-brown-200 rounded-xl p-3 outline-none focus:border-brown-500 text-brown-900 font-medium"
          />

          <div className="space-y-2">
            {pollOptions.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={e => handlePollOptionChange(idx, e.target.value)}
                className="w-full bg-brown-50 border border-brown-100 rounded-xl p-3 outline-none focus:border-brown-400 text-brown-800 text-sm"
              />
            ))}
          </div>

          {pollOptions.length < 5 && (
            <button
              onClick={() => setPollOptions([...pollOptions, ''])}
              className="text-brown-500 font-medium text-sm self-start hover:text-brown-700 p-2"
            >
              + Add Option
            </button>
          )}

          <button onClick={() => setActiveModal(null)} className="w-full py-3 bg-brown-600 text-white rounded-xl font-medium mt-2">
            Save Poll
          </button>
        </div>
      </ModalWrapper>

    </div>
  );
};

export default CreatePost;
