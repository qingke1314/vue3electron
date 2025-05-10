<template>
  <div v-loading="loading" class="log-detail-container">
    <el-card>
      <div class="log-detail-header">
        <span class="log-detail-header-text">日志详情</span>
        <el-button size="middle" type="primary" @click="goBack">返回</el-button>
      </div>
      <el-divider />
      <div v-if="post" class="log-content-card">
        <div class="card-header">
          <h1>{{ post.title }}</h1>
          <div class="meta-info">
            <span>作者: {{ post.author?.name || '未知' }}</span>
            <span>发布日期: {{ formatDate(post.createdAt) }}</span>
            <el-tag :type="post.published ? 'success' : 'info'" size="small">
              {{ post.published ? '已发布' : '草稿' }}
            </el-tag>
          </div>
        </div>
        <!-- 渲染HTML内容时务必注意XSS防护 -->
        <!-- 假设 post.content 是HTML字符串 -->
        <div v-if="post.contentHtml" v-html="sanitizedLogContent" class="log-body"></div>
        <!-- 如果内容是纯文本，可以直接使用 {{ post.content }} -->
        <div v-else class="log-body">
          <pre>{{ post.content }}</pre>
          <!-- 使用 pre 标签保留换行和空格 -->
        </div>
      </div>
      <el-empty v-else-if="!loading && !post" description="日志未找到或加载失败"></el-empty>

      <!-- 评论区 -->
      <el-divider v-if="post" />
      <div v-if="post" class="comments-section">
        <h3>评论区 ({{ comments.length }})</h3>
        <div v-loading="commentsLoading">
          <div v-if="comments.length > 0" class="comments-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <div class="comment-author">
                <strong>{{ comment.author?.name || '匿名用户' }}</strong>
                <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <!-- 假设 comment.content 是HTML字符串，也需要清理 -->
              <div
                v-if="comment.contentHtml"
                v-html="sanitizeHtml(comment.contentHtml)"
                class="comment-content"
              ></div>
              <div v-else class="comment-content">
                <pre>{{ comment.content }}</pre>
              </div>
              <!-- 可以在这里添加回复按钮和回复列表的逻辑 -->
            </div>
          </div>
          <el-empty v-else description="暂无评论，快来抢沙发吧！"></el-empty>
        </div>

        <!-- 发表评论 -->
        <div class="add-comment-form">
          <div style="font-weight: bold; margin-bottom: 8px">发表评论</div>
          <el-input
            v-model="newCommentText"
            type="textarea"
            :rows="5"
            placeholder="请输入友善的评论..."
            maxlength="500"
            show-word-limit
          />
          <el-button
            type="primary"
            @click="submitComment"
            :loading="submittingComment"
            :disabled="!newCommentText"
            style="margin-top: 10px"
          >
            发布
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPostById, getCommentsByPostId, addCommentToPost } from '@/apis/posts';
import DOMPurify from 'dompurify'; // 重要：确保你已安装并导入 DOMPurify
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const post = ref(null);

const postId = route.params.id;

const comments = ref([]);
const commentsLoading = ref(false);
const newCommentText = ref('');
const submittingComment = ref(false);

const formatDate = (dateString) => {
  if (!dateString) return '未知日期';
  return new Date(dateString).toLocaleString();
};

onMounted(async () => {
  if (postId) {
    try {
      loading.value = true;
      const response = await getPostById(postId);
      // 假设API直接返回帖子对象，如果不是，请根据实际结构调整
      // 例如，如果返回 { data: postData }，则用 response.data
      post.value = response;
      // 假设如果后端返回的是markdown, 你需要在这里转换为html
      // 例如: post.value.contentHtml = marked(response.content);
      // 这里我们先简单假设后端可能直接返回 content 字段作为纯文本或 contentHtml 作为html
      // 如果 post.content 就是 HTML, 确保在赋值给 post.value.contentHtml 之前或在 computed 中处理
      if (
        post.value &&
        typeof post.value.content === 'string' &&
        isPotentiallyHtml(post.value.content)
      ) {
        // 这是一个简单的判断，实际应用中你可能根据字段名（如 'contentHtml'）来决定是否为HTML
        post.value.contentHtml = post.value.content; // 假设 content 字段本身就是 HTML
      }
      // 获取评论
      if (post.value) {
        await fetchComments();
      }
    } catch (error) {
      console.error('Failed to load post:', error);
      ElMessage.error('加载日志详情失败，请稍后再试。');
      post.value = null; // 确保出错时post为null，以显示Empty状态
    } finally {
      loading.value = false;
    }
  } else {
    ElMessage.error('无效的日志ID');
    loading.value = false;
  }
});

// 判断字符串是否可能包含HTML标签的简单方法
function isPotentiallyHtml(str) {
  const regex = /<[a-z][\s\S]*>/i;
  return regex.test(str);
}

const sanitizedLogContent = computed(() => {
  if (post.value && post.value.contentHtml) {
    // 使用 DOMPurify 清理 HTML
    // DOMPurify.sanitize(dirtyHtml, config)
    // 你可以根据需要配置 DOMPurify，例如允许特定的标签和属性
    return DOMPurify.sanitize(post.value.contentHtml, { USE_PROFILES: { html: true } });
  }
  return '';
});

const fetchComments = async () => {
  if (!post.value?.id) return;
  commentsLoading.value = true;
  try {
    const commentsResponse = await getCommentsByPostId(post.value.id);
    // 假设 commentsResponse 直接是评论数组，或者需要 .data 取出
    comments.value = commentsResponse.map((comment) => {
      if (comment && typeof comment.content === 'string' && isPotentiallyHtml(comment.content)) {
        return { ...comment, contentHtml: comment.content };
      }
      return comment;
    });
  } catch (error) {
    console.error('Failed to load comments:', error);
    ElMessage.error('加载评论失败。');
  } finally {
    commentsLoading.value = false;
  }
};

// 通用HTML清理函数，用于评论内容
const sanitizeHtml = (htmlString) => {
  return DOMPurify.sanitize(htmlString, { USE_PROFILES: { html: true } });
};

const submitComment = async () => {
  if (!newCommentText.value.trim()) {
    ElMessage.warning('评论内容不能为空！');
    return;
  }
  if (!post.value?.id) {
    ElMessage.error('无法关联日志ID，请刷新页面重试。');
    return;
  }

  submittingComment.value = true;
  try {
    const commentData = {
      content: newCommentText.value,
      // 如果需要，可以在这里添加其他评论信息，例如用户信息（如果后端不自动处理）
      // authorId: currentUser.id 等
    };
    const newComment = await addCommentToPost(post.value.id, commentData);
    // 假设成功后，后端返回新创建的评论对象
    // 更新本地评论列表，或重新获取评论
    if (newComment) {
      // 预处理新评论的 contentHtml 字段
      let processedNewComment = { ...newComment };
      if (
        newComment.content &&
        typeof newComment.content === 'string' &&
        isPotentiallyHtml(newComment.content)
      ) {
        processedNewComment.contentHtml = newComment.content;
      }
      comments.value.unshift(processedNewComment); // 将新评论添加到列表顶部
    } else {
      // 如果后端不返回新评论，则重新获取所有评论
      await fetchComments();
    }
    newCommentText.value = ''; // 清空输入框
    ElMessage.success('评论发表成功！');
  } catch (error) {
    console.error('Failed to submit comment:', error);
    ElMessage.error('发表评论失败，请稍后再试。');
  } finally {
    submittingComment.value = false;
  }
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.log-detail-container {
  padding: 12px;
  background-color: var(--el-bg-color-page, #f0f2f5);
  height: calc(100vh - 130px); /* 减去可能的头部和页头高度 */
  overflow: auto;
}
.log-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.log-detail-header-text {
  font-weight: bold;
}
.page-header {
  margin-bottom: 20px;
  background-color: var(--el-bg-color);
  padding: 10px 20px;
  border-radius: 4px;
}

.log-content-card {
  padding-left: 8px;
  width: 100%;
  margin: 0 auto;
}

.log-content-card .card-header h1 {
  font-size: 24px;
}

.log-content-card .meta-info {
  font-size: 14px;
  color: #606266;
  display: flex;
  gap: 15px; /* 项目间距 */
  align-items: center;
}

.log-body {
  font-size: 16px;
  line-height: 1.8;
  padding-top: 10px;
  word-wrap: break-word; /* 确保长单词或链接能换行 */
  overflow-wrap: break-word;
}

/* 如果使用 <pre> 包裹纯文本内容，确保样式合适 */
.log-body pre {
  white-space: pre-wrap; /* CSS3 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
  font-family: inherit; /* 继承父元素的字体 */
}

/* 对 v-html 渲染的内容进行一些基本样式控制 */
.log-body ::v-deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.log-body ::v-deep(p) {
  margin-bottom: 1em;
}

.log-body ::v-deep(h1),
.log-body ::v-deep(h2),
.log-body ::v-deep(h3),
.log-body ::v-deep(h4),
.log-body ::v-deep(h5),
.log-body ::v-deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  font-weight: 600;
}

.log-body ::v-deep(ul),
.log-body ::v-deep(ol) {
  padding-left: 2em;
  margin-bottom: 1em;
}

.log-body ::v-deep(blockquote) {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid var(--el-color-primary-light-7);
  background-color: var(--el-color-primary-light-9);
  color: #303133;
}

.log-body ::v-deep(code) {
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}

.log-body ::v-deep(pre) > code {
  display: block;
  padding: 1em;
  overflow-x: auto;
}

/* 评论区样式 */
.comments-section {
  margin-top: 30px;
}
.comments-section h3 {
  font-size: 20px;
  margin-bottom: 15px;
  color: #303133;
}
.comments-section h4 {
  font-size: 18px;
  margin-top: 20px;
  margin-bottom: 10px;
  color: #303133;
}

.comments-list .comment-item {
  padding: 15px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.comments-list .comment-item:last-child {
  border-bottom: none;
}
.comment-author {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}
.comment-author strong {
  color: var(--el-text-color-primary);
}
.comment-date {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.comment-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.comment-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
}

.add-comment-form {
  margin-top: 20px;
  background-color: var(--el-fill-color-lighter);
  padding: 12px;
  border-radius: 4px;
}
</style>
