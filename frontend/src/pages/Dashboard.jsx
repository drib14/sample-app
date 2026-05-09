import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('makiUser');
    const token = localStorage.getItem('makiToken');

    if (!storedUser || !token) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('makiUser');
    localStorage.removeItem('makiToken');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brown-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-brown-900 flex items-center gap-2">
            <lord-icon
              src="https://cdn.lordicon.com/surcxhka.json"
              trigger="hover"
              colors="primary:#a18072,secondary:#43302b"
              style={{ width: '40px', height: '40px' }}
            ></lord-icon>
            Maki
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-brown-200 hover:bg-brown-300 text-brown-900 rounded-lg transition-colors"
          >
            Logout
          </button>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-brown-100 rounded-full flex items-center justify-center">
              <lord-icon
                src="https://cdn.lordicon.com/ajkxzzpl.json"
                trigger="hover"
                colors="primary:#a18072,secondary:#43302b"
                style={{ width: '50px', height: '50px' }}
              ></lord-icon>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brown-900">Welcome, {user.firstName}!</h2>
              <p className="text-brown-500">@{user.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-brown-50 rounded-xl border border-brown-100">
              <p className="text-sm text-brown-400 mb-1">Email</p>
              <p className="font-medium text-brown-900">{user.email}</p>
            </div>
            <div className="p-4 bg-brown-50 rounded-xl border border-brown-100">
              <p className="text-sm text-brown-400 mb-1">Full Name</p>
              <p className="font-medium text-brown-900">{user.firstName} {user.lastName}</p>
            </div>
            <div className="p-4 bg-brown-50 rounded-xl border border-brown-100">
              <p className="text-sm text-brown-400 mb-1">Address</p>
              <p className="font-medium text-brown-900">{user.address}</p>
            </div>
            <div className="p-4 bg-brown-50 rounded-xl border border-brown-100">
              <p className="text-sm text-brown-400 mb-1">Date of Birth</p>
              <p className="font-medium text-brown-900">{new Date(user.dob).toLocaleDateString()}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
