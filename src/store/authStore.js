import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,

  login: (data) => {
    global.accessToken = data.accessToken;
    set({ user: data.user, accessToken: data.accessToken });
  },

  logout: () => {
    global.accessToken = null;
    set({ user: null, accessToken: null });
  },
}));

export default useAuthStore;
