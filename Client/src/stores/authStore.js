import { create } from 'zustand';
import { loginApi, signupApi, logoutApi, getMeApi } from '../api/authApi.js';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,  

  get isAuthenticated() {
    const state = get();
    return !!state.user && !!state.accessToken;
  },

  login: async ({ email, password }) => {
    const response = await loginApi({ email, password });
    const { user, accessToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    set({ user, accessToken, isLoading: false });
    return response;
  },

 
  signup: async ({ name, email, password }) => {
    const response = await signupApi({ name, email, password });
    const { user, accessToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    set({ user, accessToken, isLoading: false });
    return response;
  },

 
  logout: async () => {
    try {
      await logoutApi();
    } catch {
      
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');

    set({ user: null, accessToken: null, isLoading: false });
  },


  hydrate: async () => {
    const accessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (!accessToken || !storedUser) {
      set({ user: null, accessToken: null, isLoading: false });
      return;
    }
    set({ accessToken, user: JSON.parse(storedUser) });

    try {
      const response = await getMeApi();
      const { user } = response.data;

      localStorage.setItem('user', JSON.stringify(user));
      set({ user, accessToken, isLoading: false });
    } catch {
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      set({ user: null, accessToken: null, isLoading: false });
    }
  },

 
  setTokens: ({ accessToken }) => {
    localStorage.setItem('accessToken', accessToken);
    set({ accessToken });
  },
}));

export default useAuthStore;
