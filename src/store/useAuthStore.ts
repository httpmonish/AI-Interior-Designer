import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  login: (name: string, email: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (name, email) => {
    const user = { id: `usr-${Date.now()}`, name, email };
    localStorage.setItem('roommind-auth', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('roommind-auth');
    set({ user: null });
  },
  initialize: () => {
    try {
      const stored = localStorage.getItem('roommind-auth');
      if (stored) {
        set({ user: JSON.parse(stored) });
      }
    } catch {
      // Ignore
    }
  },
}));
