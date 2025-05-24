<template>
  <div class="log-list-container-directory">
    <LogCard
      v-for="log_item in logs"
      :key="log_item.id"
      :log="log_item"
      :actions="['view-details']"
      displayMode="list-item"
      class="log-card-directory-item"
      @view-details="handleLogClick"
      @action-completed="handleActionCompleted"
      @title-click="handleLogClick"
      @preview-click="handleLogClick"
    />
    <el-empty v-if="!logs || logs.length === 0" description="该目录下暂无日志"></el-empty>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import LogCard from '@/components/LogCard.vue';

const props = defineProps({
  logs: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['log-click', 'action-completed']);

const handleLogClick = (log) => {
  emit('log-click', log);
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