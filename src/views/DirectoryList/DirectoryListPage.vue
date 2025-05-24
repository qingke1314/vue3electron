 <template>
  <div class="directory-list-page" v-loading="loading">
    <h3>目录列表</h3>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DirectoryItem from './components/DirectoryItem.vue';
// import { getDirectories } from '@/apis/directories'; // 假设有一个获取目录的API

const directories = ref([]);
const loading = ref(false);
const router = useRouter();

// 模拟获取目录数据的API
const fetchDirectories = async () => {
  console.log('Fetching directories...');
  // 实际项目中，这里会调用API
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: 'dir_001', name: '工作文档', icon: 'Folder' },
        { id: 'dir_002', name: '个人项目', icon: 'Folder' },
        { id: 'dir_003', name: '学习资料', icon: 'FolderOpened' }, // 示例不同图标
        { id: 'dir_004', name: '旅行照片', icon: 'Folder' },
        { id: 'dir_005', name: '开发笔记', icon: 'Folder' },
      ]);
    }, 500);
  });
};

onMounted(async () => {
  loading.value = true;
  try {
    // directories.value = await getDirectories(); // 真实API调用
    directories.value = await fetchDirectories(); // 使用模拟API
  } catch (error) {
    console.error('Failed to fetch directories:', error);
    // ElMessage.error('获取目录列表失败'); // 如果使用Element Plus
  } finally {
    loading.value = false;
  }
});

const handleDirectoryDoubleClick = (directory) => {
  console.log('Directory double clicked:', directory);
  // 导航到日志列表页，并带上目录ID和目录名称
  router.push({
    name: 'LogsListByDirectory',
    params: { directoryId: directory.id },
    query: { directoryName: directory.name } // 添加 directoryName 到 query
  });
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
