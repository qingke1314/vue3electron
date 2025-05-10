import { defineStore } from 'pinia';

export const useUsersStore = defineStore('users', {
  state: () => {
    return {
      userInfo: null,
    };
  },
  actions: {
    setUserInfo(userInfo) {
      this.userInfo = userInfo;
    },
    getUserInfo() {
      return this.userInfo;
    },
    clearUserInfo() {
      this.userInfo = null;
    },
  },
});
