import React from 'react';

const UserAvatar = ({ user, size = 10, showUnreadCount = false, unreadCount = 0 }) => {
  return (
    <div className="relative">
      {user.profilePictureUrl ? (
        <img
          src={user.profilePictureUrl}
          alt={user.fullName}
          className={`h-${size} w-${size} rounded-full mr-3 object-cover`}
        />
      ) : (
        <div className={`h-${size} w-${size} rounded-full bg-fairway-500 text-white flex items-center justify-center mr-3`}>
          {user.fullName.split(' ').map(name => name[0]).join('')}
        </div>
      )}
      {showUnreadCount && unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-flag-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
          {unreadCount}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
