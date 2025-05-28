<template>
  <div
    v-if="userStore.isLoggedIn"
    ref="bubbleRef"
    class="ai-chat-bubble"
    :class="{ active: isOpen }"
    :style="bubbleStyle"
    @mousedown="startDrag"
    @click="toggleChat"
  >
    <el-icon class="bubble-icon"><ChatRound /></el-icon>
    <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
  </div>

  <el-dialog
    v-model="isOpen"
    title="AI 助手"
    :width="isFullscreen ? '100%' : '800px'"
    :fullscreen="isFullscreen"
    :modal="false"
    :append-to-body="true"
    :close-on-click-modal="false"
    :show-close="true"
    custom-class="ai-chat-dialog"
    @close="isOpen = false"
  >
    <template #header>
      <div class="dialog-header">
        <span>AI 助手</span>
        <div class="dialog-actions">
          <el-button circle @click="toggleFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Aim v-else /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <div class="chat-container" :class="{ fullscreen: isFullscreen }">
      <div class="chat-messages" ref="messagesRef">
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
          <div class="message-content">
            <div
              v-if="
                message.role === 'assistant' &&
                message.loading &&
                (!message.content || !message.reasoning_content)
              "
            >
              <span> 请求中，请稍后... </span>
            </div>
            <div v-else>
              <!-- 思考过程 (仅R1模型) -->
              <div v-if="message.reasoning_content" class="reasoning-section">
                <div class="reasoning-header" @click="toggleReasoning(index)">
                  <el-icon><ArrowRight :class="{ rotated: message.showReasoning }" /></el-icon>
                  <span>思考过程</span>
                </div>
                <div v-show="message.showReasoning" class="reasoning-content">
                  <div v-html="formatMessage(message.reasoning_content)"></div>
                </div>
              </div>
              <div v-html="formatMessage(message.content)"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <el-input
          v-model="userInput"
          type="textarea"
          :rows="2"
          placeholder="输入您的问题..."
          resize="none"
          @keyup.enter.exact.prevent="sendMessage"
        />
        <el-button
          type="primary"
          class="send-button"
          :disabled="!userInput.trim() || isLoading"
          @click="sendMessage"
        >
          <el-icon><Position /></el-icon>
        </el-button>
      </div>
    </div>

    <template #footer>
      <div class="api-config">
        <el-button
          size="small"
          :type="currentModel === 'r1' ? 'primary' : 'default'"
          @click="toggleModel"
        >
          深度思考
        </el-button>

        <el-button disabled size="small">
          <el-tooltip content="官方API尚未提供该功能" placement="top"> 联网搜索 </el-tooltip>
        </el-button>
        <el-button size="small" @click="clearHistory">清空历史</el-button>
        <el-button v-if="!apiKey" size="small" @click="showApiConfig = true">API 设置</el-button>
        <span v-if="apiKey" class="api-status success">API 已配置</span>
        <span v-else class="api-status error">未配置 API</span>
      </div>
    </template>
  </el-dialog>

  <!-- API 配置对话框 -->
  <el-dialog v-model="showApiConfig" title="DeepSeek API 配置" width="400px" append-to-body>
    <el-form>
      <el-form-item label="API Key">
        <el-input type="password" v-model="apiKeyInput" placeholder="请输入 DeepSeek API Key" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveApiKey">保存</el-button>
        <el-button @click="showApiConfig = false">取消</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { ChatRound, Position, ArrowRight, FullScreen, Aim, Loading } from '@element-plus/icons-vue';
import { useUsersStore } from '@/pinia/users';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

console.log(import.meta.env, 'import.meta.env');
const apiKeyInEnv = import.meta.env.VITE_DEEP_SEEK_API_KEY;

// 状态变量
const isOpen = ref(false);
const messages = ref([]);
const userInput = ref('');
const isLoading = ref(false);
const unreadCount = ref(0);
const position = reactive({ x: window.innerWidth - 60, y: window.innerHeight - 180 });
const bubbleRef = ref(null);
const messagesRef = ref(null);
const showApiConfig = ref(false);
const apiKey = ref(apiKeyInEnv || localStorage.getItem('deepseek_api_key') || '');
const apiKeyInput = ref(apiKey.value);
const userStore = useUsersStore();
const currentModel = ref('v3');
const isFullscreen = ref(false);

// 计算属性
const bubbleStyle = computed(() => ({
  left: `${position.x}px`,
  top: `${position.y}px`,
}));

// 拖拽相关
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

const startDrag = (event) => {
  if (isOpen.value) return; // 聊天窗口打开时不允许拖动

  isDragging = true;
  const bubbleRect = bubbleRef.value.getBoundingClientRect();
  dragOffset.x = event.clientX - bubbleRect.left;
  dragOffset.y = event.clientY - bubbleRect.top;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);

  // 防止触发点击事件
  event.preventDefault();
};

const onDrag = (event) => {
  if (!isDragging) return;

  const newX = event.clientX - dragOffset.x;
  const newY = event.clientY - dragOffset.y;

  // 确保不超出屏幕边界
  const maxX = window.innerWidth - bubbleRef.value.offsetWidth;
  const maxY = window.innerHeight - bubbleRef.value.offsetHeight;

  position.x = Math.max(0, Math.min(newX, maxX));
  position.y = Math.max(0, Math.min(newY, maxY));
};

const stopDrag = () => {
  isDragging = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);

  // 保存位置到 localStorage
  localStorage.setItem('ai_chat_position', JSON.stringify(position));
};

// 聊天相关
const toggleChat = (event) => {
  // 如果正在拖拽，不触发切换
  if (isDragging) return;

  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    unreadCount.value = 0;
    nextTick(() => {
      // scrollToBottom();
    });
  }
};

const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
};

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  nextTick(() => {
    // scrollToBottom();
  });
};

// 切换思考过程显示
const toggleReasoning = (index) => {
  if (messages.value[index] && messages.value[index].reasoning_content) {
    messages.value[index].showReasoning = !messages.value[index].showReasoning;
  }
};

// 格式化消息内容，支持Markdown
const formatMessage = (content) => {
  if (!content) return '';

  try {
    // 使用marked解析Markdown
    let htmlContent = marked(content);

    // 使用DOMPurify净化HTML
    htmlContent = DOMPurify.sanitize(htmlContent);

    return htmlContent;
  } catch (e) {
    console.error('格式化消息失败:', e);
    return DOMPurify.sanitize(content);
  }
};

const sendMessage = async () => {
  const text = userInput.value.trim();
  if (!text || isLoading.value) return;

  // 添加用户消息
  messages.value.push({ role: 'user', content: text });

  // 清空输入框
  userInput.value = '';

  // 滚动到底部
  await nextTick();
  scrollToBottom();

  // 设置加载状态
  isLoading.value = true;

  try {
    if (!apiKey.value) {
      // 如果没有 API key，显示提示消息
      setTimeout(() => {
        messages.value.push({
          role: 'assistant',
          content:
            '请先配置 DeepSeek API Key 才能使用 AI 助手功能。点击底部的"API 设置"按钮进行配置。',
        });
        isLoading.value = false;
        // scrollToBottom();
      }, 1000);
      return;
    }

    // 调用 DeepSeek API，不需要再添加消息，API 调用中已经添加了
    await callDeepSeekAPI(text);
  } catch (error) {
    console.error('API 请求失败:', error);
    messages.value.push({
      role: 'assistant',
      content:
        '抱歉，请求失败。请检查 API 设置或网络连接。' +
        (error.message ? `错误: ${error.message}` : ''),
    });
  } finally {
    isLoading.value = false;
    await nextTick();
    // scrollToBottom();

    // 如果聊天窗口关闭，增加未读消息计数
    if (!isOpen.value) {
      unreadCount.value++;
    }
  }
};

// 从 localStorage 加载历史消息
const loadHistory = () => {
  const savedMessages = localStorage.getItem('ai_chat_history');
  if (savedMessages) {
    try {
      messages.value = JSON.parse(savedMessages);
    } catch (e) {
      console.error('加载历史消息失败:', e);
      messages.value = [];
    }
  }
};

// 保存历史消息到 localStorage
const saveHistory = () => {
  localStorage.setItem('ai_chat_history', JSON.stringify(messages.value));
};

// 清空历史记录
const clearHistory = () => {
  ElMessageBox.confirm('确定要清空所有对话历史吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      messages.value = [];
      saveHistory();
      ElMessage.success('历史记录已清空');
    })
    .catch(() => {});
};

// 监听消息变化，自动保存
watch(
  messages,
  () => {
    saveHistory();
  },
  { deep: true }
);

// DeepSeek API 集成
const callDeepSeekAPI = async (prompt) => {
  try {
    const modelName = currentModel.value === 'v3' ? 'deepseek-chat' : 'deepseek-reasoner';
    const requestBody = {
      model: modelName,
      messages: [
        {
          role: 'system',
          content: '你是一个有用的AI助手，请提供准确、简洁的回答。',
        },
        ...messages.value
          .filter((m) => !m.loading)
          .map((m) => ({
            role: m.role,
            content: m.content,
          })),
      ],
      temperature: 1.3,
      max_tokens: 5000,
      stream: true,
    };

    // 创建一个新的消息索引
    const messageIndex = messages.value.length;
    messages.value.push({
      role: 'assistant',
      content: '',
      loading: true, // 不显示加载动画，因为我们会实时更新内容
      reasoning_content: currentModel.value === 'r1' ? '' : null,
    });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.value}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';
    let accumulatedReasoning = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 解码并添加到缓冲区
      buffer += decoder.decode(value, { stream: true });

      // 处理缓冲区中的完整行
      const lines = buffer.split('\n');
      // 保留最后一个可能不完整的行
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;

        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0].delta;

            if (delta.content) {
              accumulatedContent += delta.content;
              messages.value[messageIndex].content = accumulatedContent;
            }

            if (delta.reasoning_content) {
              accumulatedReasoning += delta.reasoning_content;
              messages.value[messageIndex].reasoning_content = accumulatedReasoning;
            }

            // 强制更新视图
            await nextTick();
            // scrollToBottom();
          } catch (e) {
            console.error('解析流数据失败:', e, line);
          }
        }
      }
    }

    // 处理最后的缓冲区内容
    if (buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
      try {
        const data = buffer.slice(6);
        const parsed = JSON.parse(data);
        const delta = parsed.choices[0].delta;

        if (delta.content) {
          accumulatedContent += delta.content;
          messages.value[messageIndex].content = accumulatedContent;
        }

        if (delta.reasoning_content) {
          accumulatedReasoning += delta.reasoning_content;
          messages.value[messageIndex].reasoning_content = accumulatedReasoning;
        }
      } catch (e) {
        console.error('解析最后的流数据失败:', e);
      }
    }

    // 完成后更新消息状态
    if (currentModel.value === 'r1' && accumulatedReasoning) {
      messages.value[messageIndex].showReasoning = false;
    }
  } catch (error) {
    console.error('DeepSeek API 请求失败:', error);
    throw error;
  }
};

// API 设置
const saveApiKey = () => {
  const key = apiKeyInput.value.trim();
  apiKey.value = key;
  localStorage.setItem('deepseek_api_key', key);
  showApiConfig.value = false;

  if (key) {
    ElMessage.success('API Key 已保存');
  } else {
    ElMessage.warning('API Key 已清除');
  }
};

// 切换模型
const toggleModel = () => {
  currentModel.value = currentModel.value === 'v3' ? 'r1' : 'v3';
};

// 初始化
onMounted(() => {
  // 从 localStorage 读取位置
  const savedPosition = localStorage.getItem('ai_chat_position');
  if (savedPosition) {
    try {
      const pos = JSON.parse(savedPosition);
      position.x = pos.x;
      position.y = pos.y;
    } catch (e) {
      console.error('无法解析保存的位置', e);
    }
  }

  // 确保气泡在视口内
  nextTick(() => {
    if (bubbleRef.value) {
      const maxX = window.innerWidth - bubbleRef.value.offsetWidth;
      const maxY = window.innerHeight - bubbleRef.value.offsetHeight;

      position.x = Math.max(0, Math.min(position.x, maxX));
      position.y = Math.max(0, Math.min(position.y, maxY));
    }
  });

  // 监听窗口大小变化
  window.addEventListener('resize', onWindowResize);

  // 初始化时加载历史记录
  loadHistory();
});

const onWindowResize = () => {
  if (bubbleRef.value) {
    const maxX = window.innerWidth - bubbleRef.value.offsetWidth;
    const maxY = window.innerHeight - bubbleRef.value.offsetHeight;

    position.x = Math.max(0, Math.min(position.x, maxX));
    position.y = Math.max(0, Math.min(position.y, maxY));
  }
};

// 监听消息列表变化，自动滚动到底部
watch(
  messages,
  () => {
    nextTick(() => {
      scrollToBottom();
    });
  },
  { deep: true }
);
</script>

<style scoped>
.ai-chat-bubble {
  position: fixed;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition:
    transform 0.3s,
    background-color 0.3s;
}

.ai-chat-bubble:hover {
  transform: scale(1.05);
}

.ai-chat-bubble.active {
  background-color: var(--el-color-primary-light-1);
}

.bubble-icon {
  font-size: 24px;
}

.unread-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: var(--el-color-danger);
  color: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 0 10px;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 10px;
}

.message {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.message.user {
  align-items: flex-end;
}

.message.assistant {
  align-items: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 10px;
  border-radius: 8px;
  word-break: break-word;
}

.user .message-content {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
}

.assistant .message-content {
  background-color: white;
  border: 1px solid #eee;
}

.chat-input {
  position: relative;
}

.send-button {
  position: absolute;
  top: 60px;
  right: 0px;
}

.typing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 0;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.code-block {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 10px;
  overflow-x: auto;
  margin: 8px 0;
  font-family: monospace;
  white-space: pre-wrap;
}

.api-config {
  display: flex;
  align-items: center;
  gap: 8px;
}

.api-config .el-button {
  margin-right: 0;
}

.api-status {
  font-size: 12px;
  margin-left: 8px;
}

.api-status.success {
  color: var(--el-color-success);
}

.api-status.error {
  color: var(--el-color-danger);
}

/* 自定义对话框样式 */
:deep(.ai-chat-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.ai-chat-dialog .el-dialog__header) {
  background-color: var(--el-color-primary-light-8);
  margin: 0;
  padding: 12px 20px;
}

:deep(.ai-chat-dialog .el-dialog__body) {
  padding: 15px;
}

:deep(.ai-chat-dialog .el-dialog__footer) {
  padding: 10px 20px;
  border-top: 1px solid #eee;
}

.chat-container.fullscreen {
  height: calc(100vh - 120px);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-actions {
  display: flex;
  gap: 8px;
}

.reasoning-section {
  margin-bottom: 10px;
  border-bottom: 1px dashed #ddd;
  padding-top: 5px;
}

.reasoning-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--el-color-primary);
  font-size: 0.9em;
  padding-bottom: 12px;
}

.reasoning-header .el-icon {
  margin-right: 5px;
  transition: transform 0.3s;
}

.reasoning-header .rotated {
  transform: rotate(90deg);
}

.reasoning-content {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 10px;
  margin-top: 5px;
  font-size: 0.9em;
}

/* Markdown 样式 */
.message-content :deep(p) {
  margin: 0.5em 0;
}

.message-content :deep(strong) {
  font-weight: bold;
}

.message-content :deep(em) {
  font-style: italic;
}

.message-content :deep(code) {
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  padding-left: 20px;
  margin: 0.5em 0;
}

.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3),
.message-content :deep(h4) {
  margin: 0.5em 0;
  font-weight: bold;
}

.message-content :deep(h1) {
  font-size: 1.5em;
}
.message-content :deep(h2) {
  font-size: 1.3em;
}
.message-content :deep(h3) {
  font-size: 1.2em;
}
.message-content :deep(h4) {
  font-size: 1.1em;
}
</style>
