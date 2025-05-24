<template>
  <div class="log-detail-container" v-if="log">
    <el-card class="log-detail-card">
      <template #header>
        <div class="card-header">
          <span>{{ log.title }}</span>
          <!-- 可以添加返回列表的按钮或操作 -->
        </div>
      </template>
      <div class="log-meta">
        <span class="log-date">创建于: {{ formatDate(log.createdAt) }}</span>
        <!-- 可以添加其他元数据 -->
      </div>
      <div class="log-content" v-html="log.content"></div> <!--  v-html 用于渲染可能的富文本内容 -->
    </el-card>
  </div>
  <el-empty v-else description="未选择日志"></el-empty>
</template>

<script setup>
import { defineProps } from 'vue';



const props = defineProps({
  log: Object,
});

const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};
</script>

<style scoped lang="scss">
.log-detail-container {
  height: 100%;
}

.log-detail-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-card__header) {
    flex-shrink: 0;
  }
  :deep(.el-card__body) {
    flex-grow: 1;
    overflow-y: auto;
  }
}

.card-header {
  font-weight: bold;
  font-size: 1.2em;
}

.log-meta {
  font-size: 0.9em;
  color: #888;
  margin-bottom: 15px;
}

.log-content {
  line-height: 1.6;
  // 根据实际内容调整样式，例如处理代码块、图片等
}
</style> 