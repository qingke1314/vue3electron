<template>
  <div v-loading="!hasInit || loading" class="content">
    <div class="log-detail-header">
      <span class="log-detail-header-text">编辑笔记</span>
      <el-button size="middle" type="primary" @click="goBack">返回</el-button>
    </div>
    <el-form :model="form" label-width="60px">
      <el-form-item required label="标题：">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item required label="内容：">
        <div v-show="hasInit" class="editor-container">
          <RichTextEditor
            v-model="editorContent"
            :init="customInitOptions"
            @change="onEditorChange"
            @onInit="onEditorInit"
          />
        </div>
      </el-form-item>
    </el-form>
    <div class="tool">
      <el-button @click="handleSave(false)">保存草稿</el-button>
      <el-button type="primary" @click="handleSave(true)">发布</el-button>
    </div>
  </div>
</template>

<script setup>
import RichTextEditor from '../LogsAdd/RichTextEditor.vue';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPostById, updatePosts } from '@/apis/posts';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const hasInit = ref(false);
const form = ref({
  title: '',
});
const editorContent = ref('');

// 编辑器配置
const customInitOptions = {};

// 处理编辑器内容变化
const onEditorChange = (content) => {
  console.log('编辑器内容变化:', content);
};

// 处理编辑器初始化完成
const onEditorInit = (editor) => {
  hasInit.value = true;
};

// 加载笔记数据
const loadNote = async (id) => {
  if (!id) return;

  loading.value = true;
  try {
    const res = await getPostById(id);
    form.value.title = res.title;
    editorContent.value = res.content;
  } catch (error) {
    ElMessage.error('加载笔记失败');
  } finally {
    loading.value = false;
  }
};

// 保存笔记
const handleSave = async (isPublished) => {
  if (!form.value.title) {
    ElMessage.error('请输入标题');
    return;
  }
  if (!editorContent.value) {
    ElMessage.error('请输入内容');
    return;
  }

  loading.value = true;
  try {
    const noteData = {
      title: form.value.title,
      content: editorContent.value,
      published: isPublished,
    };

    await updatePosts(route.params.id, noteData);
    ElMessage.success('保存成功');

    // 如果是新建笔记，跳转到列表页
    if (!route.params.id) {
      router.push('/');
    }
  } catch (error) {
    ElMessage.error('保存失败');
  } finally {
    loading.value = false;
  }
};

// 返回
const goBack = () => {
  router.back();
};

// 组件挂载时加载数据
onMounted(() => {
  if (route.params.id) {
    loadNote(route.params.id);
  }
});
</script>

<style scoped>
.log-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.log-detail-header-text {
  font-weight: bold;
}

.content {
  background-color: var(--el-bg-color);
  height: calc(100% - 16px);
  padding: 8px;
}

.tool {
  margin-top: 8px;
  text-align: right;
}

.editor-container {
  width: 100%;
  height: calc(100vh - 230px);
}
</style>
