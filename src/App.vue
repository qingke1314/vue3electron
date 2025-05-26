<template>
  <el-config-provider :size="size" :z-index="zIndex">
    <router-view />
    <AppUpdater />
  </el-config-provider>
</template>

<script>
import { useTheme } from '@/composables/useTheme';
import { defineComponent } from 'vue';
import Layout from './components/Layout.vue';
import AppUpdater from './components/AppUpdater.vue';

export default defineComponent({
  components: {
    Layout,
    AppUpdater,
  },
  setup() {
    useTheme(); // 这将自动处理主题的加载
    return {
      zIndex: 3000,
      size: 'small',
    };
  },
});
</script>
