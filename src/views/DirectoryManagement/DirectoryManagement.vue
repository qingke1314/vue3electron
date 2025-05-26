<template>
  <div class="directory-management-container">
    <div class="left-panel">
      <DirectoryTree ref="treeRef" @node-click="handleNodeClick" />
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
        :categoryId="currentSelectedNode?.isDirectory ? currentSelectedNode?.id : ''"
        v-if="currentSelectedNode"
        :logs="filteredCurrentLogs"
        @log-click="handleLogClick"
        @action-completed="handleLogActionCompleted"
      />
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
const currentSelectedNode = ref(null);
const filterTextLogs = ref('');
const treeRef = ref(null);

const filteredCurrentLogs = computed(() => {
  if (!filterTextLogs.value) {
    return currentLogs.value;
  }
  return currentLogs.value.filter(
    (log) =>
      (log.title && log.title.toLowerCase().includes(filterTextLogs.value.toLowerCase())) ||
      (log.content && log.content.toLowerCase().includes(filterTextLogs.value.toLowerCase()))
  );
});

const handleNodeClick = async (node) => {
  currentSelectedNode.value = node;
  filterTextLogs.value = '';
  currentLogs.value = node?.isDirectory ? node.children.filter((e) => !e.isDirectory) : [node];
};

const handleLogClick = (log) => {};

const handleLogActionCompleted = async (eventPayload) => {
  // 左侧树重新加载
  treeRef.value.loadTreeData();
  handleNodeClick(null);
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
  flex: 1;
  height: calc(100vh - 90px);
  border-radius: 5px;
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
