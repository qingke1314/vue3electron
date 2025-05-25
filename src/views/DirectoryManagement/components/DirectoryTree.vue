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
      <el-tooltip
        class="box-item"
        effect="dark"
        content="在根目录新增"
        placement="top"
      >
        <el-icon class="add-icon" @click="handleAdd()">
          <Plus />
        </el-icon>
      </el-tooltip>
    </div>
    <el-tree
      ref="treeRef"
      style="height: calc(100% - 40px)"
      :data="treeData"
      :props="defaultProps"
      node-key="id"
      default-expand-all
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
            <Folder v-if="!node.isLeaf || (data.children && data.children.length > 0)" />
            <Document v-else />
          </el-icon>
          <span>{{ node.label }}</span>
        </span>
      </template>
    </el-tree>
  </div>

  <!-- 右键菜单 -->
  <div v-if="contextMenu.visible" :style="contextMenuPosition" class="context-menu">
    <ul class="menu-list">
      <li @click="handleAdd(contextMenu.data)">
        <el-icon><Plus /></el-icon> 新增
      </li>
      <li @click="handleRename(contextMenu.data)">
        <el-icon><EditPen /></el-icon> 重命名
      </li>
      <li @click="handleDelete(contextMenu.node, contextMenu.data)">
        <el-icon><Delete /></el-icon> 删除
      </li>
    </ul>
  </div>
</template>

<script setup>
import { getAllCategories, addCategory } from '@/apis/category';
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
// 导入 Element Plus 图标
import { Folder, Document, Search, Plus, EditPen, Delete } from '@element-plus/icons-vue';

const emit = defineEmits(['node-click']);

const treeData = ref([]);
const treeRef = ref(null); // Ref for el-tree instance
const filterTextTree = ref(''); // Filter text for tree

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
  isLeaf: 'isLeaf'
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
      item.children = loopMapTreeData(item.children);
    }
    return {
      ...item,
      id: item.id,
      label: item.name,
    };
  });
};

const loadTreeData = async () => {
  try {
    const res = await getAllCategories();
    // Ensure children is always an array, and map isLeaf correctly
    treeData.value = loopMapTreeData(res || []);
  } catch (error) {
    ElMessage.error('加载目录数据失败');
    console.error('Failed to fetch tree data:', error);
    treeData.value = []; // Set to empty array on error
  }
};

onMounted(async () => {
  await loadTreeData();
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
  // node 类型暂时为 any
  event.preventDefault();
  contextMenu.visible = true;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.node = node;
  contextMenu.data = data;
};

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
      // await updateCategory({ id: data.id, name: value }); // Pass id and new name
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
    await ElMessageBox.confirm(
      `确定要删除目录 "${data.label}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    // Assuming you have a deleteCategory API
    // await deleteCategory(data.id); // Pass id to delete
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
</script>

<style scoped>
/* 新增：包裹 el-tree 的容器，用于添加边框和圆角 */
.tree-container {
  background: var(--el-bg-color);
  box-shadow: 0px 0px 10px #d7d7d7;
  border-radius: 6px;
  height: calc(100vh - 90px);
  box-sizing: border-box;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  padding: 10px;
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
  padding: 3px 0px;
}

/* 如果图标也需要相应增大，可以单独设置 */
.custom-tree-node .el-icon {
  font-size: 18px; /* 图标稍大于文字或与文字同大 */
}

/* Element Tree 节点内容区的默认 padding 可能会影响最终视觉效果，需要覆盖 */
:deep(.el-tree-node__content) {
  padding-top: 4px; /* 调整节点内容的上下 padding */
  padding-bottom: 4px;
  height: auto; /* 让高度自适应内容 */
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
</style>
