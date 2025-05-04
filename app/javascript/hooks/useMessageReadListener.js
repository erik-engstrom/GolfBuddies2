import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook that listens for message-read events and localStorage changes
 * for synchronizing read message state across components.
 * Also manages WebSocket health checks for reliability.
 * 
 * @param {number} initialCount - Initial unread message count
 * @param {Function} refreshCallback - Optional callback to invoke when messages are read
 * @returns {{ unreadCount: number, wsStatus: string }} The current unread count and WebSocket status
 */
export const useMessageReadListener = (initialCount = 0, refreshCallback = null) => {
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [wsStatus, setWsStatus] = useState('initializing');
  const lastUpdateTimeRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef(null);
  const syncCheckIntervalRef = useRef(null);
  const wsHealthCheckIntervalRef = useRef(null);
  
  // Keep track of initial count to reset if needed
  useEffect(() => {
    if (initialCount !== undefined) {
      console.log('useMessageReadListener: initializing with count:', initialCount);
      
      // Check if there's a more recent count in localStorage
      try {
        const storedCount = localStorage.getItem('unreadMessagesCount');
        const lastUpdated = localStorage.getItem('unreadMessagesCountUpdated');
        
        if (storedCount !== null && lastUpdated) {
          const parsedCount = parseInt(storedCount, 10);
          
          // Use the most recent count (either from props or localStorage)
          if (!isNaN(parsedCount)) {
            const finalCount = Math.min(parsedCount, initialCount);
            console.log('Using count from localStorage/props:', {
              localStorage: parsedCount,
              props: initialCount,
              using: finalCount
            });
            setUnreadCount(finalCount);
            
            // Update localStorage with the final count
            localStorage.setItem('unreadMessagesCount', finalCount.toString());
            localStorage.setItem('unreadMessagesCountUpdated', Date.now().toString());
            return;
          }
        }
      } catch (e) {
        console.log('Error reading from localStorage, using props value:', e);
      }
      
      // Fall back to the initial count from props
      setUnreadCount(initialCount);
      
      // Store in localStorage to share with other components
      try {
        localStorage.setItem('unreadMessagesCount', initialCount.toString());
        localStorage.setItem('unreadMessagesCountUpdated', Date.now().toString());
      } catch (e) {
        console.log('Could not store initial count in localStorage', e);
      }
    }
    
    // Check initial WebSocket status
    try {
      const storedStatus = localStorage.getItem('wsStatus') || 'initializing';
      setWsStatus(storedStatus);
      console.log('Initial WebSocket status:', storedStatus);
    } catch (e) {
      console.error('Error reading WebSocket status:', e);
    }
  }, [initialCount]);

  // Count how many errors we've had trying to read data
  const errorCountRef = useRef(0);
  
  // Track websocket connection status
  const wsStatusRef = useRef('unknown');

  // Listen for WebSocket status changes
  useEffect(() => {
    const handleWsStatusChange = (event) => {
      console.log('WebSocket status changed:', event.detail?.status);
      if (event.detail && event.detail.status) {
        wsStatusRef.current = event.detail.status;
        setWsStatus(event.detail.status);
        
        // Store status in localStorage for cross-tab sync
        try {
          localStorage.setItem('wsStatus', event.detail.status);
        } catch (e) {
          console.error('Error storing WebSocket status:', e);
        }
      }
    };
    
    window.addEventListener('ws-status-change', handleWsStatusChange);
    
    return () => {
      window.removeEventListener('ws-status-change', handleWsStatusChange);
    };
  }, []);

  useEffect(() => {
    // Listen for custom message-read events - PRIMARY METHOD
    const handleMessageRead = (event) => {
      console.log('Message read event received in useMessageReadListener:', event.detail);
      
      if (event.detail && typeof event.detail.totalCount === 'number') {
        errorCountRef.current = 0; // Reset error count on success
        lastUpdateTimeRef.current = Date.now();
        
        // Always update the local count ASAP
        setUnreadCount(event.detail.totalCount);
        
        // Store in localStorage for cross-tab sync
        try {
          localStorage.setItem('unreadMessagesCount', event.detail.totalCount.toString());
          localStorage.setItem('unreadMessagesCountUpdated', Date.now().toString());
          
          // If we have buddy-specific counts, also store those
          if (event.detail.byBuddy) {
            localStorage.setItem('unreadMessagesCountByBuddy', JSON.stringify(event.detail.byBuddy));
          }
        } catch (e) {
          console.log('Could not store count in localStorage', e);
        }
        
        // If a refresh callback was provided, call it
        if (refreshCallback && typeof refreshCallback === 'function') {
          try {
            // If this is a forced update, mark it as such
            const callbackDetail = {
              ...event.detail,
              source: 'event-listener'
            };
            
            // Use a slight delay for the callback to ensure state updates first
            setTimeout(() => {
              refreshCallback(callbackDetail);
            }, 0);
          } catch (e) {
            console.error('Error in refresh callback:', e);
          }
        }
      }
    };
    
    // Listen for storage events from other tabs/windows - CROSS-TAB SYNC
    const handleStorageChange = (e) => {
      if (e.key === 'unreadMessagesCount') {
        console.log('Storage change detected in useMessageReadListener:', e.newValue);
        const count = parseInt(e.newValue, 10);
        if (!isNaN(count)) {
          errorCountRef.current = 0; // Reset error count on success
          lastUpdateTimeRef.current = Date.now();
          setUnreadCount(count);
        }
      } else if (e.key === 'wsStatus') {
        wsStatusRef.current = e.newValue || 'unknown';
      }
    };
    
    // Check websocket status
    const checkWebSocketStatus = () => {
      // If we detect the websocket is closed or in error state,
      // update the localStorage flag to trigger reconnection across tabs
      if (wsStatusRef.current === 'error' || wsStatusRef.current === 'closed') {
        console.log('WebSocket connection appears to be down, flagging for reconnection');
        try {
          localStorage.setItem('wsReconnectNeeded', Date.now().toString());
        } catch (e) {
          console.log('Could not update localStorage for reconnection', e);
        }
      }
    };

    // Check localStorage periodically - FALLBACK METHOD
    const checkLocalStorage = () => {
      try {
        const storedCount = localStorage.getItem('unreadMessagesCount');
        const lastUpdated = localStorage.getItem('unreadMessagesCountUpdated');
        const wsStatus = localStorage.getItem('wsStatus');
        
        if (wsStatus) {
          wsStatusRef.current = wsStatus;
        }
        
        if (storedCount !== null && lastUpdated) {
          const updateTime = parseInt(lastUpdated, 10);
          // Only update if the data is recent and newer than our last update
          if (updateTime > lastUpdateTimeRef.current) {
            console.log('Updating from localStorage in useMessageReadListener:', storedCount);
            const count = parseInt(storedCount, 10);
            if (!isNaN(count)) {
              errorCountRef.current = 0; // Reset error count on success
              lastUpdateTimeRef.current = updateTime;
              setUnreadCount(count);
            }
          }
        }
        
        // Check websocket status
        checkWebSocketStatus();
      } catch (e) {
        errorCountRef.current++;
        console.error(`Error reading from localStorage (${errorCountRef.current} attempts):`, e);
        
        // If we've had too many errors, try to recover by resetting state
        if (errorCountRef.current > 5) {
          errorCountRef.current = 0;
          console.log('Too many errors, resetting unread count state');
          // Force a refresh if we're having persistent errors
          window.location.reload();
        }
      }
    };
    
    // Update WebSocket status in localStorage for cross-tab visibility
    const updateWebSocketStatus = (status) => {
      try {
        localStorage.setItem('wsStatus', status);
        wsStatusRef.current = status;
      } catch (e) {
        console.log('Could not store WebSocket status in localStorage', e);
      }
    };
    
    // Setup WebSocket status update
    window.addEventListener('ws-status-change', (e) => {
      if (e.detail && e.detail.status) {
        updateWebSocketStatus(e.detail.status);
      }
    });

    // Add event listeners
    window.addEventListener('message-read', handleMessageRead);
    window.addEventListener('storage', handleStorageChange);
    
    // Check localStorage initially and set up polling
    checkLocalStorage();
    
    // Setup a more frequent sync check for cross-tab communication
    syncCheckIntervalRef.current = setInterval(checkLocalStorage, 1000);

    // Heartbeat ping to keep connections alive
    // This helps prevent "Socket closed" errors by keeping the WebSocket connection active
    heartbeatIntervalRef.current = setInterval(() => {
      try {
        // Store current time as heartbeat
        localStorage.setItem('wsHeartbeat', Date.now().toString());
        
        // Also force a WebSocket ping by triggering a small event
        // This is picked up by our MessageSubscription component
        window.dispatchEvent(new CustomEvent('ws-heartbeat'));
        
        // Check if we need to reconnect WebSocket
        const reconnectNeeded = localStorage.getItem('wsReconnectNeeded');
        if (reconnectNeeded) {
          // Only attempt reconnect if this is stale (older than 10s)
          // to prevent all tabs from trying to reconnect at once
          const reconnectTime = parseInt(reconnectNeeded, 10);
          const now = Date.now();
          if (now - reconnectTime > 10000) {
            // Clear the flag
            localStorage.removeItem('wsReconnectNeeded');
            
            // Trigger reconnection in all tabs
            window.dispatchEvent(new CustomEvent('ws-reconnect-needed'));
          }
        }
      } catch (e) {
        console.log('Heartbeat error:', e);
      }
    }, 30000); // Every 30 seconds
    
    // Clean up all intervals and event listeners
    return () => {
      window.removeEventListener('message-read', handleMessageRead);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ws-status-change', updateWebSocketStatus);
      clearInterval(syncCheckIntervalRef.current);
      clearInterval(heartbeatIntervalRef.current);
    };
  }, []);

  // Log the current unread count for debugging
  useEffect(() => {
    console.log('useMessageReadListener current unreadCount:', unreadCount);
  }, [unreadCount]);

  return { unreadCount, wsStatus };
};

export default useMessageReadListener;