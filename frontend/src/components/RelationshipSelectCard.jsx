import React, { useState, useEffect } from 'react';
import { Edit2, Check, X, Search, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const relationshipOptions = [
  'Single',
  'In a relationship',
  'Engaged',
  'Married',
  'It\'s complicated',
  'In an open relationship',
  'Widowed',
  'Separated',
  'Divorced'
];

const requiresPartner = ['In a relationship', 'Engaged', 'Married', 'It\'s complicated', 'In an open relationship'];

const RelationshipSelectCard = ({ title, icon: Icon, field, value, isEditable, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await api.get(`/users/search?query=${searchQuery}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
        });
        setSearchResults(res.data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSave = async () => {
    try {
      if (requiresPartner.includes(editValue)) {
        if (!selectedPartner) {
          toast.error("Please select a partner or a status that doesn't require one.");
          return;
        }

        // Send relationship request
        await api.post('/users/relationship/request', {
          partnerId: selectedPartner._id,
          relationshipStatus: editValue
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
        });

        toast.success(`Relationship request sent to ${selectedPartner.firstName}`);
      } else {
        const formData = new FormData();
        formData.append(field, editValue);

        const res = await api.put('/users/profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('makiToken')}`
          }
        });

        toast.success(`${title} updated`);
        onUpdate(res.data);
      }

      setIsEditing(false);
      setSearchQuery('');
      setSelectedPartner(null);
    } catch (err) {
      toast.error(`Failed to update ${title}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-brown-100 flex flex-col relative group">
      <div className="flex items-center gap-3 mb-3 text-brown-900 font-semibold">
        <div className="p-2 bg-brown-50 rounded-lg text-brown-600">
          <Icon size={20} />
        </div>
        {title}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <select
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setSelectedPartner(null);
            }}
            className="w-full px-3 py-2 bg-brown-50 border border-brown-200 rounded-lg focus:outline-none focus:border-brown-400 text-sm text-brown-900"
          >
            <option value="">Select status...</option>
            {relationshipOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {requiresPartner.includes(editValue) && (
            <div className="mt-2 relative">
              {selectedPartner ? (
                <div className="flex items-center justify-between p-2 bg-brown-50 rounded-lg border border-brown-200">
                  <div className="flex items-center gap-2">
                    {selectedPartner.profilePicture ? (
                       <img src={selectedPartner.profilePicture} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                       <div className="w-6 h-6 rounded-full bg-brown-200 flex items-center justify-center text-xs font-bold text-brown-600">
                          {selectedPartner.firstName?.[0]}{selectedPartner.lastName?.[0]}
                       </div>
                    )}
                    <span className="text-sm font-medium text-brown-900">{selectedPartner.firstName} {selectedPartner.lastName}</span>
                  </div>
                  <button onClick={() => setSelectedPartner(null)} className="text-brown-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for a partner..."
                      className="w-full pl-8 pr-3 py-2 bg-white border border-brown-200 rounded-lg focus:outline-none focus:border-brown-400 text-sm text-brown-900"
                    />
                    <Search className="absolute left-2.5 top-2.5 text-brown-400" size={16} />
                    {isSearching && <Loader className="absolute right-2.5 top-2.5 text-brown-400 animate-spin" size={16} />}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-brown-100 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map(user => (
                        <button
                          key={user._id}
                          onClick={() => {
                            setSelectedPartner(user);
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-2 p-2 hover:bg-brown-50 text-left transition-colors"
                        >
                           {user.profilePicture ? (
                             <img src={user.profilePicture} alt="" className="w-6 h-6 rounded-full object-cover" />
                           ) : (
                             <div className="w-6 h-6 rounded-full bg-brown-200 flex items-center justify-center text-xs font-bold text-brown-600">
                               {user.firstName?.[0]}{user.lastName?.[0]}
                             </div>
                           )}
                           <span className="text-sm text-brown-900">{user.firstName} {user.lastName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => { setIsEditing(false); setEditValue(value); setSelectedPartner(null); setSearchQuery(''); }} className="px-3 py-1 text-sm text-brown-600 hover:bg-brown-50 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="px-3 py-1 text-sm text-white bg-brown-500 hover:bg-brown-600 rounded-lg transition-colors flex items-center gap-1">
              <Check size={14} /> Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center text-brown-700 text-sm min-h-[20px]">
          <span>{value || 'Not provided'}</span>
          {isEditable && (
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-brown-400 hover:text-brown-700 hover:bg-brown-50 rounded-lg transition-all"
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RelationshipSelectCard;
