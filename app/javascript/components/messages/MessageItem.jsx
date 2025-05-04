import React, { useEffect, useState, useRef } from 'react';

const MessageItem = ({ message, currentUser, formatTime }) => {
  const [isRead, setIsRead] = useState(message?.read);
  const isFromCurrentUser = currentUser && message && message.sender && message.sender.id === currentUser.id;
  const messageId = useRef(message?.id);
  const lastUpdateTime = useRef(Date.now());

  // Update read state when message prop changes
  useEffect(() => {
    if (message?.read !== isRead) {
      // Log message status change for debugging
      console.log(`Message ${message.id} read status changed from ${isRead} to ${message.read}`);
      
      // Update the local state
      setIsRead(message.read);
      lastUpdateTime.current = Date.now();
      
      // If this message was just marked as read, we can dispatch a specific event
      // to let other parts of the app know about the change
      if (message.read && !isRead) {
        try {
          window.dispatchEvent(new CustomEvent('message-marked-read', {
            detail: {
              messageId: message.id,
              senderId: message.sender?.id,
              receiverId: message.receiver?.id,
              timestamp: Date.now()
            }
          }));
        } catch (e) {
          console.error('Error dispatching message-marked-read event:', e);
        }
      }
    }
  }, [message?.read, isRead, message?.id, message?.sender?.id, message?.receiver?.id]);
  
  // Listen for message-status-updated events
  useEffect(() => {
    const handleMessageStatusUpdate = (event) => {
      // Skip if message is already marked as read
      if (isRead) return;
      
      // Check if this message is being updated
      if (event.detail && event.detail.messageId === message.id) {
        console.log(`Message ${message.id} status updated via event to ${event.detail.read}`);
        setIsRead(event.detail.read);
      }
    };
    
    // Register event listener for custom message status updates
    window.addEventListener('message-status-updated', handleMessageStatusUpdate);
    
    return () => {
      window.removeEventListener('message-status-updated', handleMessageStatusUpdate);
    };
  }, [message.id, isRead]);

  // Debug rendering of unread messages
  useEffect(() => {
    if (!isFromCurrentUser && !message.read) {
      console.log('Rendering unread message:', message.id, message.content.substring(0, 20));
    }
  }, [isFromCurrentUser, message.id, message.content, message.read]);

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
          {!isFromCurrentUser && !isRead && (
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
