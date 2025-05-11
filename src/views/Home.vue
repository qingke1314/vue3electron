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
        <el-icon><Plus /></el-icon>新建笔记
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
          <el-menu-item index="all">
            <el-icon><Document /></el-icon>
            <span>全部笔记</span>
          </el-menu-item>
          <el-menu-item index="favorite">
            <el-icon><Star /></el-icon>
            <span>收藏笔记</span>
          </el-menu-item>
          <el-menu-item index="recent">
            <el-icon><Clock /></el-icon>
            <span>最近编辑</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧笔记列表 -->
      <div class="note-list">
        <el-empty v-if="filteredNotes.length === 0" description="暂无笔记" />
        <el-card
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card"
          @click="openNote(note)"
        >
          <template #header>
            <div class="note-header">
              <h3>{{ note.title }}</h3>
              <el-dropdown trigger="click" @command="handleNoteCommand($event, note)">
                <el-button type="text">
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="favorite">
                      {{ note.isFavorite ? '取消收藏' : '收藏' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
          <div class="note-content">
            <p class="note-preview">{{ note.preview }}</p>
            <div class="note-footer">
              <span class="note-time">{{ formatTime(note.updateTime) }}</span>
              <el-tag size="small" :type="note.category === 'work' ? 'success' : 'info'">
                {{ note.category }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Star, Clock, Plus, More } from '@element-plus/icons-vue'
import type { Note } from '../types/note'

// 状态定义
const searchQuery = ref('')
const activeCategory = ref('all')
const notes = ref<Note[]>([
  {
    id: 1,
    title: '示例笔记',
    preview: '这是一个示例笔记的内容预览...',
    updateTime: new Date(),
    category: 'work',
    isFavorite: false
  }
  // 更多笔记数据...
])

// 计算属性：过滤后的笔记列表
const filteredNotes = computed(() => {
  let result = notes.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(note => 
      note.title.toLowerCase().includes(query) || 
      note.preview.toLowerCase().includes(query)
    )
  }

  // 分类过滤
  switch (activeCategory.value) {
    case 'favorite':
      result = result.filter(note => note.isFavorite)
      break
    case 'recent':
      result = [...result].sort((a, b) => 
        b.updateTime.getTime() - a.updateTime.getTime()
      ).slice(0, 10)
      break
  }

  return result
})

// 方法定义
const router = useRouter()

const createNewNote = () => {
  router.push('/editor')
}

const openNote = (note: Note) => {
  router.push(`/editor/${note.id}`)
}

const handleCategorySelect = (index: string) => {
  activeCategory.value = index
}

const handleNoteCommand = async (command: string, note: Note) => {
  switch (command) {
    case 'edit':
      openNote(note)
      break
    case 'favorite':
      note.isFavorite = !note.isFavorite
      ElMessage.success(note.isFavorite ? '已收藏' : '已取消收藏')
      break
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除这个笔记吗？', '提示', {
          type: 'warning'
        })
        // 执行删除操作
        notes.value = notes.value.filter(n => n.id !== note.id)
        ElMessage.success('删除成功')
      } catch {
        // 用户取消删除
      }
      break
  }
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.home-container {
  height: calc(100vh - 150px);
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #f5f7fa;
}

.top-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 4px;
}

.note-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.note-card:hover {
  transform: translateY(-2px);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.note-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-preview {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}
</style>
