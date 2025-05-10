<template>
  <div class="content">
    <el-menu
      :default-active="activeMenu"
      class="el-menu-vertical-demo"
      router
      @select="handleSelect"
      :collapse="isCollapse"
    >
      <template v-for="item in menuItems" :key="item.path || item.name">
        <el-sub-menu
          v-if="item.children && item.children.length > 0"
          :index="item.path || item.name"
        >
          <template #title>
            <el-icon v-if="item.icon"
              ><component :is="iconMap[item.icon]"
            /></el-icon>
            <span>{{ item.name }}</span>
          </template>
          <side-menu-item :items="item.children" />
        </el-sub-menu>
        <el-menu-item v-else :index="item.path">
          <el-icon v-if="item.icon"
            ><component :is="iconMap[item.icon]"
          /></el-icon>
          <template #title>{{ item.name }}</template>
        </el-menu-item>
      </template>
    </el-menu>
    <div @click="toggleCollapse" class="toggle">
      <el-icon
        ><DArrowRight v-if="isCollapse" /> <DArrowLeft v-else></DArrowLeft
      ></el-icon>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import SideMenuItem from "./SideMenuItem.vue";
import { iconMap } from "@/utils/const";
import { DArrowRight, DArrowLeft } from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";
import { useLayoutStore } from "@/pinia/layout";

const layoutStore = useLayoutStore();
const { isCollapse } = storeToRefs(layoutStore);
const { toggleCollapse } = layoutStore;
defineProps({
  menuItems: {
    type: Array,
    required: true,
    default: () => [],
  },
});

const route = useRoute();
const activeMenu = computed(() => {
  const { meta, path } = route;
  if (meta.activeMenu) {
    return meta.activeMenu;
  }
  return path;
});

const handleSelect = (index, indexPath, item, routeResult) => {
  console.log("Menu selected:", index, indexPath, item, routeResult);
  // Navigation is handled by the 'router' prop on el-menu
};
</script>

<style scoped>
.content {
  height: 100%;
  position: relative;
}
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  min-height: 100%; /* Ensure menu takes full height of its container */
}
.el-menu {
  padding-bottom: 20px;
  border-right: none; /* Remove default border if not desired */
}
.toggle {
  position: absolute;
  width: 100%;
  bottom: 0;
  box-shadow: 5px 5px 10px 0px #596852;
  height: 22px;
  padding: 2px 0px;
  text-align: center;
  color: var(--el-color-primary);
  cursor: pointer;
}
</style>
