<template>
  <div class="tree-container">
    <div class="filter-input">
      <el-input
        size="default"
        v-model="filterTextTree"
        placeholder="筛选目录或日志"
        clearable
        :suffix-icon="Search"
      />
      <el-tooltip class="box-item" effect="dark" content="在根目录新增" placement="top">
        <el-icon class="add-icon" @click="handleAdd()">
          <Plus />
        </el-icon>
      </el-tooltip>
    </div>
    <el-tree
      ref="treeRef"
      style="height: calc(100% - 40px); overflow-x: hidden; overflow-y: auto"
      :data="treeData"
      :props="defaultProps"
      node-key="id"
      :default-expanded-keys="defaultExpandedKeys"
      :expand-on-click-node="false"
      :filter-node-method="filterNodeMethodTree"
      @node-click="handleNodeClick"
      @node-contextmenu="handleContextMenu"
      draggable
      @node-drag-start="handleDragStart"
      @node-drag-enter="handleDragEnter"
      @node-drag-leave="handleDragLeave"
      @node-drag-over="handleDragOver"
      @node-drag-end="handleDragEnd"
      @node-drop="handleDrop"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <!-- 根据节点类型显示不同图标 -->
          <el-icon style="margin-right: 5px" color="var(--el-color-primary)">
            <Folder v-if="data.children" />
            <Document v-else />
          </el-icon>
          <span
            :style="`width: calc(180px - ${node.level * 16}px);`"
            class="node-label"
            :title="node.label"
            >{{ node.label }}</span
          >
        </span>
      </template>
    </el-tree>
  </div>

  <!-- 右键菜单 -->
  <div v-if="contextMenu.visible" :style="contextMenuPosition" class="context-menu">
    <ul class="menu-list">
      <li @click="handleAdd(contextMenu.data)">
        <el-icon><Plus /></el-icon> 新增目录
      </li>
      <li @click="handleAddPost(contextMenu.data)">
        <el-icon><Plus /></el-icon> 新增日志
      </li>
      <li @click="handleImportLogs(contextMenu.data)">
        <el-icon><Download /></el-icon> 导入日志
      </li>
      <li @click="handleRename(contextMenu.data)">
        <el-icon><EditPen /></el-icon> 重命名
      </li>
      <li @click="handleDelete(contextMenu.node, contextMenu.data)">
        <el-icon><Delete /></el-icon> 删除
      </li>
    </ul>
  </div>

  <!-- 导入日志对话框 -->
  <el-dialog
    v-model="importLogsDialogVisible"
    title="导入日志"
    width="60%"
    :before-close="handleImportDialogClose"
  >
    <div class="import-logs-container">
      <div class="filter-container">
        <el-input
          v-model="logsFilter"
          placeholder="搜索日志"
          clearable
          :suffix-icon="Search"
          @input="filterLogs"
        />
      </div>
      <div class="logs-list">
        <el-table
          ref="multipleTableRef"
          :data="filteredLogs"
          style="width: 100%"
          height="350px"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column property="title" label="标题" show-overflow-tooltip />
          <el-table-column
            property="createdAt"
            label="创建时间"
            width="180"
            :formatter="formatDate"
          />
        </el-table>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="importLogsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImportLogs" :disabled="selectedLogs.length === 0">
          导入选中的 {{ selectedLogs.length }} 篇日志
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import {
  getAllCategories,
  addCategory,
  addNewPostToCategory,
  importPostsToCategory,
  deleteCategory,
  renameCategory,
} from '@/apis/category';
import { getPosts } from '@/apis/posts';
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue';
// 导入 Element Plus 图标
import { Folder, Document, Search, Plus, EditPen, Delete, Download } from '@element-plus/icons-vue';

const emit = defineEmits(['node-click']);
const treeData = ref([]);
const treeRef = ref(null); // Ref for el-tree instance
const filterTextTree = ref(''); // Filter text for tree

// 导入日志相关
const importLogsDialogVisible = ref(false);
const logsFilter = ref('');
const allLogs = ref([]);
const filteredLogs = ref([]);
const selectedLogs = ref([]);
const multipleTableRef = ref(null);
const currentCategoryId = ref(null);
const defaultExpandedKeys = ref([]);

// Watch for changes in filterTextTree and apply filter to tree
watch(filterTextTree, (val) => {
  treeRef.value?.filter(val);
});

// Method to filter tree nodes
const filterNodeMethodTree = (value, data) => {
  if (!value) return true;
  return data.label.includes(value);
};

const defaultProps = {
  children: 'children',
  label: 'label',
  isLeaf: 'isLeaf',
};

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  node: null, // 暂时使用 any
  data: null,
});

const contextMenuPosition = computed(() => ({
  top: `${contextMenu.y}px`,
  left: `${contextMenu.x}px`,
}));

const loopMapTreeData = (data) => {
  return data.map((item) => {
    if (item.children) {
      item.children = item.children.map((e) => ({ ...e, parentDirectoryId: item.id }));
      item.children = loopMapTreeData(item.children);
    }
    return {
      ...item,
      label: item.name || item.title,
      isDirectory: !!item.children, // 确保 isDirectory 是布尔值
      id: !item.children ? `${item.parentDirectoryId}-${item.id}` : item.id,
    };
  });
};

const loadTreeData = async () => {
  const oldExpandedKeys = [];
  if (treeRef.value && treeRef.value.store) {
    for (const nodeId in treeRef.value.store.nodesMap) {
      if (treeRef.value.store.nodesMap[nodeId].expanded) {
        oldExpandedKeys.push(treeRef.value.store.nodesMap[nodeId].key);
      }
    }
  }

  try {
    const res = await getAllCategories();
    const newTreeData = loopMapTreeData(res || []);
    treeData.value = newTreeData;

    if (oldExpandedKeys.length > 0) {
      defaultExpandedKeys.value = oldExpandedKeys;
    } else if (newTreeData.length > 0 && newTreeData[0]) {
      defaultExpandedKeys.value = [newTreeData[0].id];
    } else {
      defaultExpandedKeys.value = [];
    }
    return newTreeData; // 返回处理后的数据
  } catch (error) {
    ElMessage.error('加载目录数据失败');
    console.error('Failed to fetch tree data:', error);
    treeData.value = []; // Set to empty array on error
    defaultExpandedKeys.value = [];
    return []; // 返回空数组
  }
};

onMounted(async () => {
  const initialTreeData = await loadTreeData(); // loadTreeData 会处理 defaultExpandedKeys
  if (initialTreeData && initialTreeData.length > 0 && initialTreeData[0]) {
    // 初始加载时，如果第一个节点存在，则触发点击事件
    // 注意：此时 defaultExpandedKeys 可能已经基于 oldExpandedKeys 或首节点ID设置了
    // 如果希望总是点击第一个节点，即便它之前不是展开的父节点的子节点，此逻辑保留
    // 如果希望基于恢复的展开状态来决定点击哪个，则需要更复杂的逻辑
    emit('node-click', initialTreeData[0]);
  }
  document.addEventListener('click', handleClickOutsideContextMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideContextMenu);
});

const handleClickOutsideContextMenu = () => {
  if (contextMenu.visible) {
    contextMenu.visible = false;
  }
};

const handleNodeClick = (data) => {
  emit('node-click', data);
  contextMenu.visible = false; // 点击节点时关闭右键菜单
};

const handleContextMenu = (event, data, node) => {
  // 只有目录才显示右键菜单
  if (!data.isDirectory) {
    return;
  }

  event.preventDefault();
  contextMenu.visible = true;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.node = node;
  contextMenu.data = data;
};

/**
 * 新增日志
 */
const handleAddPost = async (data) => {
  addNewPostToCategory(data.id, {
    title: `${data.name}-${new Date().getTime()}`,
    content: '写点什么吧！',
    published: false,
  }).then((res) => {
    ElMessage.success('新增成功');
    loadTreeData();
  });
};

/**
 * @param data 新增目录
 */
const handleAdd = async (data) => {
  contextMenu.visible = false;
  try {
    const { value } = await ElMessageBox.prompt('请输入新增目录的名称', '新增目录', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S/,
      inputErrorMessage: '目录名称不能为空',
    });
    if (value) {
      await addCategory({
        name: value,
        parentId: data ? data.id : null, // If data exists, it's a child, otherwise root
      });
      ElMessage.success('新增成功');
      await loadTreeData(); // Reload data
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('新增失败');
      console.error('Add failed:', error);
    }
  }
};

const handleRename = async (data) => {
  contextMenu.visible = false;
  if (!data) return;
  try {
    const { value } = await ElMessageBox.prompt('请输入新的目录名', '重命名', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: data.label,
      inputPattern: /\S/,
      inputErrorMessage: '目录名称不能为空',
    });
    if (value && value !== data.label) {
      // Assuming you have an updateCategory API
      await renameCategory(data.id, value); // Pass id and new name
      ElMessage.success('重命名成功');
      await loadTreeData(); // Reload data
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重命名失败');
      console.error('Rename failed:', error);
    }
  }
};

const handleDelete = async (node, data) => {
  contextMenu.visible = false;
  if (!data || !node) return;

  try {
    await ElMessageBox.confirm(`确定要删除目录 "${data.label}" 吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    // Assuming you have a deleteCategory API
    await deleteCategory(data.id); // Pass id to delete
    ElMessage.success('删除成功');
    await loadTreeData(); // Reload data
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
      console.error('Delete failed:', error);
    }
  }
};

// 拖拽相关处理函数
const handleDragStart = (node, ev) => {
  // node 类型暂时为 any
  console.log('drag start', node);
  contextMenu.visible = false;
};
const handleDragEnter = (
  draggingNode, // node 类型暂时为 any
  dropNode, // node 类型暂时为 any
  ev
) => {
  console.log('tree drag enter: ', dropNode.label);
};
const handleDragLeave = (
  draggingNode, // node 类型暂时为 any
  dropNode, // node 类型暂时为 any
  ev
) => {
  console.log('tree drag leave: ', dropNode.label);
};
const handleDragOver = (draggingNode, dropNode, ev) => {
  // node 类型暂时为 any
  // console.log('tree drag over: ', dropNode.label);
};
const handleDragEnd = (
  draggingNode, // node 类型暂时为 any
  dropNode, // node 类型暂时为 any
  dropType,
  ev
) => {
  console.log('tree drag end: ', dropNode && dropNode.label, dropType);
  // 此处应调用API保存拖拽结果
  if (dropNode && dropType !== 'none') {
    alert(`将"${draggingNode.data.label}"拖拽到"${dropNode.data.label}"(${dropType})`);
  }
};
const handleDrop = (
  draggingNode, // node 类型暂时为 any
  dropNode, // node 类型暂时为 any
  dropType,
  ev
) => {
  console.log('tree drop: ', dropNode.label, dropType);
  // 官方示例没有直接修改 treeData 来响应 drop，而是依赖 allowDrop 和 allowDrag
  // 这里我们简单地记录，实际应用中可能需要更复杂的逻辑来更新数据源并通知后端
};

// 处理导入日志
const handleImportLogs = async (data) => {
  contextMenu.visible = false;
  if (!data) return;

  currentCategoryId.value = data.id;
  importLogsDialogVisible.value = true;

  try {
    // 获取所有日志
    const posts = await getPosts();
    allLogs.value = posts || [];
    filteredLogs.value = [...allLogs.value];
  } catch (error) {
    ElMessage.error('获取日志列表失败');
    console.error('Failed to fetch posts:', error);
  }
};

// 关闭导入对话框
const handleImportDialogClose = () => {
  importLogsDialogVisible.value = false;
  logsFilter.value = '';
  selectedLogs.value = [];
};

// 过滤日志
const filterLogs = () => {
  if (!logsFilter.value) {
    filteredLogs.value = [...allLogs.value];
    return;
  }

  const keyword = logsFilter.value.toLowerCase();
  filteredLogs.value = allLogs.value.filter((log) => log.title.toLowerCase().includes(keyword));
};

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedLogs.value = selection;
};

// 格式化日期
const formatDate = (row, column, cellValue) => {
  if (!cellValue) return '';
  return new Date(cellValue).toLocaleString();
};

// 确认导入日志
const confirmImportLogs = async () => {
  if (selectedLogs.value.length === 0) {
    ElMessage.warning('请至少选择一篇日志');
    return;
  }

  try {
    const postIds = selectedLogs.value.map((log) => log.id);
    await importPostsToCategory(currentCategoryId.value, postIds);
    ElMessage.success(`成功导入 ${selectedLogs.value.length} 篇日志`);
    importLogsDialogVisible.value = false;
    await loadTreeData(); // 重新加载树数据
  } catch (error) {
    ElMessage.error('导入日志失败');
    console.error('Failed to import logs:', error);
  }
};

defineExpose({
  loadTreeData,
});
</script>

<style scoped>
/* 新增：包裹 el-tree 的容器，用于添加边框和圆角 */
.tree-container {
  background: var(--el-bg-color);
  box-shadow: 0px 0px 10px #d7d7d7;
  border-radius: 6px;
  height: calc(100vh - 90px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 10px;
  width: 100%;
}

.filter-input {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-icon {
  cursor: pointer;
  color: var(--el-color-primary);
  margin-left: 5px;
}

/* el-tree itself now takes remaining height */

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 15px; /* 增大字体大小 */
  padding: 5px 0px;
}

/* 如果图标也需要相应增大，可以单独设置 */
.custom-tree-node .el-icon {
  font-size: 18px; /* 图标稍大于文字或与文字同大 */
}

/* 添加节点文字超出显示省略号的样式 */
.node-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 24px); /* 减去图标的宽度 */
  display: inline-block;
}

:deep(.el-tree-node__content) {
  height: 30px;
}
:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}

/* .el-tree 已被 .tree-container 包裹，如果之前有对 .el-tree 的特定padding，可能需要调整或移除 */
/* .el-tree {
  padding: 5px;
} */

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ccc;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  border-radius: 4px;
  min-width: 100px;
}

.menu-list {
  list-style: none;
  padding: 5px 0;
  margin: 0;
}

.menu-list li {
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
}

.menu-list li:hover {
  background-color: #ecf5ff;
  color: var(--el-color-primary);
}

/* 导入日志对话框样式 */
.import-logs-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-container {
}

.logs-list {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  gap: 12px;
}
</style>
