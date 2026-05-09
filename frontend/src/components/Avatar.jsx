import React from 'react';

const Avatar = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl'
  };

  if (user?.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt={`${user.firstName} ${user.lastName}`}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-brown-200`}
      />
    );
  }

  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-brown-500 text-white flex items-center justify-center font-bold border-2 border-brown-200 shadow-sm shrink-0`}>
      {initials}
    </div>
  );
};

export default Avatar;
