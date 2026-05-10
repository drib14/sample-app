import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import socket from '../utils/socket';
import CreatePost from '../components/CreatePost';
import PostItem from '../components/PostItem';
import Navbar from '../components/Navbar';

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
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Setup socket globally for the authenticated session
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('join_user_room', parsedUser._id);

      fetchPosts();
    }
  }, [navigate]);

  useEffect(() => {
    socket.on('post_deleted', (deletedPostId) => {
      setPosts(prevPosts => prevPosts.filter(p => p._id !== deletedPostId));
    });

    return () => {
      socket.off('post_deleted');
    }
  }, []);

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
      <Navbar user={user} />

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
