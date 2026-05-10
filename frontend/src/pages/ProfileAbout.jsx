import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Briefcase, Heart, BookOpen, School, GraduationCap } from 'lucide-react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import EditableProfileCard from '../components/EditableProfileCard';
import RelationshipSelectCard from '../components/RelationshipSelectCard';
import { format } from 'date-fns';

const ProfileAbout = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('makiUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setCurrentUser(JSON.parse(storedUser));
  }, [navigate]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const userRes = await api.get(`/users/${username}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
        });
        setProfileUser(userRes.data);
      } catch (err) {
        console.error('Failed to fetch profile data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [username]);

  const handleProfileUpdated = (updatedUser) => {
    setProfileUser(updatedUser);
    if (currentUser && currentUser._id === updatedUser._id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('makiUser', JSON.stringify(updatedUser));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <lord-icon src="https://cdn.lordicon.com/xjovhxra.json" trigger="loop" colors="primary:#a18072,secondary:#43302b" style={{ width: '50px', height: '50px' }}></lord-icon>
      </div>
    );
  }

  if (!profileUser) return null;

  const isOwnProfile = currentUser && currentUser._id === profileUser._id;

  return (
    <div className="min-h-screen bg-brown-50">
      <Navbar user={currentUser} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to={`/profile/${username}`} className="p-2 text-brown-500 hover:bg-white rounded-full transition-colors bg-brown-100/50">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-brown-900">About {profileUser.firstName}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableProfileCard
            title="Work"
            icon={Briefcase}
            field="work"
            value={profileUser.work}
            isEditable={isOwnProfile}
            onUpdate={handleProfileUpdated}
          />
          <RelationshipSelectCard
            title="Relationship Status"
            icon={Heart}
            field="relationshipStatus"
            value={profileUser.relationshipStatus}
            isEditable={isOwnProfile}
            onUpdate={handleProfileUpdated}
          />
          <EditableProfileCard
            title="Elementary School"
            icon={BookOpen}
            field="elementary"
            value={profileUser.education?.elementary}
            isEditable={isOwnProfile}
            onUpdate={handleProfileUpdated}
          />
          <EditableProfileCard
            title="High School"
            icon={School}
            field="highSchool"
            value={profileUser.education?.highSchool}
            isEditable={isOwnProfile}
            onUpdate={handleProfileUpdated}
          />
          <EditableProfileCard
            title="College"
            icon={GraduationCap}
            field="college"
            value={profileUser.education?.college}
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
      </main>
    </div>
  );
};

export default ProfileAbout;
