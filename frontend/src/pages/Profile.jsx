import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, User as UserIcon, Upload } from 'lucide-react';
import api from '../utils/api';
import PostItem from '../components/PostItem';
import Navbar from '../components/Navbar';
import EditableProfileCard from '../components/EditableProfileCard';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

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

  useEffect(() => {
    import('../utils/socket').then(({ default: socket }) => {
      socket.on('post_deleted', (deletedPostId) => {
        setPosts(prevPosts => prevPosts.filter(p => p._id !== deletedPostId));
      });
    });
    return () => {
      import('../utils/socket').then(({ default: socket }) => {
        socket.off('post_deleted');
      });
    }
  }, []);

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

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const res = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('makiToken')}`
        }
      });

      toast.success('Profile picture updated!');
      handleProfileUpdated(res.data);
    } catch (err) {
      toast.error('Failed to update profile picture');
    }
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
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Editable Info Cards */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-brown-100 flex flex-col items-center text-center relative group">
            <div className="relative mb-4">
              {profileUser.profilePicture ? (
                <img src={profileUser.profilePicture} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-brown-100" />
              ) : (
                <div className="w-32 h-32 bg-brown-200 rounded-full flex items-center justify-center text-4xl font-bold text-brown-600 border-4 border-brown-100">
                  {profileUser.firstName[0].toUpperCase()}{profileUser.lastName[0].toUpperCase()}
                </div>
              )}
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 p-2 bg-brown-500 hover:bg-brown-600 text-white rounded-full cursor-pointer shadow-sm transition-colors opacity-0 group-hover:opacity-100">
                  <Upload size={16} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} />
                </label>
              )}
            </div>

            <h2 className="text-2xl font-bold text-brown-900 mb-1">
              {profileUser.firstName} {profileUser.lastName}
            </h2>
            <p className="text-brown-500 font-medium mb-2">@{profileUser.username}</p>
          </div>

          <EditableProfileCard
            title="First Name"
            icon={UserIcon}
            field="firstName"
            value={profileUser.firstName}
            isEditable={isOwnProfile}
            onUpdate={handleProfileUpdated}
          />
          <EditableProfileCard
            title="Last Name"
            icon={UserIcon}
            field="lastName"
            value={profileUser.lastName}
            isEditable={isOwnProfile}
            onUpdate={handleProfileUpdated}
          />
          <EditableProfileCard
            title="Location"
            icon={MapPin}
            field="address"
            value={profileUser.address}
            isEditable={isOwnProfile}
            onUpdate={handleProfileUpdated}
          />

          {/* Read-only cards */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-brown-100 flex flex-col">
            <div className="flex items-center gap-3 mb-3 text-brown-900 font-semibold">
              <div className="p-2 bg-brown-50 rounded-lg text-brown-600">
                <Clock size={20} />
              </div>
              Joined
            </div>
            <span className="text-brown-700 text-sm">{format(new Date(profileUser.createdAt), 'MMMM yyyy')}</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-brown-100 flex flex-col">
            <div className="flex items-center gap-3 mb-3 text-brown-900 font-semibold">
              <div className="p-2 bg-brown-50 rounded-lg text-brown-600">
                <Calendar size={20} />
              </div>
              Birthday
            </div>
            <span className="text-brown-700 text-sm">{format(new Date(profileUser.dob), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Center/Right Column: User's Posts */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-xl font-bold text-brown-900 px-2">{isOwnProfile ? "My Posts" : `${profileUser.firstName}'s Posts`}</h3>
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
    </div>
  );
};

export default Profile;
