<template>
  <div class="head">
    <div>
      <div class="page-title">{{ pageTitle }}  </div>
      <el-radio-group size="middle" class="radio-group" v-model="activeTabName" @change="getData">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="draft">草稿</el-radio-button>
        <el-radio-button value="published">已发布</el-radio-button>
      </el-radio-group>
    </div>
    <el-button size="middle" type="primary" @click="goBack">返回</el-button>
  </div>
  <div v-loading="loading" class="logs-list-container">
    <el-row :gutter="20">
      <el-col :span="8" v-for="log_item in filteredLogs" :key="log_item.id" class="log-card-col">
        <LogCard
          :log="log_item"
          :actions="'all'" 
          @action-completed="handleActionCompleted" 
          @view-details="handleViewDetails"
          @edit="handleEdit"
          @title-click="handleViewDetails" 
          @preview-click="handleViewDetails"
        />
      </el-col>
    </el-row>
    <el-empty v-if="filteredLogs.length === 0" description="暂无符合条件的日志"></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineProps, watch } from 'vue';
import { getPosts } from '@/apis/posts';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import LogCard from '@/components/LogCard.vue';

const props = defineProps({
  directoryId: {
    type: String,
    default: null,
  },
});

const logs = ref([]);
const activeTabName = ref('all');
const loading = ref(false);
const router = useRouter();
const route = useRoute();

const pageTitle = computed(() => {
  if (props.directoryId && route.query.directoryName) {
    return `${route.query.directoryName} - 日志列表`;
  } else if (props.directoryId) {
    return `目录日志`;
  }
  return '';
});

const goBack = () => {
  if (props.directoryId) {
    router.push({ name: 'DirectoryOverview' });
  } else {
    router.push({ name: 'Home' });
  }
};

const getData = () => {
  loading.value = true;
  const params = {};
  if (props.directoryId) {
    params.directoryId = props.directoryId;
    console.log(`Fetching logs for directory: ${props.directoryId}`);
  } else {
    console.log('Fetching all logs (no directoryId provided)');
  }

  let tempLogs = [];
  if (params.directoryId === 'dir_001') {
      tempLogs = [
          { id: 'log_d1_1', title: '工作日志A from Dir 001', authorName: '张三', published: true, createdAt: new Date(), content: '内容A', isUserOwner: true },
          { id: 'log_d1_2', title: '工作报告B from Dir 001', authorName: '李四', published: false, createdAt: new Date(), content: '内容B', isUserOwner: false },
      ];
  } else if (params.directoryId) {
    tempLogs = [
        { id: `log_${params.directoryId}_1`, title: `特定目录 ${params.directoryId} 的日志 1`, authorName: '王五', published: true, createdAt: new Date(), content: '特定内容1', isUserOwner: true },
    ];
  } else {
    tempLogs = [
        { id: 'log_all_1', title: '全部日志 - 文章1', authorName: '赵六', published: true, createdAt: new Date(), content: '这是全部日志中的一篇...', isUserOwner: true },
        { id: 'log_all_2', title: '全部日志 - 草稿2', authorName: '孙七', published: false, createdAt: new Date(), content: '这是另一篇草稿...', isUserOwner: true },
    ];
  }

  new Promise(resolve => setTimeout(() => resolve(tempLogs), 300))
    .then((res) => {
      logs.value = res.map((post) => ({
        ...post,
        title: post.title || '无标题',
        authorName: post.author?.name || post.authorName || '未知作者',
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

watch(() => props.directoryId, (newDirId, oldDirId) => {
  if (newDirId !== oldDirId) {
    activeTabName.value = 'all';
    getData();
  }
}, { immediate: true });

const filteredLogs = computed(() => {
  if (activeTabName.value === 'draft') {
    return logs.value.filter((log) => !log.published);
  }
  if (activeTabName.value === 'published') {
    return logs.value.filter((log) => log.published);
  }
  return logs.value;
});

const handleActionCompleted = (eventPayload) => {
  console.log('Action completed in LogsList:', eventPayload);
  getData();
};

const handleViewDetails = (log) => {
  router.push({ name: 'LogDetail', params: { id: log.id } });
};

const handleEdit = (log) => {
  router.push({ name: 'Editor', params: { id: log.id } });
};

</script>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--el-bg-color, #fff);
  padding: 12px;
}
.page-title {
  font-size: 18px; font-weight: bold; line-height: 18px;
  display: inline-block;
  transform: translateY(7px);
  color: var(--el-text-color-primary);
}
.radio-group {
  margin-left: 10px;
}
.logs-list-container {
  background-color: var(--el-bg-color-page, #f0f2f5);
  height: calc(100vh - 115px);
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: 12px;
}

.log-card-col {
  margin-bottom: 20px;
}

.el-empty {
  margin-top: 50px;
}
</style>
