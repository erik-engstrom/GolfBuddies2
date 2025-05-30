// Test script to debug message indicator functionality
// This can be run in the browser console to test the current state

console.log('=== Message Indicator Debug Test ===');

// Check current localStorage state
try {
  const unreadCount = localStorage.getItem('unreadMessagesCount');
  const lastUpdated = localStorage.getItem('unreadMessagesCountUpdated');
  const countByBuddy = localStorage.getItem('unreadMessagesCountByBuddy');
  
  console.log('localStorage state:', {
    unreadCount,
    lastUpdated: lastUpdated ? new Date(parseInt(lastUpdated)).toLocaleString() : null,
    countByBuddy: countByBuddy ? JSON.parse(countByBuddy) : null
  });
} catch (e) {
  console.error('Error reading localStorage:', e);
}

// Check if NavBar indicator is visible
const navBarIndicator = document.querySelector('nav span[class*="bg-flag-600"]');
console.log('NavBar indicator element:', navBarIndicator);
if (navBarIndicator) {
  console.log('Indicator text:', navBarIndicator.textContent);
  console.log('Indicator styles:', getComputedStyle(navBarIndicator).display);
}

// Test dispatching a message-read event to see if it updates
console.log('Testing custom event dispatch...');
window.dispatchEvent(new CustomEvent('message-read', {
  detail: {
    totalCount: 0,
    byBuddy: {},
    source: 'test-event'
  }
}));

setTimeout(() => {
  const indicatorAfterTest = document.querySelector('nav span[class*="bg-flag-600"]');
  console.log('Indicator after test event:', indicatorAfterTest);
}, 1000);

console.log('=== End Debug Test ===');
