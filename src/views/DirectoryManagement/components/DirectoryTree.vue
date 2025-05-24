<template>
  <div class="tree-container">
    <el-input
      size="default"
      v-model="filterTextTree"
      placeholder="筛选目录或日志"
      clearable
      class="filter-input"
      :suffix-icon="Search"
    />
    <el-tree
      ref="treeRef" 
      style="height: calc(100% - 40px);" 
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
          <el-icon style="margin-right: 5px;" :color="getNodeIconColor(node, data)">
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
      <li @click="handleAdd(contextMenu.node, contextMenu.data)">新增</li>
      <li @click="handleRename(contextMenu.node, contextMenu.data)">重命名</li>
      <li @click="handleDelete(contextMenu.node, contextMenu.data)">删除</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue';
// 导入 Element Plus 图标
import { Folder, Document, Search } from '@element-plus/icons-vue';

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

// Function to determine icon color based on node type
const getNodeIconColor = (node, data) => {
  const isDirectory = !node.isLeaf || (data.children && data.children.length > 0);
  if (isDirectory) {
    return '#FFC107'; // Example: Yellow for folders (like anila folder color)
  } else {
    return '#409EFF'; // Example: Blue for documents (Element Plus primary color)
  }
  // You can add more conditions, e.g., based on data.type or other properties
};

// 模拟获取目录数据
const fetchTreeData = async () => {
  // 实际项目中，这里会调用API
  return [
    {
      id: '1',
      label: '目录 1',
      children: [
        {
          id: '1-1',
          label: '目录 1-1',
          children: [
            { id: '1-1-1', label: '日志 1-1-1' },
            { id: '1-1-2', label: '日志 1-1-2' },
          ],
        },
      ],
    },
    {
      id: '2',
      label: '目录 2',
      children: [
        { id: '2-1', label: '日志 2-1' },
        { id: '2-2', label: '日志 2-2' },
      ],
    },
    {
      id: '3',
      label: '空目录 3',
    },
    {
      id: '4',
      label: '顶级日志文件'
    }
  ];
};

onMounted(async () => {
  treeData.value = await fetchTreeData();
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

const handleContextMenu = (event, data, node) => { // node 类型暂时为 any
  event.preventDefault();
  contextMenu.visible = true;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.node = node;
  contextMenu.data = data;
};

const handleAdd = (node, data) => { // node 类型暂时为 any
  console.log('Add', data);
  if (!data) return;
  const newChild = { id: Date.now().toString(), label: '新目录', children: [] };
  if (!data.children) {
    data.children = [];
  }
  data.children.push(newChild);
  treeData.value = [...treeData.value]; // 触发视图更新
  contextMenu.visible = false;
  // 此处应调用API保存新增
  alert(`在"${data.label}"下新增目录`);
};

const handleRename = (node, data) => { // node 类型暂时为 any
  console.log('Rename', data);
  if (!data) return;
  const newName = prompt('请输入新的目录名：', data.label);
  if (newName && newName !== data.label) {
    data.label = newName;
    // 此处应调用API保存重命名
    alert(`目录"${data.id}"重命名为"${newName}"`);
  }
  contextMenu.visible = false;
};

const handleDelete = (node, data) => { // node 类型暂时为 any
  console.log('Delete', data);
  if (!data || !node || !node.parent) return;

  const children = node.parent.data.children || node.parent.data;
  const index = children.findIndex(d => d.id === data.id);
  if (index > -1) {
    children.splice(index, 1);
  }
  treeData.value = [...treeData.value]; // 触发视图更新
  contextMenu.visible = false;
  // 此处应调用API保存删除
  alert(`删除目录"${data.label}"`);
};

// 拖拽相关处理函数
const handleDragStart = (node, ev) => { // node 类型暂时为 any
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
const handleDragOver = (draggingNode, dropNode, ev) => { // node 类型暂时为 any
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
  padding:10px;
}

.filter-input {
  margin-bottom: 10px;
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
  padding-top: 4px;    /* 调整节点内容的上下 padding */
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
  box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
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