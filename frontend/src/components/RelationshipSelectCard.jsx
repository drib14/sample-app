import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
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

const RelationshipSelectCard = ({ title, icon: Icon, field, value, isEditable, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = async () => {
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
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 bg-brown-50 border border-brown-200 rounded-lg focus:outline-none focus:border-brown-400 text-sm text-brown-900"
          >
            <option value="">Select status...</option>
            {relationshipOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => { setIsEditing(false); setEditValue(value); }} className="p-1 text-brown-400 hover:text-brown-600 bg-brown-50 rounded-lg">
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

export default RelationshipSelectCard;
