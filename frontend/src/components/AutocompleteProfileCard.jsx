import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import axios from 'axios';

const AutocompleteProfileCard = ({ title, icon: Icon, field, value, isEditable, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const suggestionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUniversities = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      setLoadingSuggestions(true);
      const res = await axios.get(`http://universities.hipolabs.com/search?name=${encodeURIComponent(query)}`);
      // Filter out exact duplicates and limit to 10
      const uniqueNames = [...new Set(res.data.map(u => u.name))].slice(0, 10);
      setSuggestions(uniqueNames);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setEditValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUniversities(val);
    }, 400);
  };

  const handleSave = async () => {
    if (!editValue.trim() && editValue !== '') return;

    try {
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
      setIsEditing(false);
      setSuggestions([]);
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
        <div className="flex flex-col gap-2 relative">
          <input
            type="text"
            value={editValue}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-brown-50 border border-brown-200 rounded-lg focus:outline-none focus:border-brown-400 text-sm"
            autoFocus
            placeholder="Search universities..."
          />

          {suggestions.length > 0 && (
            <div ref={suggestionRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-brown-100 shadow-xl rounded-xl max-h-48 overflow-y-auto z-50">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setEditValue(s); setSuggestions([]); }}
                  className="w-full text-left px-4 py-2 text-sm text-brown-700 hover:bg-brown-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => { setIsEditing(false); setEditValue(value); setSuggestions([]); }} className="p-1 text-brown-400 hover:text-brown-600 bg-brown-50 rounded-lg">
              <X size={16} />
            </button>
            <button onClick={handleSave} className="p-1 text-white bg-brown-500 hover:bg-brown-600 rounded-lg">
              <Check size={16} />
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

export default AutocompleteProfileCard;
