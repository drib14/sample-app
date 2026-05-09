import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Profile = () => {
  const { username } = useParams();

  return (
    <div className="min-h-screen bg-brown-50">
      <nav className="bg-white sticky top-0 z-40 border-b border-brown-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 text-brown-500 hover:bg-brown-50 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-brown-900">User Profile</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-brown-100 p-12">
          <div className="w-32 h-32 mx-auto bg-brown-200 rounded-full flex items-center justify-center text-4xl font-bold text-brown-600 mb-6">
            {username.substring(0, 2).toUpperCase()}
          </div>
          <h2 className="text-3xl font-bold text-brown-900 mb-2">@{username}</h2>
          <p className="text-brown-500 mb-8">This is a static profile view for {username}.</p>
          <lord-icon
            src="https://cdn.lordicon.com/surcxhka.json"
            trigger="loop"
            colors="primary:#a18072,secondary:#43302b"
            style={{ width: '100px', height: '100px' }}
          ></lord-icon>
        </div>
      </main>
    </div>
  );
};

export default Profile;
