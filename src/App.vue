<template>
  <el-config-provider :size="size" :z-index="zIndex">
    <router-view />
    <AppUpdater />
  </el-config-provider>
</template>

<script>
import { defineComponent } from 'vue';
import { ElConfigProvider } from 'element-plus';
import Layout from './components/Layout.vue';
import AppUpdater from './components/AppUpdater.vue';

export default defineComponent({
  components: {
    ElConfigProvider,
    Layout,
    AppUpdater,
  },
  setup() {
    return {
      zIndex: 3000,
      size: 'small',
    };
  },
});
</script>
