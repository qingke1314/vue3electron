<template>
  <div class="theme-switcher-container">
    <el-dropdown @command="onThemeChange" trigger="hover">
      <div class="theme-trigger-circle" :title="`当前主题: ${currentThemeDisplayName}`"></div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="theme in availableThemes"
            :key="theme.value"
            :command="theme.value"
            :style="{ color: getThemeColor(theme.value) }"
            :class="{ 'is-active': theme.value === currentTheme }"
          >
            {{ theme.name }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTheme, availableThemes as staticThemes } from '@/composables/useTheme';

const { currentTheme, setTheme } = useTheme();
// availableThemes可以直接从composable导入，因为它是导出的常量
const availableThemes = staticThemes;

const getThemeColor = (themeValue) => {
  const theme = availableThemes.find((t) => t.value === themeValue);
  return theme ? theme.color : 'var(--el-color-primary)';
};

const currentThemeDisplayName = computed(() => {
  const theme = availableThemes.find((t) => t.value === currentTheme.value);
  return theme ? theme.name : '未知';
});

const onThemeChange = (themeValue) => {
  setTheme(themeValue);
};
</script>

<style scoped>
.theme-switcher-container {
  /* 根据需要调整样式，例如在header中的位置 */
  display: flex;
  align-items: center;
}

.theme-trigger-circle {
  transform: translateY(1px);
  width: 16px; /* 圆圈大小 */
  height: 16px;
  border-radius: 50%; /* 使其成为圆形 */
  background-color: var(--el-color-primary); /* 使用主题的主色作为背景 */
  cursor: pointer;
  display: flex; /* 用于内部图标对齐（如果添加的话） */
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-color-primary-light-7); /* 可选：给圆圈一个边框 */
  transition: transform 0.2s ease-in-out; /* 可选：添加一点交互效果 */
}

.theme-trigger-circle:hover {
  transform: scale(1.1); /* 可选：鼠标悬浮时放大 */
  /* 或者改变边框颜色等 */
  /* border-color: var(--el-color-primary-light-3); */
}

.el-dropdown-menu__item.is-active {
  color: var(--el-color-primary);
  font-weight: bold;
  background-color: var(--el-color-primary-light-9); /* 给激活项一个背景色 */
}
</style>
