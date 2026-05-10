import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Search } from 'lucide-react';
import Avatar from './Avatar';
import api from '../utils/api';

const LeftSidebar = ({ user }) => {
  const [savedPosts, setSavedPosts] = useState([]);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await api.get('/users/saved', {
          headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
        });
        setSavedPosts(res.data.slice(0, 3)); // Only show top 3
      } catch (err) {
        console.error(err);
      }
    };
    fetchSaved();
  }, [user?.savedPosts]);

  if (!user) return null;

  return (
    <div className="w-full space-y-6">
      {/* Profile Snapshot */}
      <div className="bg-white rounded-2xl shadow-sm border border-brown-100 overflow-hidden">
        <div className="h-20 bg-brown-200"></div>
        <div className="px-5 pb-5 relative flex flex-col items-center -mt-10">
          <Link to={`/profile/${user.username}`}>
            <div className="p-1 bg-white rounded-full">
              <Avatar user={user} size="lg" />
            </div>
          </Link>
          <Link to={`/profile/${user.username}`}>
            <h2 className="mt-2 text-lg font-bold text-brown-900 hover:underline">
              {user.firstName} {user.lastName}
            </h2>
          </Link>
          <p className="text-sm text-brown-500">@{user.username}</p>
        </div>
        <div className="border-t border-brown-50 p-4 space-y-3">
          <Link to={`/profile/${user.username}`} className="flex items-center gap-3 text-brown-600 hover:text-brown-900 transition-colors">
            <Search size={18} />
            <span className="font-medium text-sm">View Profile</span>
          </Link>
        </div>
      </div>

      {/* Saved Posts Snapshot */}
      <div className="bg-white rounded-2xl shadow-sm border border-brown-100 p-5">
        <div className="flex items-center gap-2 mb-4 text-brown-900">
          <Bookmark size={20} className="text-primary" />
          <h3 className="font-bold">Recent Saved</h3>
        </div>
        {savedPosts.length > 0 ? (
          <div className="space-y-3">
            {savedPosts.map(post => (
              <Link
                key={post._id}
                to={`/post/${post._id}`}
                className="block p-3 bg-brown-50 hover:bg-brown-100 rounded-xl transition-colors border border-transparent hover:border-brown-200"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Avatar user={post.author} size="xs" />
                  <span className="text-xs font-semibold text-brown-900 truncate">
                    {post.author?.firstName} {post.author?.lastName}
                  </span>
                </div>
                <p className="text-xs text-brown-600 line-clamp-2">
                  {post.content || (post.media?.length ? 'Shared media' : 'Shared a post')}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brown-400 text-center py-4">No saved posts yet.</p>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
