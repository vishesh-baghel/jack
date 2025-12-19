/**
 * Client-side authentication utilities
 * Safe to import in client components
 */

// Guest user constants
export const GUEST_USER_EMAIL = 'guest@visheshbaghel.com';
export const DEMO_USER_EMAIL = 'visheshbaghel99@gmail.com'; // The user whose content guests will see

/**
 * Set user session (client-side helper)
 */
export function setUserSession(userId: string, email: string, isGuest: boolean = false, demoUserId?: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isGuest', String(isGuest));
    if (demoUserId) {
      localStorage.setItem('demoUserId', demoUserId);
    }
    
    // Also set cookie for server-side access
    document.cookie = `userId=${userId}; path=/; max-age=2592000`; // 30 days
    document.cookie = `userEmail=${email}; path=/; max-age=2592000`;
    document.cookie = `isGuest=${isGuest}; path=/; max-age=2592000`;
    if (demoUserId) {
      document.cookie = `demoUserId=${demoUserId}; path=/; max-age=2592000`;
    }
    
    // Dispatch custom event so components can react immediately
    window.dispatchEvent(new CustomEvent('session-changed'));
  }
}

/**
 * Clear user session
 */
export function clearUserSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isGuest');
    localStorage.removeItem('demoUserId');
    
    // Clear cookies
    document.cookie = 'userId=; path=/; max-age=0';
    document.cookie = 'userEmail=; path=/; max-age=0';
    document.cookie = 'isGuest=; path=/; max-age=0';
    document.cookie = 'demoUserId=; path=/; max-age=0';
  }
}

/**
 * Get user session (client-side)
 */
export function getUserSession() {
  if (typeof window !== 'undefined') {
    return {
      userId: localStorage.getItem('userId'),
      userEmail: localStorage.getItem('userEmail'),
      isGuest: localStorage.getItem('isGuest') === 'true',
      demoUserId: localStorage.getItem('demoUserId'),
    };
  }
  return { userId: null, userEmail: null, isGuest: false, demoUserId: null };
}
