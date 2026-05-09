import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import Avatar from './Avatar';

const MentionsTextarea = ({ value, onChange, placeholder, className, rows = 3, onKeyDown }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!showSuggestions || mentionQuery.length < 1) {
      setSuggestions([]);
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await api.get(`/users/search?query=${mentionQuery}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
        });
        setSuggestions(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const delay = setTimeout(fetchUsers, 300);
    return () => clearTimeout(delay);
  }, [mentionQuery, showSuggestions]);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);

    const pos = e.target.selectionStart;
    setCursorPosition(pos);

    // Look back from cursor to find an @ symbol
    const textBeforeCursor = val.slice(0, pos);
    const lastAtMatch = textBeforeCursor.match(/@(\w*)$/);

    if (lastAtMatch) {
      setMentionQuery(lastAtMatch[1]);
      setShowSuggestions(true);

      // Calculate basic coords (rough estimation for textarea)
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      const top = lines.length * 20; // approx line height
      const left = currentLine.length * 8; // approx char width
      setCoords({ top: Math.min(top, 100), left: Math.min(left, 200) });
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (user) => {
    const textBeforeMention = value.slice(0, cursorPosition).replace(/@\w*$/, '');
    const textAfterMention = value.slice(cursorPosition);

    const newVal = `${textBeforeMention}@${user.username} ${textAfterMention}`;
    onChange(newVal);
    setShowSuggestions(false);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-50 bg-white rounded-xl shadow-xl border border-brown-200 py-1 w-64 overflow-hidden"
          style={{ top: `${coords.top + 30}px`, left: `${coords.left}px` }}
        >
          {suggestions.map(user => (
            <button
              key={user._id}
              onClick={(e) => { e.preventDefault(); handleSelect(user); }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-brown-50 transition-colors text-left"
            >
              <Avatar user={user} size="sm" />
              <div>
                <p className="text-sm font-semibold text-brown-900 leading-tight">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-brown-500">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionsTextarea;
