import React from 'react';

const MessageItem = ({ message, currentUser, formatTime }) => {
  // Add null check to avoid the error when currentUser or message.sender is undefined
  const isFromCurrentUser = currentUser && message && message.sender && message.sender.id === currentUser.id;
  
  // If message or sender is undefined, don't render anything
  if (!message || !message.sender) {
    return null;
  }

  return (
    <div 
      className={`mb-4 flex ${
        isFromCurrentUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isFromCurrentUser && (
        <div className="flex-shrink-0 mr-2">
          {message.sender.profilePictureUrl ? (
            <img 
              src={message.sender.profilePictureUrl} 
              alt={message.sender.fullName || 'User'}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-fairway-400 text-white flex items-center justify-center">
              {message.sender.fullName ? message.sender.fullName.charAt(0) : 'U'}
            </div>
          )}
        </div>
      )}
      
      <div 
        className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
          isFromCurrentUser 
            ? 'bg-fairway-600 text-white rounded-tr-none' 
            : 'bg-white text-gray-800 rounded-tl-none'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${
          isFromCurrentUser 
            ? 'text-fairway-200' 
            : 'text-gray-500'
        }`}>
          {formatTime(message.createdAt)}
          {!isFromCurrentUser && !message.read && (
            <span className="ml-2 font-medium text-fairway-500">• New</span>
          )}
        </p>
      </div>
      
      {isFromCurrentUser && currentUser && (
        <div className="flex-shrink-0 ml-2">
          {currentUser.profilePictureUrl ? (
            <img 
              src={currentUser.profilePictureUrl} 
              alt={currentUser.fullName || 'Me'}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-fairway-600 text-white flex items-center justify-center">
              {currentUser.fullName ? currentUser.fullName.charAt(0) : 'M'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
