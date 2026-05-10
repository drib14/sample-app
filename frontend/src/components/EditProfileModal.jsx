import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, MapPin } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const EditProfileModal = ({ user, isOpen, onClose, onUpdate }) => {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [address, setAddress] = useState(user.address || '');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user.profilePicture || null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('address', address);
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    try {
      const res = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('makiToken')}`
        }
      });
      toast.success('Profile updated successfully!');
      onUpdate(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-brown-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-brown-900">Edit Profile</h2>
            <button onClick={onClose} className="p-2 text-brown-400 hover:text-brown-700 hover:bg-brown-50 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-brown-100" />
                ) : (
                  <div className="w-24 h-24 bg-brown-200 rounded-full flex items-center justify-center text-2xl font-bold text-brown-600 border-4 border-brown-100">
                    {firstName[0]?.toUpperCase()}{lastName[0]?.toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-1.5 bg-brown-500 hover:bg-brown-600 text-white rounded-full cursor-pointer shadow-sm transition-colors">
                  <Upload size={14} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              <p className="text-xs text-brown-500">Click icon to change picture</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 bg-brown-50 border border-brown-200 rounded-xl focus:outline-none focus:border-brown-400 focus:ring-2 focus:ring-brown-200 transition-all text-brown-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 bg-brown-50 border border-brown-200 rounded-xl focus:outline-none focus:border-brown-400 focus:ring-2 focus:ring-brown-200 transition-all text-brown-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-700 mb-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" size={18} />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-brown-50 border border-brown-200 rounded-xl focus:outline-none focus:border-brown-400 focus:ring-2 focus:ring-brown-200 transition-all text-brown-900"
                  required
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* Read-only fields */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brown-100">
              <div>
                <label className="block text-xs font-medium text-brown-400 mb-1">Username</label>
                <input type="text" value={`@${user.username}`} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brown-400 mb-1">Email</label>
                <input type="text" value={user.email} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 font-medium text-brown-600 hover:bg-brown-50 rounded-xl transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brown-600 hover:bg-brown-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
