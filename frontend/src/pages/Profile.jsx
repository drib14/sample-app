import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, User as UserIcon, Upload, Briefcase, Heart, BookOpen, GraduationCap, School } from 'lucide-react';
import api from '../utils/api';
import socket from '../utils/socket';
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
  const [media, setMedia] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('makiUser');
    const token = localStorage.getItem('makiToken');
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('join_user_room', parsedUser._id);
  }, [navigate]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem('makiToken')}` };

      const userRes = await api.get(`/users/${username}`, { headers });
      setProfileUser(userRes.data);

      const postsRes = await api.get(`/posts/user/${username}`, { headers });
      setPosts(postsRes.data);

      const mediaRes = await api.get(`/posts/user/${username}/media`, { headers });
      setMedia(mediaRes.data);

      const connectionsRes = await api.get(`/connections/${username}`, { headers });
      setFriends(connectionsRes.data);

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
    socket.on('post_deleted', (deletedPostId) => {
      setPosts(prevPosts => prevPosts.filter(p => p._id !== deletedPostId));
    });

    socket.on('user_status_change', ({ userId, isOnline }) => {
      if (profileUser && profileUser._id === userId) {
        setProfileUser(prev => ({ ...prev, isOnline }));
      }
    });

    return () => {
      socket.off('post_deleted');
      socket.off('user_status_change');
    }
  }, [profileUser]);

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

            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-brown-900">
                {profileUser.firstName} {profileUser.lastName}
              </h2>
              {profileUser.isOnline && (
                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" title="Online now"></div>
              )}
            </div>
            <p className="text-brown-500 font-medium mb-2">@{profileUser.username}</p>
          </div>

          <EditableProfileCard
            title="Mini Bio"
            icon={UserIcon}
            field="bio"
            value={profileUser.bio}
            isEditable={isOwnProfile}
            onUpdate={handleProfileUpdated}
          />

          {/* Intro Snapshot */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-brown-100 space-y-4">
            <h3 className="font-bold text-brown-900">Intro</h3>

            <EditableProfileCard
              title="Address"
              icon={MapPin}
              field="address"
              value={profileUser.address}
              isEditable={isOwnProfile}
              onUpdate={handleProfileUpdated}
            />

            <div className="flex items-start gap-3 text-brown-700 text-sm">
              <div className="p-2 bg-brown-50 rounded-lg text-brown-600 shrink-0">
                <Calendar size={18} />
              </div>
              <div className="flex flex-col pt-1">
                <span className="font-semibold text-brown-900">Date of Birth</span>
                <span>{format(new Date(profileUser.dob), 'MMM d, yyyy')}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-brown-700 text-sm">
              <div className="p-2 bg-brown-50 rounded-lg text-brown-600 shrink-0">
                <Clock size={18} />
              </div>
              <div className="flex flex-col pt-1">
                <span className="font-semibold text-brown-900">Joined</span>
                <span>{format(new Date(profileUser.createdAt), 'MMMM yyyy')}</span>
              </div>
            </div>
          </div>

          <Link to={`/profile/${username}/about`} className="block w-full text-center py-3 bg-white hover:bg-brown-50 border border-brown-100 rounded-xl font-bold text-brown-700 transition-colors shadow-sm">
            See more info about {profileUser.firstName}
          </Link>

          {/* Media Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brown-100">
             <h3 className="font-bold text-brown-900 mb-4 flex items-center justify-between">
               Photos & Videos
               <span className="text-sm font-normal text-brown-500">{media.length} items</span>
             </h3>
             {media.length > 0 ? (
               <div className="grid grid-cols-3 gap-2">
                 {media.slice(0, 9).map((m, i) => (
                   <div key={i} className="aspect-square bg-brown-100 rounded-lg overflow-hidden relative">
                     {m.type === 'image' ? (
                       <img src={m.url} alt="Media" className="w-full h-full object-cover" />
                     ) : (
                       <video src={m.url} className="w-full h-full object-cover" />
                     )}
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-brown-500 text-center py-4">No media available.</p>
             )}
          </div>

          {/* Connections Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brown-100">
             <h3 className="font-bold text-brown-900 mb-4 flex items-center justify-between">
               Connections
               <span className="text-sm font-normal text-brown-500">{friends.length} friends</span>
             </h3>
             {friends.length > 0 ? (
               <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar">
                 {friends.map(friend => (
                   <Link key={friend._id} to={`/profile/${friend.username}`} className="flex flex-col items-center gap-2 min-w-[80px]">
                     <div className="relative">
                       {friend.profilePicture ? (
                         <img src={friend.profilePicture} alt="Friend" className="w-16 h-16 rounded-full object-cover border border-brown-100" />
                       ) : (
                         <div className="w-16 h-16 bg-brown-200 rounded-full flex items-center justify-center font-bold text-brown-600 text-xl border border-brown-100">
                           {friend.firstName[0]}{friend.lastName[0]}
                         </div>
                       )}
                       {friend.isOnline && (
                         <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                       )}
                     </div>
                     <span className="text-xs font-semibold text-brown-800 truncate w-full text-center">{friend.firstName}</span>
                   </Link>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-brown-500 text-center py-4">No connections yet.</p>
             )}
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
