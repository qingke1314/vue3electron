<template>
  <div class="log-list-container-directory">
    <LogCard
      v-for="log_item in props.logs"
      :key="log_item.id"
      :log="log_item"
      actions="all"
      displayMode="list-item"
      class="log-card-directory-item"
      @edit="handleEdit"
      @view-details="handleLogClick"
      @action-completed="handleActionCompleted"
      @title-click="handleLogClick"
      @preview-click="handleLogClick"
      @remove-from-catalog="handleRemoveFromCatalog"
    />
    <el-empty
      v-if="!props.logs || props.logs.length === 0"
      description="该目录下暂无日志"
    ></el-empty>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import LogCard from '@/components/LogCard.vue';
import { useRouter } from 'vue-router';
import { removePostFromCatalog } from '@/apis/category';

const props = defineProps({
  logs: {
    type: Array,
    required: true,
  },
  categoryId: {
    type: String,
  },
});

const router = useRouter();
const emit = defineEmits(['action-completed']);
const handleLogClick = (log) => {
  router.push({
    name: 'LogDetail',
    params: { id: log.id.split('-')[1] },
  });
};

const handleRemoveFromCatalog = async (log) => {
  console.log(log, 'log');
  if (!log.parentDirectoryId && !props.categoryId) {
    return ElMessage.error('请先在左侧选择目录');
  }
  await ElMessageBox.confirm(`确定要从目录中移除日志 "${log.title}" 吗?`, '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });
  removePostFromCatalog({
    categoryId: log.parentDirectoryId || props.categoryId,
    postId: log.id.split('-')[1],
  }).then((res) => {
    if (res.success) {
      ElMessage.success('移出目录成功');
      emit('action-completed');
    }
  });
};

const handleEdit = (log) => {
  router.push({
    name: 'Editor',
    params: { id: log.id.split('-')[1] },
  });
};

const handleActionCompleted = (eventPayload) => {
  console.log('Action completed in directory log list:', eventPayload);
  emit('action-completed', eventPayload);
};
</script>

<style scoped lang="scss">
.log-list-container-directory {
  overflow-x: hidden;
  padding: 10px;
  display: flex;
  flex-direction: column; // 确保子元素垂直排列，卡片独占一行
  gap: 15px; // 卡片之间的间距
}

.log-card-directory-item {
  width: 100%;
  /* Styles for list-item mode can be further refined here if needed,
     or within LogCard.vue itself based on the displayMode prop. */
}
</style>
