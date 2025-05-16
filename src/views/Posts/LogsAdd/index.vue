<template>
  <div v-loading="!hasInit || loading" class="content">
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
      <el-button @click="handlePublish(false)">暂存</el-button>
      <el-button type="primary" @click="handlePublish(true)">发布</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import RichTextEditor from './RichTextEditor.vue'; // 导入你封装的组件
import { addPosts } from '@/apis/posts';

const loading = ref(false);
const form = ref({
  title: '',
});
const editorContent = ref('');
const hasInit = ref(false);

// 可以传入自定义的 init 配置，会和组件内部的默认配置合并
const customInitOptions = {
  // 添加其他 TinyMCE 配置...
};

// 处理编辑器内容变化的事件
const onEditorChange = (content, event) => {
  console.log('编辑器内容变化了:', content);
};

// 处理编辑器初始化完成的事件
const onEditorInit = (editor) => {
  hasInit.value = true;
};

/**
 * 新增日志
 * @param type 发布/草稿
 */
const handlePublish = (type) => {
  if (!form.value.title) {
    ElMessage.error('请输入标题');
    return;
  }
  if (!editorContent.value) {
    ElMessage.error('请输入内容');
    return;
  }
  loading.value = true;
  addPosts({
    title: form.value.title,
    content: editorContent.value,
    published: type,
  })
    .then((res) => {
      ElMessage.success(res.message || '操作成功');
      form.value.title = '';
      editorContent.value = '';
      loading.value = false;
    })
    .catch(() => {
      loading.value = false;
    });
};
</script>

<style scoped>
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
  height: calc(100vh - 190px);
}
</style>
