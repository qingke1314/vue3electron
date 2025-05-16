<template>
  <el-container class="common-layout">
    <el-header class="common-header">
      <LoginHeader />
    </el-header>
    <el-container style="overflow: hidden">
      <el-aside :width="asideWidth" class="common-aside">
        <side-menu :menu-items="menuConfig" />
      </el-aside>
      <el-main class="common-main">
        <router-view />
      </el-main>
    </el-container>
    <el-footer v-if="false" class="common-footer"></el-footer>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useLayoutStore } from '@/pinia/layout';
import { menuConfig } from '@/utils/const';
import LoginHeader from '@/views/LoginHeader.vue';
import SideMenu from './SideMenu.vue';

const { isCollapse } = storeToRefs(useLayoutStore());

const asideWidth = computed(() => {
  return isCollapse.value ? '64px' : '200px';
});
</script>

<style lang="scss" scoped>
.common-layout {
  height: 100vh;
  .common-header {
    background-image: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-color-primary-light-7) 100%
    );
    // 添加一些内边距和文本样式，使其看起来更像页眉
    padding: 0 20px;
    display: flex;
    align-items: center;
    color: var(--el-text-color-primary);
  }
  .common-aside {
    transition: width 0.3s;
    // background-color: var(--el-color-primary-light-9);
    // 确保侧边栏内容不会溢出，如果菜单很长，可以考虑滚动条
    overflow-y: auto;
    overflow-x: hidden; /* 防止折叠时出现水平滚动条 */
  }
  .common-main {
    height: 100%;
    overflow: hidden;
    padding: 12px; // 给主内容区一些内边距
    background-color: var(--el-bg-color-page);
  }
  .common-footer {
    background-color: var(--el-color-info-light-7);
    // 添加一些内边距和文本样式
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-regular);
    height: 20px; // 定义一个合适的高度
    line-height: 20px;
  }
}
.toggle-btn {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 1px solid black;
  border-radius: 50%;
  left: 100px;
  top: 60px;
}
</style>
