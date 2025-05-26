<template>
  <el-container class="common-layout">
    <el-header class="common-header">
      <LoginHeader />
    </el-header>
    <el-container style="overflow: hidden">
      <el-aside :width="asideWidth" class="common-aside" v-show="isMenuVisible">
        <side-menu :menu-items="menuConfig" />
      </el-aside>
      <el-main class="common-main">
        <!-- keep-alive 缓存组件 -->
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
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

const layoutStore = useLayoutStore(); // 获取 layout store 实例
const { isCollapse, isMenuVisible } = storeToRefs(layoutStore); // 解构 isMenuVisible

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
    transition: width 0.3s ease-in-out;
    // background-color: var(--el-color-primary-light-9);
    // 确保侧边栏内容不会溢出，如果菜单很长，可以考虑滚动条
    overflow-y: auto;
    overflow-x: hidden; /* 防止折叠时出现水平滚动条 */
    // 注意：当使用 transform 进行滑动动画时，如果父容器有 overflow: hidden，
    // 可能需要确保 el-aside 本身在动画过程中不会被立即裁剪。
    // 不过对于 translateX(-100%)，通常是可行的。
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

// .menu-slide-enter-to 和 .menu-slide-leave-from 默认是 transform: translateX(0) 和 opacity: 1
</style>
