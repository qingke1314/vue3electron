<template>
  <div class="theme-switcher">
    <el-select :model-value="currentTheme" placeholder="选择主题" @change="onThemeChange">
      <el-option
        v-for="theme in availableThemes"
        :key="theme.value"
        :label="theme.name"
        :value="theme.value"
      />
    </el-select>
  </div>
</template>

<script setup>
import { useTheme, availableThemes as staticThemes } from '@/composables/useTheme'; // Import staticThemes if not using Pinia

const { currentTheme, setTheme } = useTheme();
const availableThemes = staticThemes; // Or get from Pinia store if integrated

const onThemeChange = (themeValue) => {
  setTheme(themeValue);
};
</script>

<style scoped>
.theme-switcher {
  margin: 10px;
}
</style>
