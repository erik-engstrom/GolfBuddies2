import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_BUDDIES, GET_MESSAGES_WITH_USER } from '../../graphql/queries';
import { SEND_MESSAGE_MUTATION, MARK_MESSAGE_AS_READ_MUTATION } from '../../graphql/mutations';

const Messages = ({ currentUser }) => {
  const [selectedBuddy, setSelectedBuddy] = useState(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  
  // Fetch buddies list
  const { 
    loading: loadingBuddies, 
    error: buddiesError, 
    data: buddiesData 
  } = useQuery(GET_BUDDIES);
  
  // Fetch messages with selected buddy
  const { 
    loading: loadingMessages, 
    error: messagesError, 
    data: messagesData,
    refetch: refetchMessages 
  } = useQuery(GET_MESSAGES_WITH_USER, {
    variables: { userId: selectedBuddy?.id || '0' },
    skip: !selectedBuddy,
    pollInterval: 5000, // Poll every 5 seconds for new messages
  });
  
  // Mutations
  const [sendMessage] = useMutation(SEND_MESSAGE_MUTATION, {
    onCompleted: () => {
      setMessageText('');
      refetchMessages();
    }
  });
  
  const [markMessageAsRead] = useMutation(MARK_MESSAGE_AS_READ_MUTATION);
  
  // Mark unread messages as read when viewing them
  useEffect(() => {
    if (messagesData?.messagesWithUser && selectedBuddy) {
      messagesData.messagesWithUser.forEach(message => {
        if (message.receiver.id === currentUser.id && !message.read) {
          markMessageAsRead({
            variables: { messageId: message.id }
          });
        }
      });
    }
  }, [messagesData, currentUser, markMessageAsRead, selectedBuddy]);
  
  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesData]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !selectedBuddy) return;
    
    sendMessage({
      variables: {
        receiverId: selectedBuddy.id,
        content: messageText
      }
    });
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Group messages by date
  const groupMessagesByDate = (messages) => {
    if (!messages) return {};
    
    const grouped = {};
    
    messages.forEach(message => {
      const date = formatDate(message.createdAt);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    
    return grouped;
  };
  
  const groupedMessages = groupMessagesByDate(messagesData?.messagesWithUser || []);
  
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-fairway-800 mb-6">Messages</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-12 h-[calc(80vh-100px)]">
          {/* Buddies sidebar */}
          <div className="col-span-3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-fairway-700">Your Buddies</h2>
            </div>
            
            {loadingBuddies ? (
              <div className="p-4 text-center text-gray-500">Loading buddies...</div>
            ) : buddiesError ? (
              <div className="p-4 text-center text-flag-600">Error loading buddies</div>
            ) : buddiesData?.buddies.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                You don't have any buddies yet. 
                <br />
                Add buddies to start chatting!
              </div>
            ) : (
              <ul>
                {buddiesData.buddies.map(buddy => (
                  <li 
                    key={buddy.id}
                    onClick={() => setSelectedBuddy(buddy)}
                    className={`p-4 flex items-center cursor-pointer hover:bg-fairway-50 ${
                      selectedBuddy?.id === buddy.id ? 'bg-fairway-100' : ''
                    }`}
                  >
                    {buddy.profilePictureUrl ? (
                      <img 
                        src={buddy.profilePictureUrl} 
                        alt={buddy.fullName}
                        className="h-10 w-10 rounded-full mr-3 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-fairway-500 text-white flex items-center justify-center mr-3">
                        {buddy.fullName.split(' ').map(name => name[0]).join('')}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-fairway-800">{buddy.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {buddy.handicap !== null && `Handicap: ${buddy.handicap}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Messages area */}
          <div className="col-span-9 flex flex-col">
            {!selectedBuddy ? (
              <div className="flex-grow flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-fairway-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg font-medium">Select a buddy to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* Message header */}
                <div className="p-4 border-b border-gray-200 flex items-center">
                  {selectedBuddy.profilePictureUrl ? (
                    <img 
                      src={selectedBuddy.profilePictureUrl} 
                      alt={selectedBuddy.fullName}
                      className="h-10 w-10 rounded-full mr-3 object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-fairway-500 text-white flex items-center justify-center mr-3">
                      {selectedBuddy.fullName.split(' ').map(name => name[0]).join('')}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-fairway-800">{selectedBuddy.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {selectedBuddy.playingStyle && (
                        <span className="capitalize">{selectedBuddy.playingStyle} player</span>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Messages list */}
                <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                  {loadingMessages ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                  ) : messagesError ? (
                    <div className="text-center text-flag-600">Error loading messages</div>
                  ) : Object.keys(groupedMessages).length === 0 ? (
                    <div className="text-center text-gray-500 my-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    Object.entries(groupedMessages).map(([date, messages]) => (
                      <div key={date} className="mb-6">
                        <div className="text-center mb-4">
                          <span className="inline-block px-3 py-1 bg-gray-200 rounded-full text-xs font-medium text-gray-700">
                            {date}
                          </span>
                        </div>
                        
                        {messages.map(message => (
                          <div 
                            key={message.id}
                            className={`mb-4 flex ${
                              message.sender.id === currentUser.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div 
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                message.sender.id === currentUser.id 
                                  ? 'bg-fairway-500 text-white' 
                                  : 'bg-white border border-gray-200 text-gray-800'
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.sender.id === currentUser.id 
                                  ? 'text-fairway-200' 
                                  : 'text-gray-500'
                              }`}>
                                {formatTime(message.createdAt)}
                                {message.sender.id !== currentUser.id && !message.read && (
                                  <span className="ml-2 font-medium">•</span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-fairway-500"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="bg-fairway-600 text-white p-2 rounded-r-md hover:bg-fairway-700 focus:outline-none focus:ring-2 focus:ring-fairway-500 disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
