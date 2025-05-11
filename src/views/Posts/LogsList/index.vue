<template>
  <div v-loading="loading" class="logs-list-container">
    <el-radio-group size="middle" class="radio-group" v-model="activeTabName">
      <el-radio-button value="all">全部</el-radio-button>
      <el-radio-button value="draft">草稿</el-radio-button>
      <el-radio-button value="published">已发布</el-radio-button>
    </el-radio-group>
    <el-row :gutter="20">
      <el-col :span="8" v-for="log in filteredLogs" :key="log.id" class="log-card-col">
        <el-card class="log-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>{{ log.title }}</span>
              <el-tag :type="log.published ? 'success' : 'info'" size="small">
                {{ log.published ? '已发布' : '草稿' }}
              </el-tag>
            </div>
          </template>
          <div class="log-meta">
            <p><strong>作者:</strong> {{ log.authorName }}</p>
            <p><strong>日期:</strong> {{ log.publishDate }}</p>
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
                v-if="log.published"
                type="primary"
                size="small"
                @click="handlePublishToggle(log)"
              >
                撤回
              </el-button>
              <el-button type="default" size="small" @click="handleViewDetails(log)"
                >详情</el-button
              >
              <el-button v-if="!log.published" type="warning" size="small" @click="handleEdit(log)">
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="handleDelete(log)">删除</el-button>
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
import { getPosts, updatePosts, deletePosts } from '@/apis/posts';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const logs = ref([]);
const activeTabName = ref('all');
const loading = ref(false);
const router = useRouter();

const getData = () => {
  loading.value = true;
  getPosts()
    .then((res) => {
      logs.value = res.map((post) => ({
        ...post,
        title: post.title,
        authorName: post.author?.name || '未知作者',
        publishDate: new Date(post.createdAt).toLocaleString(),
      }));
      loading.value = false;
    })
    .catch(() => {
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

const handlePublishToggle = (log) => {
  loading.value = true;
  updatePosts(log.id, { published: !log.published })
    .then((res) => {
      ElMessage.success(res.message || '操作成功');
      getData();
      loading.value = false;
    })
    .catch(() => {
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
  const res = await deletePosts(log.id);
  if (res.success) {
    ElMessage.success(res.message || '操作成功');
    getData();
  }
};
</script>

<style scoped>
.radio-group {
  margin-bottom: 12px;
}
.logs-list-container {
  background-color: var(--el-bg-color-page, #f0f2f5);
  min-height: calc(100vh - 110px);
  overflow-y: auto;
  overflow-x: hidden;
}

.log-card-col {
  margin-bottom: 20px;
}

.log-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.log-meta p {
  font-size: 13px;
  color: #606266;
  margin: 5px 0;
}

.log-content-preview {
  font-size: 14px;
  color: #303133;
  margin-top: 10px;
  margin-bottom: 15px;
  line-height: 1.6;
  min-height: 60px;
}

.log-card .el-card__footer {
  padding: 10px 20px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.el-empty {
  margin-top: 50px;
}
</style>
