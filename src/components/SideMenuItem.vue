<template>
  <template v-for="subItem in items" :key="subItem.path || subItem.name">
    <el-sub-menu
      v-if="subItem.children && subItem.children.length > 0"
      :index="subItem.path || subItem.name"
    >
      <template #title>
        <el-icon v-if="subItem.icon"
          ><component :is="iconMap[subItem.icon]"
        /></el-icon>
        <span>{{ subItem.name }}</span>
      </template>
      <!-- 递归调用自身 -->
      <SideMenuItem :items="subItem.children" />
    </el-sub-menu>
    <el-menu-item v-else :index="subItem.path">
      <el-icon v-if="subItem.icon"
        ><component :is="iconMap[subItem.icon]"
      /></el-icon>
      <template #title>{{ subItem.name }}</template>
    </el-menu-item>
  </template>
</template>

<script setup>
import { defineProps } from "vue";
import { iconMap } from "@/utils/const";

// Element Plus 组件 (el-sub-menu, el-menu-item, el-icon)
// 假设是全局注册的，如果不是，则需要在此处导入。

defineProps({
  items: {
    type: Array,
    required: true,
  },
});
</script>

<!-- 显式命名组件对于递归组件是一个好习惯 -->
<script>
export default {
  name: "SideMenuItem",
};
</script>

<style scoped>
/* 如果 SideMenuItem 组件有特定的样式，可以在这里添加 */
</style>
