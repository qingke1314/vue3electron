<template>
  <div class="directory-management-container">
    <div class="left-panel">
      <DirectoryTree @node-click="handleNodeClick" />
    </div>
    <div class="right-panel">
      <el-input
        size="default"
        :suffix-icon="Search"
        v-model="filterTextLogs"
        placeholder="筛选日志标题或内容"
        clearable
        class="filter-input-logs"
        :disabled="!currentSelectedNode" 
      />
      <LogList 
        v-if="!selectedLog && currentSelectedNode" 
        :logs="filteredCurrentLogs" 
        @log-click="handleLogClick" 
        @action-completed="handleLogActionCompleted"
      />
      <LogDetail v-else-if="selectedLog" :log="selectedLog" />
      <el-empty v-else description="请先在左侧选择一个目录"></el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import DirectoryTree from './components/DirectoryTree.vue';
import LogList from './components/LogList.vue';
import LogDetail from './components/LogDetail.vue';
import { Search } from '@element-plus/icons-vue';

const currentLogs = ref([]);
const selectedLog = ref(null);
const currentSelectedNode = ref(null);
const filterTextLogs = ref('');

const filteredCurrentLogs = computed(() => {
  if (!filterTextLogs.value) {
    return currentLogs.value;
  }
  return currentLogs.value.filter(log => 
    (log.title && log.title.toLowerCase().includes(filterTextLogs.value.toLowerCase())) ||
    (log.content && log.content.toLowerCase().includes(filterTextLogs.value.toLowerCase()))
  );
});

const fetchLogsForDirectory = async (directoryId) => {
  console.log(`Fetching logs for directory ${directoryId}`);
  return [
    { id: 'log1', title: `日志1 from ${directoryId}`, content: '这是日志1的内容，包含关键字 apple' },
    { id: 'log2', title: `日志2 from ${directoryId}`, content: '这是日志2的内容，banana' },
    { id: 'log3', title: `Another Log from ${directoryId}`, content: 'Content with APPLE and Orange' },
  ];
};

const handleNodeClick = async (node) => {
  currentSelectedNode.value = node;
  selectedLog.value = null;
  filterTextLogs.value = '';
  currentLogs.value = await fetchLogsForDirectory(node.id);
};

const handleLogClick = (log) => {
  selectedLog.value = log;
};

const handleLogActionCompleted = async (eventPayload) => {
  console.log('Log action in directory management:', eventPayload);
  if (currentSelectedNode.value) {
    currentLogs.value = await fetchLogsForDirectory(currentSelectedNode.value.id);
  }
  if (eventPayload.type === 'delete' && selectedLog.value && selectedLog.value.id === eventPayload.logId) {
    selectedLog.value = null;
  }
};
</script>

<style lang="scss" scoped>
.directory-management-container {
  display: flex;
  height: calc(100vh - 50px);
}

.left-panel {
  // background: var(--el-bg-color);
  width: 250px;
  margin-right: 10px;
  // padding: 10px;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
}

.right-panel {
  height: calc(100vh - 90px);
  border-radius: 5px;
  flex-grow: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.filter-input-logs {
  margin-bottom: 10px;
  flex-shrink: 0;
}

:deep(.log-list-container-directory),
:deep(.log-detail-container) {
  flex-grow: 1;
  overflow-y: auto;
}
</style> 