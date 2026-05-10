import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import PostItem from '../components/PostItem';
import { ArrowLeft } from 'lucide-react';
import socket from '../utils/socket';

const SinglePost = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('makiUser');
    const token = localStorage.getItem('makiToken');

    if (!storedUser || !token) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('join_user_room', parsedUser._id);

      fetchPost();
    }
  }, [navigate, id]);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/posts/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setPost(res.data);
    } catch (err) {
      console.error('Failed to fetch post', err);
      // Navigate to 404 page if not found
      navigate('/not-found', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeleted = () => {
    navigate('/dashboard');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brown-50 pb-20 md:pb-0">
      <Navbar user={user} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 text-brown-500 hover:bg-white rounded-full transition-colors bg-brown-100/50">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-brown-900">Post</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <lord-icon src="https://cdn.lordicon.com/xjovhxra.json" trigger="loop" colors="primary:#a18072,secondary:#43302b" style={{ width: '50px', height: '50px' }}></lord-icon>
          </div>
        ) : post ? (
          <PostItem post={post} currentUser={user} onPostDeleted={handlePostDeleted} />
        ) : null}
      </main>
    </div>
  );
};

export default SinglePost;
