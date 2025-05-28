<template>
  <div class="log-list-container-directory">
    <LogCard
      v-for="(log_item, index) in formatIdLogs"
      :key="log_item.id + onlyOneLog"
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
      :defaultShow="index === 0 && onlyOneLog"
    />
    <el-empty
      v-if="!formatIdLogs || formatIdLogs.length === 0"
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
  onlyOneLog: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const emit = defineEmits(['action-completed']);
const handleLogClick = (log) => {
  console.log(log, 'lod');
  router.push({
    name: 'LogDetail',
    params: { id: log.id },
  });
};

const formatIdLogs = computed(() => {
  return props.logs.map((log) => {
    return {
      ...log,
      id: log.id.split('-')[1],
    };
  });
});

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
    postId: log.id,
  }).then((res) => {
    if (res.success) {
      ElMessage.success('移出目录成功');
      emit('action-completed');
    }
  });
};

const handleEdit = (log) => {
  console.log(log, 'lod');
  router.push({
    name: 'Editor',
    params: { id: log.id },
  });
};

const handleActionCompleted = (eventPayload) => {
  console.log('Action completed in directory log list:', eventPayload);
  emit('action-completed', eventPayload);
};
</script>

<style scoped lang="scss">
.log-list-container-directory {
  padding: 10px;
}

.log-card-directory-item {
  width: 100%;
  min-height: 130px;
  & + & {
    margin-top: 8px;
  }
  /* Styles for list-item mode can be further refined here if needed,
     or within LogCard.vue itself based on the displayMode prop. */
}
</style>
