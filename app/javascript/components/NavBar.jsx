// At the top of the file, import the hook
import { useMessageReadListener } from '../hooks/useMessageReadListener';

// Inside the NavBar component, before rendering
// ... existing code ...

// Add this before returning the JSX
const { unreadCount: messageEventUnreadCount } = useMessageReadListener(
  currentUser?.unreadMessagesCount || 0
);

// When rendering the message icon, modify to use messageEventUnreadCount:
// ... existing code ...

{/* Messages - Use messageEventUnreadCount here */}
<Link to="/messages" className="relative p-2 rounded-full hover:bg-fairway-600 mx-2">
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
  {messageEventUnreadCount > 0 && (
    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-flag-600 rounded-full">
      {messageEventUnreadCount}
    </span>
  )}
</Link>

// ... rest of the component ...