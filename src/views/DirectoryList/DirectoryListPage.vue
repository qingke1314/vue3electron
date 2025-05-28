<template>
  <div class="directory-list-page" v-loading="loading">
    <div style="font-weight: bold; font-size: 18px; margin-bottom: 10px">
      <el-icon
        style="transform: translateY(4px); cursor: pointer"
        v-if="lastDirectoryArray.length > 0"
        :size="20"
        @click="handleBackClick"
      >
        <ArrowLeft />
      </el-icon>
      目录列表
    </div>
    <div class="directory-grid">
      <DirectoryItem
        v-for="dir in directories"
        :key="dir.id"
        :directory="dir"
        @dblclick="handleDirectoryDoubleClick(dir)"
      />
    </div>
    <el-empty v-if="!directories.length && !loading" description="暂无目录"></el-empty>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import DirectoryItem from './components/DirectoryItem.vue';
import { getAllCategories } from '@/apis/category';
import { getItemById } from '@/utils/utils';

const directories = ref([]);
const lastDirectoryArray = ref([]);
const loading = ref(false);
const router = useRouter();
const routeQuery = useRoute().query;
// 模拟获取目录数据的API
const fetchDirectories = async () => {
  console.log('Fetching directories...');
  // 实际项目中，这里会调用API
  const res = await getAllCategories();
  return (res || []).map((e) => ({
    children: e.children || [],
    id: e.id,
    name: e.name,
    icon: e.children ? 'FolderOpened' : 'Folder',
  }));
};

onMounted(async () => {
  loading.value = true;
  try {
    directories.value = await fetchDirectories(); // 使用模拟API
  } catch (error) {
    console.error('Failed to fetch directories:', error);
    // ElMessage.error('获取目录列表失败'); // 如果使用Element Plus
  } finally {
    loading.value = false;
  }
});

const handleBackClick = () => {
  directories.value = lastDirectoryArray.value.pop();
};

const handleDirectoryDoubleClick = (directory) => {
  const directoryItem = getItemById(directory.id, directories.value);
  if (directoryItem && directoryItem.children) {
    lastDirectoryArray.value.push(directories.value);
    directories.value = directoryItem.children.map((e) => ({
      ...e,
      name: e.name || e.title,
      icon: e.children ? 'FolderOpened' : 'Folder',
    }));
  } else {
    router.push({ name: 'LogDetail', params: { id: directoryItem.id } });
  }
};
</script>

<style scoped lang="scss">
.directory-list-page {
  padding: 20px;
  height: calc(100vh - 90px); // 根据您的布局调整
  overflow-y: auto;
  box-sizing: border-box;
  background-color: var(--el-bg-color, #fff); // 保持背景色一致
  border-radius: 5px; // 根据您的布局调整
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.directory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); // 自适应网格
  //gap: 20px;
}
</style>
