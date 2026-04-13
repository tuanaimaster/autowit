import { create } from 'zustand';
import api from './api';

interface AuthState {
  token: string | null;
  user: { id: string; email: string; name?: string; role: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,

  init() {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('aw_token');
    const userRaw = localStorage.getItem('aw_user');
    if (token && userRaw) {
      try {
        set({ token, user: JSON.parse(userRaw) });
      } catch {
        localStorage.removeItem('aw_token');
        localStorage.removeItem('aw_user');
      }
    }
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('aw_token', data.accessToken);
    localStorage.setItem('aw_user', JSON.stringify(data.user));
    set({ token: data.accessToken, user: data.user });
  },

  logout() {
    localStorage.removeItem('aw_token');
    localStorage.removeItem('aw_user');
    set({ token: null, user: null });
    window.location.href = '/login';
  },
}));
