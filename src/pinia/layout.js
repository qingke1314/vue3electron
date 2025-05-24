import { defineStore } from "pinia";

export const useLayoutStore = defineStore("layout", {
  state: () => {
    return {
      isCollapse: false,
      isMenuVisible: true,
    };
  },
  actions: {
    toggleCollapse() {
      this.isCollapse = !this.isCollapse;
    },
    toggleMenuVisibility() {
      this.isMenuVisible = !this.isMenuVisible;
    },
  },
});
