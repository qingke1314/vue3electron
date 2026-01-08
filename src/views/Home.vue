<template>
  <div class="home-container">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索笔记..."
        prefix-icon="Search"
        clearable
        class="search-input"
      />
      <el-button type="primary" @click="createNewNote">
        <el-icon style="margin-right: 5px"><Plus /></el-icon>新建日志
      </el-button>
      <el-button type="primary" @click="handleViewList">
        <el-icon style="margin-right: 5px"><Notebook /></el-icon>日志列表
      </el-button>
      <!-- 目录列表 -->
      <el-button type="primary" @click="handleViewCategoryList">
        <el-icon style="margin-right: 5px"><Notebook /></el-icon>目录列表
      </el-button>
    </div>

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 左侧分类列表 -->
      <div class="category-list">
        <el-menu
          :default-active="activeCategory"
          class="category-menu"
          @select="handleCategorySelect"
        >
          <el-menu-item index="favorite">
            <el-icon><StarFilled color="var(--el-color-warning)" /></el-icon>
            <span>收藏笔记</span>
          </el-menu-item>
          <el-menu-item index="recent">
            <el-icon><Clock /></el-icon>
            <span>最新日志</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧笔记列表 -->
      <div class="note-list">
        <el-empty v-if="filteredNotes.length === 0" description="暂无笔记" />
        <el-card v-for="note in filteredNotes" :key="note.id" class="note-card">
          <template #header>
            <div class="note-header">
              <h3 @click="openNote(note)" class="note-title-clickable">{{ note.title }}</h3>
              <div class="note-actions">
                <el-button
                  v-if="note.published"
                  :icon="View"
                  size="small"
                  @click="viewNote(note)"
                />
                <el-button
                  v-if="!note.published"
                  :icon="Edit"
                  size="small"
                  @click="openNote(note)"
                />
                <el-button
                  :style="{ color: note.isFavoritedByCurrentUser ? 'var(--el-color-warning)' : '' }"
                  :icon="note.isFavoritedByCurrentUser ? StarFilled : Star"
                  size="small"
                  @click="handleToggleFavorite(note)"
                />
              </div>
            </div>
          </template>
          <div class="note-content">
            <p class="note-preview">{{ note.previewText }}</p>
            <div class="note-footer">
              <span class="note-time">{{ formatTime(note.updateTime) }}</span>
              <el-tag size="small" :type="note.published ? 'success' : 'info'">
                {{ note.published ? '已发布' : '草稿' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPosts, favoritePost, unfavoritePost } from '@/apis/posts.js';
import { Star, Clock, Plus, Edit, Notebook, View, StarFilled } from '@element-plus/icons-vue';

// 状态定义
const searchQuery = ref('');
const activeCategory = ref('favorite');
const notes = ref([]);

onMounted(() => {
  getData();
});

const pad2 = (n) => String(n).padStart(2, '0');

const formatYMDHMS = (d) => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
};

const getData = async () => {
  const params = {};
  switch (activeCategory.value) {
    case 'favorite':
      params.isFavorited = true;
      break;
    case 'recent':
      params.lastEditedAfter = formatYMDHMS(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
      break;
  }
  try {
    const res = await getPosts(params);
    notes.value = res.data.map((n) => ({
      ...n,
      previewText: n.previewText || n.content?.substring(0, 100) + '...',
      updateTime: n.updateTime || n.updatedAt || Date.now(),
      published: n.published || false,
    }));
  } catch (error) {
    console.error('获取笔记失败:', error);
    notes.value = [];
    ElMessage.error('获取笔记列表失败');
  }
};

// 计算属性：过滤后的笔记列表
const filteredNotes = computed(() => {
  let result = notes.value;

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (note) =>
        (note.title || '').toLowerCase().includes(query) ||
        (note.previewText || '').toLowerCase().includes(query)
    );
  }
  return result;
});

// 方法定义
const router = useRouter();

const createNewNote = () => {
  router.push('/logs/add');
};

const openNote = (note) => {
  router.push({ name: 'Editor', params: { id: note.id } });
};

const viewNote = (note) => {
  router.push({ name: 'LogDetail', params: { id: note.id } });
};

const handleCategorySelect = (index) => {
  activeCategory.value = index;
  getData();
};

const handleViewList = () => {
  router.push({ name: 'LogsListAll' });
};

const handleViewCategoryList = () => {
  router.push({ name: 'DirectoryConfig' });
};

const handleToggleFavorite = async (log) => {
  const fn = log.isFavoritedByCurrentUser ? unfavoritePost : favoritePost;
  await fn(log.id);
  ElMessage.success(log.isFavoritedByCurrentUser ? '取消收藏成功' : '收藏成功');
  getData();
};

const formatTime = (dateString) => {
  if (!dateString) return '未知时间';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
</script>

<style scoped>
.home-container {
  height: calc(100vh - 130px);
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #f5f7fa;
}

.top-bar {
  display: flex;
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
  margin-right: 10px;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow: hidden;
}

.category-list {
  width: 200px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.category-menu {
  border-right: none;
}

.note-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.note-card {
  transition: box-shadow 0.2s;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  background-color: white;
}

.note-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.note-card .el-card__header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.note-card .el-card__body {
  padding: 12px 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-title-clickable {
  margin: 0;
  font-size: 17px;
  color: #303133;
  font-weight: 500;
  cursor: pointer;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.note-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-grow: 1;
}

.note-preview {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-top: auto;
  padding-top: 8px;
}
</style>
