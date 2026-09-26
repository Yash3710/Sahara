import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured. Auth features will not work.');
}

const realSupabase = createClient(supabaseUrl || '', supabaseKey || '');

export const DEMO_USER_EMAIL = 'demo@sahara.com';

export const isDemoMode = () => {
  const session = JSON.parse(localStorage.getItem('demo_session'));
  return session?.user?.email === DEMO_USER_EMAIL;
};

// Mock Supabase client for demo mode
const mockSupabase = {
  auth: {
    getSession: async () => {
      const session = JSON.parse(localStorage.getItem('demo_session'));
      return { data: { session } };
    },
    getUser: async () => {
      const session = JSON.parse(localStorage.getItem('demo_session'));
      if (session) return { data: { user: session.user } };
      return { data: { user: null }, error: new Error('Not logged in') };
    },
    signOut: async () => {
      localStorage.removeItem('demo_session');
      return { error: null };
    },
    onAuthStateChange: (callback) => {
      // Very basic mock - just calls callback once immediately
      const session = JSON.parse(localStorage.getItem('demo_session'));
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }
};

export const supabase = new Proxy(realSupabase, {
  get(target, prop) {
    if (isDemoMode() && mockSupabase[prop]) {
      return mockSupabase[prop];
    }
    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  }
});

// Get current session token for API calls
export async function getAuthToken() {
  if (isDemoMode()) return 'demo-token';
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Get current user
export async function getCurrentUser() {
  if (isDemoMode()) {
    const session = JSON.parse(localStorage.getItem('demo_session'));
    return session?.user || { id: 'demo-user', email: DEMO_USER_EMAIL };
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Check if user is authenticated, redirect to login if not
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login.html';
    return null;
  }
  return session;
}

// Logout and redirect
export async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem('demo_session');
  window.location.href = '/login.html';
}

// API helper - makes authenticated requests to the backend
export async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Something went wrong. Please try again.' }));
    throw new Error(error.error || error.message || 'Something went wrong. Please try again.');
  }
  
  return response.json();
}
