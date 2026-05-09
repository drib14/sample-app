import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import CreatePost from '../components/CreatePost';
import PostItem from '../components/PostItem';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('makiUser');
    const token = localStorage.getItem('makiToken');

    if (!storedUser || !token) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
      fetchPosts();
    }
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('makiUser');
    localStorage.removeItem('makiToken');
    navigate('/login');
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brown-50">
      {/* Navbar */}
      <nav className="bg-white sticky top-0 z-40 border-b border-brown-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brown-900 flex items-center gap-2">
            <lord-icon
              src="https://cdn.lordicon.com/surcxhka.json"
              trigger="hover"
              colors="primary:#a18072,secondary:#43302b"
              style={{ width: '32px', height: '32px' }}
            ></lord-icon>
            Maki
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-brown-100 hover:bg-brown-200 text-brown-900 rounded-lg transition-colors font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <CreatePost user={user} onPostCreated={handlePostCreated} />

        <div className="space-y-6">
          {loadingPosts ? (
            <div className="flex justify-center py-8">
              <lord-icon
                src="https://cdn.lordicon.com/xjovhxra.json"
                trigger="loop"
                colors="primary:#a18072,secondary:#43302b"
                style={{ width: '50px', height: '50px' }}
              ></lord-icon>
            </div>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <PostItem key={post._id} post={post} currentUser={user} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-brown-100">
              <p className="text-brown-500">No posts yet. Be the first to share something!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
