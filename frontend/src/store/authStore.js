import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  role: null, // 'admin' | 'citizen'
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (userData, token) => {
    localStorage.setItem('token', token);
    set({
      user: userData,
      token,
      role: userData.is_staff ? 'admin' : 'citizen',
      isAuthenticated: true
    });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false
    });
  }
}));
