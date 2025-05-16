<template>
  <div v-loading="loading" class="logs-list-container">
    <el-radio-group size="middle" class="radio-group" v-model="activeTabName" @change="getData">
      <el-radio-button value="all">全部</el-radio-button>
      <el-radio-button value="draft">草稿</el-radio-button>
      <el-radio-button value="published">已发布</el-radio-button>
    </el-radio-group>
    <el-row :gutter="20">
      <el-col :span="8" v-for="log in filteredLogs" :key="log.id" class="log-card-col">
        <el-card class="log-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="log-title">{{ log.title }}</span>
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
                    @click.stop="handleToggleFavorite(log)"
                    :class="{ 'favorited-icon-active': log.isFavoritedByCurrentUser }"
                  />
                </el-tooltip>
              </div>
            </div>
          </template>
          <div class="log-meta">
            <p><strong>作者:</strong> {{ log.authorName }}</p>
            <p><strong>日期:</strong> {{ log.publishDate }}</p>
          </div>
          <div class="log-preview-text">
            <p>{{ log.previewText || '暂无预览' }}</p>
          </div>
          <template #footer>
            <div class="card-actions">
              <el-button
                v-if="!log.published"
                type="primary"
                size="small"
                @click="handlePublishToggle(log)"
              >
                发布
              </el-button>
              <el-button
                v-if="log.published && log.isUserOwner"
                type="primary"
                size="small"
                @click="handlePublishToggle(log)"
              >
                撤回
              </el-button>
              <el-button
                v-if="log.published"
                type="default"
                size="small"
                @click="handleViewDetails(log)"
                >详情</el-button
              >
              <el-button
                v-if="!log.published && log.isUserOwner"
                type="warning"
                size="small"
                @click="handleEdit(log)"
              >
                编辑
              </el-button>
              <el-button
                v-if="log.isUserOwner"
                type="danger"
                size="small"
                @click="handleDelete(log)"
                >删除</el-button
              >
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>
    <el-empty v-if="filteredLogs.length === 0" description="暂无符合条件的日志"></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getPosts, updatePosts, deletePosts, favoritePost, unfavoritePost } from '@/apis/posts';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Star, StarFilled } from '@element-plus/icons-vue';

const logs = ref([]);
const activeTabName = ref('all');
const loading = ref(false);
const router = useRouter();

const getData = () => {
  loading.value = true;
  const params = {};
  getPosts(params)
    .then((res) => {
      logs.value = res.map((post) => ({
        ...post,
        title: post.title || '无标题',
        authorName: post.author?.name || '未知作者',
        publishDate: post.createdAt ? new Date(post.createdAt).toLocaleString() : '未知日期',
        previewText: post.previewText || post.content?.substring(0, 100) + '...' || '暂无内容预览',
      }));
    })
    .catch((err) => {
      console.error('获取日志列表失败:', err);
      ElMessage.error('获取日志列表失败');
      logs.value = [];
    })
    .finally(() => {
      loading.value = false;
    });
};

onMounted(() => {
  getData();
});

const filteredLogs = computed(() => {
  if (activeTabName.value === 'draft') {
    return logs.value.filter((log) => !log.published);
  }
  if (activeTabName.value === 'published') {
    return logs.value.filter((log) => log.published);
  }
  return logs.value;
});

const handleToggleFavorite = async (log) => {
  const fn = log.isFavoritedByCurrentUser ? unfavoritePost : favoritePost;

  await fn(log.id);
  ElMessage.success(log.isFavoritedByCurrentUser ? '取消收藏成功' : '收藏成功');
  getData();
};

const handlePublishToggle = (log) => {
  loading.value = true;
  updatePosts(log.id, { published: !log.published })
    .then((res) => {
      ElMessage.success(res.message || '操作成功');
      getData();
    })
    .catch(() => {
      ElMessage.error('操作失败');
    })
    .finally(() => {
      loading.value = false;
    });
};

const handleViewDetails = (log) => {
  router.push({ name: 'LogDetail', params: { id: log.id } });
};

const handleEdit = (log) => {
  router.push({ name: 'Editor', params: { id: log.id } });
};

const handleDelete = async (log) => {
  try {
    await ElMessageBox.confirm(`确定要删除日志 "${log.title}" 吗?`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    loading.value = true;
    await deletePosts(log.id);
    ElMessage.success('删除成功');
    getData();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
      console.error('删除操作失败:', error);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.radio-group {
  margin-bottom: 12px;
}
.logs-list-container {
  background-color: var(--el-bg-color-page, #f0f2f5);
  height: calc(100vh - 115px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
}

.log-card-col {
  margin-bottom: 20px;
}

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
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
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
  min-height: 40px;
}

.log-card .el-card__footer {
  padding: 10px 15px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.el-empty {
  margin-top: 50px;
}

.header-actions .el-button.favorited-icon-active {
  color: var(--el-color-warning);
}
</style>
