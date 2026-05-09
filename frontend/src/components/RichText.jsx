import React from 'react';
import { Link } from 'react-router-dom';

const RichText = ({ text }) => {
  if (!text) return null;

  // Split text by @username patterns
  const parts = text.split(/(@\w+)/g);

  return (
    <span className="whitespace-pre-wrap leading-relaxed text-brown-800">
      {parts.map((part, i) => {
        if (part.startsWith('@') && part.length > 1) {
          const username = part.slice(1);
          return (
            <Link
              key={i}
              to={`/profile/${username}`}
              className="text-brown-600 font-semibold hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

export default RichText;
