import React, { useState, useEffect, useRef, useContext } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { GET_BUDDIES, GET_MESSAGES_WITH_USER } from '../../graphql/queries';
import { CURRENT_USER_WITH_NOTIFICATIONS } from '../../graphql/notifications';
import { SEND_MESSAGE_MUTATION } from '../../graphql/mutations';
import { MARK_ALL_MESSAGES_AS_READ_MUTATION } from '../../graphql/mutations/markAllMessagesAsRead';
import { CurrentUserContext } from '../../app/CurrentUserContext';
import MessageSubscription from '../MessageSubscription';
import MessageItem from './MessageItem';
import UserAvatar from './UserAvatar';

const Messages = ({ currentUser: propCurrentUser }) => {

  const { currentUser: contextCurrentUser } = useContext(CurrentUserContext);
  const currentUser = propCurrentUser || contextCurrentUser;

  const [selectedBuddy, setSelectedBuddy] = useState(null);
  const [messageText, setMessageText] = useState('');
  const messagesRefetchTimeout = useRef(null);
  const client = useApolloClient();

  const [sendMessage] = useMutation(SEND_MESSAGE_MUTATION, {
    onCompleted: (data) => {
      console.log('Message sent:', data);
      setMessageText('');

    },
    onError: (error) => {
      console.error('Error sending message:', error);
    },
    update(cache, { data }) {
      if (data?.sendMessage?.message) {
        try {

          const existingData = cache.readQuery({
            query: GET_MESSAGES_WITH_USER,
            variables: { userId: selectedBuddy?.id || '0' }
          });

          if (existingData?.messagesWithUser) {

            cache.writeQuery({
              query: GET_MESSAGES_WITH_USER,
              variables: { userId: selectedBuddy?.id || '0' },
              data: {
                messagesWithUser: [...existingData.messagesWithUser, data.sendMessage.message]
              }
            });
          }
        } catch (error) {
          console.error('Error updating cache with new message:', error);
        }
      }
    }
  });

  const [markAllMessagesAsRead] = useMutation(MARK_ALL_MESSAGES_AS_READ_MUTATION);

  const lastMarkAllRequest = useRef({});

  const handleSelectBuddy = async (buddy) => {

    if (selectedBuddy?.id === buddy.id) {
      return;
    }

    setSelectedBuddy(buddy);


    if (buddy) {
      try {

        const unreadCount = getUnreadCountForBuddy(buddy.id);

        updateUnreadCountsInCache(buddy.id, unreadCount);

        if (unreadCount > 0) {
          const now = Date.now();
          const lastRequest = lastMarkAllRequest.current[buddy.id] || 0;

          if (now - lastRequest < 5000) {
            console.log(`Skipping markAllMessagesAsRead - throttled (last request: ${new Date(lastRequest).toLocaleTimeString()})`);
            return;
          }

          lastMarkAllRequest.current[buddy.id] = now;

          console.log(`Marking all messages as read for buddy ${buddy.id} (${unreadCount} unread messages)`);

          await markAllMessagesAsRead({ variables: { buddyId: buddy.id } });

          await client.refetchQueries({
            include: [GET_MESSAGES_WITH_USER, GET_BUDDIES, CURRENT_USER_WITH_NOTIFICATIONS],
            variables: { userId: buddy.id }
          });
        }
      } catch (e) {
        console.error('Failed to mark all messages as read:', e);
      }
    }
  };

  const updateUnreadCountsInCache = (buddyId, unreadCount) => {
    const userData = client.readQuery({ query: CURRENT_USER_QUERY });

    if (userData?.me) {
      const updatedCountByBuddy = {
        ...userData.me.unreadMessagesCountByBuddy
      };
      updatedCountByBuddy[buddyId] = 0;

      const newTotalCount = Math.max(0, userData.me.unreadMessagesCount - unreadCount);

      client.writeQuery({
        query: CURRENT_USER_WITH_NOTIFICATIONS,
        data: {
          me: {
            ...userData.me,
            unreadMessagesCount: newTotalCount,
            unreadMessagesCountByBuddy: updatedCountByBuddy
          }
        }
      });
    }

    try {
      const buddiesData = client.readQuery({ query: GET_BUDDIES });

      if (buddiesData?.me) {
        const updatedBuddiesCountByBuddy = {
          ...buddiesData.me.unreadMessagesCountByBuddy
        };
        updatedBuddiesCountByBuddy[buddyId] = 0;

        client.writeQuery({
          query: GET_BUDDIES,
          data: {
            ...buddiesData,
            me: {
              ...buddiesData.me,
              unreadMessagesCountByBuddy: updatedBuddiesCountByBuddy
            }
          }
        });
      }
    } catch (e) {
      console.error('Error updating buddies cache:', e);
    }
  };

  const {
    loading: loadingBuddies,
    error: buddiesError,
    data: buddiesData
  } = useQuery(GET_BUDDIES);

  const getUnreadCountForBuddy = (buddyId) => {
    if (buddiesData?.me?.unreadMessagesCountByBuddy?.[buddyId] !== undefined) {
      return buddiesData.me.unreadMessagesCountByBuddy[buddyId];
    }

    try {
      const userData = client.readQuery({ query: CURRENT_USER_WITH_NOTIFICATIONS });
      return userData?.me?.unreadMessagesCountByBuddy?.[buddyId] || 0;
    } catch (e) {
      return 0;
    }
  };

  const {
    loading: loadingMessages,
    error: messagesError,
    data: messagesData,
    refetch: refetchMessages
  } = useQuery(GET_MESSAGES_WITH_USER, {
    variables: { userId: selectedBuddy?.id || '0' },
    skip: !selectedBuddy,
    fetchPolicy: 'cache-and-network',
  });

  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        console.log('Scrolling to bottom, height:', messagesContainerRef.current.scrollHeight);
      } else {
        console.log('Messages container ref not available');
      }
    };

    scrollToBottom();

    const timers = [];
    for (let i = 0; i < 10; i++) {
      timers.push(setTimeout(scrollToBottom, 100 * (i + 1)));
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));

      if (messagesRefetchTimeout.current) {
        clearTimeout(messagesRefetchTimeout.current);
        messagesRefetchTimeout.current = null;
      }
    };
  }, [messagesData, selectedBuddy, loadingMessages]);



  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedBuddy) return;

    console.log('Sending message to buddy:', selectedBuddy);

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

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fairway-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">

      <MessageSubscription
        userId={currentUser.id}
        onNewMessage={(newMessage) => {

            if (selectedBuddy && (
              (newMessage.sender.id === selectedBuddy.id && newMessage.receiver.id === currentUser.id) || 
              (newMessage.sender.id === currentUser.id && newMessage.receiver.id === selectedBuddy.id)
            )) {
              const now = Date.now();
              const lastDebounceKey = `${newMessage.sender.id}-${newMessage.receiver.id}`;
              const lastRefetch = lastMarkAllRequest.current[lastDebounceKey] || 0;

              if (now - lastRefetch < 2000) {
                console.log('Skipping message refetch - debounced');
                return;
              }

              if (messagesRefetchTimeout.current) {
                clearTimeout(messagesRefetchTimeout.current);
              }

              messagesRefetchTimeout.current = setTimeout(() => {
                console.log('Refetching messages after subscription update');
                refetchMessages();
                lastMarkAllRequest.current[lastDebounceKey] = Date.now();
                messagesRefetchTimeout.current = null;
              }, 500);
            }
          }}
        />

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-12 h-[calc(80vh-100px)]">
          <div className="col-span-3 border-r border-gray-200 overflow-y-auto h-full">
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
                {[...buddiesData.buddies]
                  .sort((a, b) => {
                    if (getUnreadCountForBuddy(a.id) > 0 && getUnreadCountForBuddy(b.id) === 0) return -1;
                    if (getUnreadCountForBuddy(a.id) === 0 && getUnreadCountForBuddy(b.id) > 0) return 1;
                    return a.fullName.localeCompare(b.fullName);
                  })
                  .map(buddy => (
                  <li
                    key={buddy.id}
                    onClick={() => handleSelectBuddy(buddy)}
                    className={`p-4 flex items-center cursor-pointer hover:bg-fairway-50 ${
                      selectedBuddy?.id === buddy.id ? 'bg-fairway-100' : ''
                    }`}
                  >
                    <UserAvatar 
                      user={buddy} 
                      showUnreadCount={true} 
                      unreadCount={getUnreadCountForBuddy(buddy.id)} 
                    />
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

          <div className="col-span-9 flex flex-col min-h-0 h-full">
            {!selectedBuddy ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-fairway-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg font-medium">Select a buddy to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center bg-white flex-shrink-0">
                  <UserAvatar user={selectedBuddy} />
                  <div>
                    <p className="font-medium text-fairway-800">{selectedBuddy.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {selectedBuddy.playingStyle && (
                        <span className="capitalize">{selectedBuddy.playingStyle} player</span>
                      )}
                    </p>
                  </div>
                </div>

                <div
                  ref={messagesContainerRef}
                  className="p-4 overflow-y-auto bg-gray-50 flex-1 min-h-0"
                >
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
                          <MessageItem
                            key={message.id}
                            message={message}
                            currentUser={currentUser}
                            formatTime={formatTime}
                          />
                        ))}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-fairway-500"
                      autoComplete="off"
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
