<template>
  <el-card 
    class="log-card"
    :shadow="displayMode === 'list-item' ? 'always' : 'hover'" 
    v-loading="isLoading"
  >
    <template #header>
      <div class="card-header">
        <span class="log-title" @click.stop="emit('title-click', log)">{{ log.title }}</span>
        <div class="header-actions">
          <el-tag :type="log.published ? 'success' : 'info'" size="small">
            {{ log.published ? '已发布' : '草稿' }}
          </el-tag>
          <el-tooltip
            :content="log.isFavoritedByCurrentUser ? '取消收藏' : '收藏'"
            placement="top"
          >
            <el-button
              :icon="log.isFavoritedByCurrentUser ? StarFilled : Star"
              circle
              size="small"
              @click.stop="internalToggleFavorite"
              :class="{ 'favorited-icon-active': log.isFavoritedByCurrentUser }"
              :loading="actionLoading.favorite"
            />
          </el-tooltip>
          <!-- Action buttons moved to header for list-item mode -->
          <template v-if="displayMode === 'list-item'">
            <el-divider direction="vertical" v-if="showAction('publish') || showAction('retract') || showAction('view-details') || showAction('edit') || showAction('delete')"></el-divider>
            <el-button v-if="showAction('publish')" type="primary" size="small" @click.stop="internalPublishToggle" :loading="actionLoading.publish">发布</el-button>
            <el-button v-if="showAction('retract')" type="primary" size="small" @click.stop="internalPublishToggle" :loading="actionLoading.publish">撤回</el-button>
            <el-button v-if="showAction('view-details')" type="default" size="small" @click.stop="emit('view-details', log)">详情</el-button>
            <el-button v-if="showAction('edit')" type="warning" size="small" @click.stop="emit('edit', log)">编辑</el-button>
            <el-button v-if="showAction('delete')" type="danger" size="small" @click.stop="internalDelete" :loading="actionLoading.delete">删除</el-button>
          </template>
        </div>
      </div>
    </template>
    <div class="log-meta" :class="{ 'inline-meta': displayMode === 'list-item' }">
      <p><strong>作者:</strong> {{ log.authorName || '未知作者' }}</p>
      <p><strong>日期:</strong> {{ log.publishDate || (log.createdAt ? new Date(log.createdAt).toLocaleString() : '未知日期') }}</p>
    </div>
    <div class="log-preview-text" v-if="displayMode !== 'list-item'" @click.stop="emit('preview-click', log)">
      <p>{{ log.previewText || (log.content ? log.content.substring(0,100) + '...' : '暂无预览') }}</p>
    </div>
    <template #footer v-if="displayMode !== 'list-item'">
      <div class="card-actions">
        <el-button
          v-if="showAction('publish')"
          type="primary"
          size="small"
          @click.stop="internalPublishToggle"
          :loading="actionLoading.publish"
        >
          发布
        </el-button>
        <el-button
          v-if="showAction('retract')"
          type="primary"
          size="small"
          @click.stop="internalPublishToggle"
          :loading="actionLoading.publish"
        >
          撤回
        </el-button>
        <el-button
          v-if="showAction('view-details')"
          type="default"
          size="small"
          @click.stop="emit('view-details', log)"
        >详情</el-button>
        <el-button
          v-if="showAction('edit')"
          type="warning"
          size="small"
          @click.stop="emit('edit', log)"
        >
          编辑
        </el-button>
        <el-button
          v-if="showAction('delete')"
          type="danger"
          size="small"
          @click.stop="internalDelete"
          :loading="actionLoading.delete"
        >删除</el-button>
      </div>
    </template>
  </el-card>
</template>

<script setup>
import { defineProps, defineEmits, ref, reactive } from 'vue';
import { Star, StarFilled } from '@element-plus/icons-vue';
import { updatePosts, deletePosts, favoritePost, unfavoritePost } from '@/apis/posts';
import { ElMessage, ElMessageBox, ElDivider } from 'element-plus';

const props = defineProps({
  log: {
    type: Object,
    required: true,
  },
  actions: {
    type: [String, Array],
    default: () => 'all',
  },
  displayMode: {
    type: String,
    default: 'card', // Possible values: 'card', 'list-item'
    validator: (value) => ['card', 'list-item'].includes(value),
  }
});

const emit = defineEmits([
  'action-completed',
  'view-details',
  'edit',
  'title-click',
  'preview-click',
]);

const isLoading = ref(false);
const actionLoading = reactive({
  favorite: false,
  publish: false,
  delete: false,
});

const internalToggleFavorite = async () => {
  actionLoading.favorite = true;
  try {
    const fn = props.log.isFavoritedByCurrentUser ? unfavoritePost : favoritePost;
    await fn(props.log.id);
    ElMessage.success(props.log.isFavoritedByCurrentUser ? '取消收藏成功' : '收藏成功');
    emit('action-completed', { type: 'favorite', logId: props.log.id, newStatus: !props.log.isFavoritedByCurrentUser });
  } catch (error) {
    ElMessage.error('操作失败');
    console.error('Toggle favorite failed:', error);
  } finally {
    actionLoading.favorite = false;
  }
};

const internalPublishToggle = async () => {
  actionLoading.publish = true;
  try {
    const res = await updatePosts(props.log.id, { published: !props.log.published });
    ElMessage.success(res.message || '操作成功');
    emit('action-completed', { type: 'publish', logId: props.log.id, newStatus: !props.log.published });
  } catch (error) {
    ElMessage.error('操作失败');
    console.error('Publish toggle failed:', error);
  } finally {
    actionLoading.publish = false;
  }
};

const internalDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除日志 "${props.log.title}" 吗?`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    actionLoading.delete = true;
    await deletePosts(props.log.id);
    ElMessage.success('删除成功');
    emit('action-completed', { type: 'delete', logId: props.log.id });
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
      console.error('删除操作失败:', error);
    }
  } finally {
    actionLoading.delete = false;
  }
};

const showAction = (actionName) => {
  if (props.actions === 'all') {
    switch (actionName) {
      case 'publish':
        return !props.log.published;
      case 'retract':
        return !!(props.log.published && props.log.isUserOwner);
      case 'view-details':
        return !!props.log.published;
      case 'edit':
        return !!(!props.log.published && props.log.isUserOwner);
      case 'delete':
        return !!props.log.isUserOwner;
      default:
        return true;
    }
  } else if (Array.isArray(props.actions)) {
    return props.actions.includes(actionName);
  }
  return false;
};
</script>

<style scoped>
.log-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-title {
  font-weight: bold;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 10px;
  cursor: pointer;
}

.log-title:hover {
  color: var(--el-color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.header-actions .el-divider--vertical {
  margin: 0 4px;
  height: 1em;
}

.log-meta {
  /* Default styling for card mode */
}

.log-meta.inline-meta {
  display: flex;
  gap: 15px;
  align-items: center;
  font-size: 13px; /* Match existing meta style */
  color: #606266; /* Match existing meta style */
}

.log-meta.inline-meta p {
  margin: 0; /* Remove default paragraph margins for inline display */
}

.log-meta p {
  font-size: 13px;
  color: #606266;
  margin: 8px 0;
}

.log-preview-text {
  font-size: 14px;
  color: #444;
  line-height: 1.6;
  margin: 10px 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 2.5em; 
  cursor: pointer;
}

.log-preview-text:hover {
  color: #333;
}

.log-card .el-card__footer {
  border-top: 1px solid var(--el-border-color-lighter);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.header-actions .el-button.favorited-icon-active {
  color: var(--el-color-warning);
}
</style> 