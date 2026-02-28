import { defineStore } from 'pinia';
import { validateToken } from '@/apis/users'; // 导入获取用户信息的 API

export const useUsersStore = defineStore('users', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || sessionStorage.getItem('token') || null,
  }),
  getters: {
    isProfileLoaded(state) {
      return state.userInfo && Object.keys(state.userInfo).length > 0;
    },
    isLoggedIn(state) {
      return !!state.token && this.isProfileLoaded;
    },
  },
  actions: {
    setUserInfo(userInfo) {
      this.userInfo = userInfo;
    },
    setToken(newToken, rememberMe = false) {
      this.token = newToken;
      if (rememberMe) {
        localStorage.setItem('token', newToken);
        sessionStorage.removeItem('token');
      } else {
        sessionStorage.setItem('token', newToken);
        localStorage.removeItem('token');
      }
    },
    clearTokenAndInfo() {
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    },
    async fetchAndSetUser() {
      if (!this.token) {
        return false;
      }
      try {
        const response = await validateToken();
        if (response?.data?.user) {
          this.userInfo = response.data.user;
          return true;
        } else {
          console.warn(
            'Fetched user profile but data is missing or in unexpected format:',
            response
          );
          this.clearTokenAndInfo();
          return false;
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        this.clearTokenAndInfo();
        return false;
      }
    },
    updateUserProfile(partialInfo) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...partialInfo };
      }
    },
    logout() {
      this.clearTokenAndInfo();
    },
  },
});
