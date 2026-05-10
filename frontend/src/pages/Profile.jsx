import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2 } from 'lucide-react';
import api from '../utils/api';
import PostItem from '../components/PostItem';
import Avatar from '../components/Avatar';
import EditProfileModal from '../components/EditProfileModal';
import { format } from 'date-fns';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('makiUser');
    const token = localStorage.getItem('makiToken');
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }
    setCurrentUser(JSON.parse(storedUser));
  }, [navigate]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const userRes = await api.get(`/users/${username}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setProfileUser(userRes.data);

      const postsRes = await api.get(`/posts/user/${username}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      setPosts(postsRes.data);
    } catch (err) {
      console.error('Failed to fetch profile data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [username]);

  const handleProfileUpdated = (updatedUser) => {
    setProfileUser(updatedUser);
    if (currentUser && currentUser._id === updatedUser._id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('makiUser', JSON.stringify(updatedUser));
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <lord-icon
          src="https://cdn.lordicon.com/xjovhxra.json"
          trigger="loop"
          colors="primary:#a18072,secondary:#43302b"
          style={{ width: '50px', height: '50px' }}
        ></lord-icon>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-brown-50 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-brown-900 mb-4">User not found</h2>
        <Link to="/dashboard" className="text-brown-500 hover:text-brown-700 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser._id === profileUser._id;

  return (
    <div className="min-h-screen bg-brown-50">
      <nav className="bg-white sticky top-0 z-40 border-b border-brown-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 text-brown-500 hover:bg-brown-50 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-brown-900">{profileUser.firstName}'s Profile</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-brown-100 p-8 mb-8 relative">
          {isOwnProfile && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-6 right-6 p-2 text-brown-500 hover:text-brown-700 hover:bg-brown-50 rounded-full transition-colors"
              title="Edit Profile"
            >
              <Edit2 size={20} />
            </button>
          )}

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0">
              {profileUser.profilePicture ? (
                <img src={profileUser.profilePicture} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-brown-100" />
              ) : (
                <div className="w-32 h-32 bg-brown-200 rounded-full flex items-center justify-center text-4xl font-bold text-brown-600 border-4 border-brown-100">
                  {profileUser.firstName[0].toUpperCase()}{profileUser.lastName[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-brown-900 mb-1">
                {profileUser.firstName} {profileUser.lastName}
              </h2>
              <p className="text-brown-500 font-medium mb-4">@{profileUser.username}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-brown-700 bg-brown-50 p-4 rounded-xl">
                <div>
                  <span className="font-semibold text-brown-900 block mb-0.5">Location</span>
                  {profileUser.address}
                </div>
                <div>
                  <span className="font-semibold text-brown-900 block mb-0.5">Joined</span>
                  {format(new Date(profileUser.createdAt), 'MMMM yyyy')}
                </div>
                <div>
                  <span className="font-semibold text-brown-900 block mb-0.5">Gender</span>
                  <span className="capitalize">{profileUser.gender}</span>
                </div>
                <div>
                  <span className="font-semibold text-brown-900 block mb-0.5">Birthday</span>
                  {format(new Date(profileUser.dob), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Posts */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-brown-900 px-2">Posts</h3>
          {posts.length > 0 ? (
            posts.map(post => (
              <PostItem
                key={post._id}
                post={post}
                currentUser={currentUser}
                onPostDeleted={() => handlePostDeleted(post._id)}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-brown-100">
              <p className="text-brown-500">No posts to show.</p>
            </div>
          )}
        </div>
      </main>

      {isEditModalOpen && (
        <EditProfileModal
          user={profileUser}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleProfileUpdated}
        />
      )}
    </div>
  );
};

export default Profile;
