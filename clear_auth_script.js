// Clear authentication and force login page
// Run this in the browser console to reset authentication state

console.log('=== Golf Buddies Authentication Reset ===');

// 1. Clear all auth-related localStorage items
try {
  localStorage.removeItem('golfBuddiesToken');
  localStorage.removeItem('unreadMessagesCount');
  localStorage.removeItem('unreadMessagesCountUpdated');
  localStorage.removeItem('unreadMessagesCountByBuddy');
  console.log('✅ Cleared all authentication tokens and cached data');
} catch (e) {
  console.error('❌ Error clearing localStorage:', e);
}

// 2. Clear any session storage
try {
  sessionStorage.clear();
  console.log('✅ Cleared session storage');
} catch (e) {
  console.error('❌ Error clearing sessionStorage:', e);
}

// 3. Check current authentication state
const token = localStorage.getItem('golfBuddiesToken');
console.log('Current token:', token ? 'TOKEN STILL EXISTS' : 'NO TOKEN (GOOD)');

// 4. Force reload to refresh authentication state
console.log('🔄 Reloading page to reset authentication...');
setTimeout(() => {
  window.location.href = '/login';
}, 1000);

console.log('=== Instructions ===');
console.log('1. Open browser developer tools (F12)');
console.log('2. Go to Console tab');
console.log('3. Copy and paste this entire script');
console.log('4. Press Enter to run it');
console.log('5. The page will redirect to /login automatically');
