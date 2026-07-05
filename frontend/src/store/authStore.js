import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || null, // 'admin' | 'citizen'
  isAuthenticated: !!localStorage.getItem('token'),

  login: (userData, token) => {
    // Resolve role: prefer profile.role, fallback to is_staff check
    const role = userData?.profile?.role || (userData?.is_staff ? 'admin' : 'citizen');
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    set({
      user: userData,
      token,
      role,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    set({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
    });
  },
}));
