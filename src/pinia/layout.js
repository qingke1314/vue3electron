import { defineStore } from "pinia";

export const useLayoutStore = defineStore("layout", {
  state: () => {
    return {
      isCollapse: false,
      showMenu: true,
    };
  },
  actions: {
    toggleCollapse() {
      this.isCollapse = !this.isCollapse;
    },
    toggleMenu() {
      this.showMenu = !this.showMenu;
    },
  },
});
