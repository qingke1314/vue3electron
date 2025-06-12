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
            <div v-if="false">
              <span> 请求中，请稍后... </span>
            </div>
            <div v-else>
              <!-- 思考过程 (仅R1模型) -->
              <div v-if="message.reasoning_content" class="reasoning-section">
                <div class="reasoning-header" @click="toggleReasoning(index)">
                  <span class="reasoning-loading" v-if="isLoading">
                    <el-icon><Loading /></el-icon>
                  </span>
                  <span>思考过程</span>
                  <el-icon><ArrowRight :class="{ rotated: message.showReasoning }" /></el-icon>
                </div>
                <div v-show="message.showReasoning" class="reasoning-content">
                  <div v-html="formatMessage(message.reasoning_content)"></div>
                </div>
              </div>
              <div v-if="message.content" v-html="formatMessage(message.content)"></div>
              <div v-else>
                <span>加载中...</span>
              </div>
            </div>
          </div>
          <div v-if="message.role === 'assistant' && message.content" class="message-actions">
            <el-button link type="primary" size="small" @click="saveAsNote(message)">
              <el-icon><DocumentAdd /></el-icon>
              保存为笔记
            </el-button>
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
        <el-button size="small" @click="showSaveDialog = true"> 存为笔记 </el-button>
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
  <!-- 单条消息保存对话框 -->
  <el-dialog v-model="showSingleSaveDialog" title="保存单条消息" width="600px" append-to-body>
    <div class="save-note-container">
      <div class="note-title-input">
        <div class="input-label">笔记标题</div>
        <el-input v-model="singleNoteTitle" placeholder="请输入笔记标题" />
      </div>
      <div class="message-preview" v-if="currentMessage">
        <div class="preview-label">内容预览</div>
        <div class="preview-content" v-html="formatDialogToHtml(currentMessage)"></div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showSingleSaveDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSingleMessage">保存</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 批量保存对话框 -->
  <el-dialog v-model="showSaveDialog" title="保存为笔记" width="600px" append-to-body>
    <div class="save-note-container">
      <div class="note-title-input">
        <div class="input-label">笔记标题</div>
        <el-input v-model="noteTitle" placeholder="请输入笔记标题" />
      </div>
      <div class="messages-selection">
        <div class="selection-label">选择要保存的对话内容</div>
        <el-checkbox-group v-model="selectedMessages" class="checkbox-list">
          <div v-for="(message, index) in messages" :key="index" class="message-selection-item">
            <el-checkbox :label="index" border>
              <div class="message-preview-item">
                <div class="message-role">{{ message.role === 'user' ? '我' : 'AI' }}</div>
                <div
                  class="message-content-preview"
                  v-html="formatMessagePreview(message.content)"
                ></div>
              </div>
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showSaveDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSelectedAsNote">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import {
  ChatRound,
  Position,
  ArrowRight,
  DocumentAdd,
  FullScreen,
  Aim,
  Loading,
} from '@element-plus/icons-vue';
import { addPosts } from '@/apis/posts';
import { useUsersStore } from '@/pinia/users';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// 节流函数 - 限制函数执行频率
const throttle = (fn, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
};

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
// 笔记相关状态
const showSaveDialog = ref(false);
const showSingleSaveDialog = ref(false);
const selectedMessages = ref([]);
const noteTitle = ref('');
const singleNoteTitle = ref('');
const currentMessage = ref(null);

// 计算属性
const bubbleStyle = computed(() => ({
  left: `${position.x}px`,
  top: `${position.y}px`,
}));

// 拖拽相关
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let actualDragMoved = false; // 新增变量，标记是否实际发生了拖拽

const startDrag = (event) => {
  if (isOpen.value) return; // 聊天窗口打开时不允许拖动

  isDragging = true;
  actualDragMoved = false; // 重置拖拽标记
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
  actualDragMoved = true; // 标记发生了实际拖拽

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
  // 如果是拖拽结束后的点击，则不切换
  if (actualDragMoved) {
    actualDragMoved = false; // 消耗标记
    return;
  }
  // 原有的 isDragging 判断可以移除，因为它在mouseup后已经是false
  // if (isDragging) return;

  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    unreadCount.value = 0;
    nextTick(() => {
      scrollToBottom();
    });
  }
};

const scrollToBottom = () => {
  if (messagesRef.value) {
    // 使用requestAnimationFrame确保DOM更新完成后再滚动
    requestAnimationFrame(() => {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    });
  }
};

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
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
  try {
    const savedMessages = localStorage.getItem('ai_chat_history');
    if (savedMessages) {
      messages.value = JSON.parse(savedMessages);
    }
  } catch (e) {
    console.error('加载历史消息失败:', e);
    messages.value = [];
  }
};

// 保存历史消息到 localStorage - 使用节流防止频繁保存
const saveHistory = throttle(() => {
  try {
    localStorage.setItem('ai_chat_history', JSON.stringify(messages.value));
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
}, 1000); // 1秒内最多执行一次

// 清空历史记录
const clearHistory = () => {
  ElMessageBox.confirm('确定要清空所有对话历史吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    messages.value = [];
    saveHistory();
    ElMessage.success('历史记录已清空');
  });
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
  // 创建一个新的消息索引，并预先添加助手消息占位符
  const messageIndex = messages.value.length;
  messages.value.push({
    role: 'assistant',
    content: '', // 初始为空，将由API响应或错误信息填充
    loading: true, // 初始设置为加载中
    reasoning_content: currentModel.value === 'r1' ? '' : null,
  });

  let response = null;
  try {
    const modelName = currentModel.value === 'v3' ? 'deepseek-chat' : 'deepseek-reasoner';
    const requestBody = {
      model: modelName,
      messages: [
        {
          role: 'system',
          content: '你是一个有用的AI助手，请提供准确、详细的回答。',
        },
        // 获取 placeholder 之前的所有消息作为历史记录
        ...messages.value
          .slice(0, messageIndex)
          .filter((m) => !m.loading) // 确保不包含其他仍在加载中的消息
          .map((m) => ({
            role: m.role,
            content: m.content,
          })),
      ],
      temperature: 1.2,
      max_tokens: currentModel.value === 'v3' ? 8192 : 64 * 1024,
      stream: true,
    };

    response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.value}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '无法读取错误详情');
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    await processStreamResponse(response, messageIndex);
  } catch (error) {
    console.error('DeepSeek API 请求或处理失败:', error);
    if (messages.value[messageIndex]) {
      messages.value[messageIndex].content =
        `抱歉，AI助手通讯时发生错误。(错误详情: ${error.message || '未知错误'})`;
      messages.value[messageIndex].loading = false; // 设置加载完成（即使是失败）
    }
  }
};

// 处理流式响应
const processStreamResponse = async (response, messageIndex) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedContent = '';
  let accumulatedReasoning = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;

        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0].delta;

            if (delta.content) {
              accumulatedContent += delta.content;
              if (messages.value[messageIndex]) {
                messages.value[messageIndex].content = accumulatedContent;
              }
            }

            if (delta.reasoning_content) {
              accumulatedReasoning += delta.reasoning_content;
              if (messages.value[messageIndex]) {
                messages.value[messageIndex].reasoning_content = accumulatedReasoning;
              }
            }
            scrollToBottom();
            await nextTick();
          } catch (e) {
            console.error('解析流数据失败:', e, line);
          }
        }
      }
    }

    // 处理可能残留在缓冲区中的数据
    if (buffer.startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
      try {
        const data = buffer.slice(6);
        const parsed = JSON.parse(data);
        const delta = parsed.choices[0].delta;

        if (delta.content) {
          accumulatedContent += delta.content;
          if (messages.value[messageIndex]) {
            messages.value[messageIndex].content = accumulatedContent;
          }
        }

        if (delta.reasoning_content) {
          accumulatedReasoning += delta.reasoning_content;
          if (messages.value[messageIndex]) {
            messages.value[messageIndex].reasoning_content = accumulatedReasoning;
          }
        }
      } catch (e) {
        console.error('解析最后的流数据失败:', e, buffer);
      }
    }

    // API 调用成功且流处理完毕
    if (messages.value[messageIndex]) {
      scrollToBottom();
      messages.value[messageIndex].loading = false;
    }
  } catch (error) {
    console.error('处理流响应失败:', error);
    throw error; // 向上传播错误
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

// 格式化对话内容为HTML
const formatDialogToHtml = (message) => {
  const roleClass = message.role === 'user' ? 'user-message' : 'ai-message';
  const roleName = message.role === 'user' ? '我' : 'AI';

  // 使用marked将Markdown转换为HTML，然后使用DOMPurify清理
  const formattedContent = DOMPurify.sanitize(marked(message.content));

  return `
    <div class="${roleClass}" style="margin: 10px 0; padding: 15px; border-radius: 8px; background: ${message.role === 'user' ? '#f0f7ff' : '#f5f5f5'};">
      <div style="font-weight: bold; margin-bottom: 8px; color: #409EFF;">${roleName}：</div>
      <div style="line-height: 1.6;">${formattedContent}</div>
    </div>
  `.trim();
};

// 保存单条消息为笔记
const saveAsNote = async (message) => {
  currentMessage.value = message;
  singleNoteTitle.value = `AI对话记录 - ${new Date().toLocaleString()}`;
  showSingleSaveDialog.value = true;
};

// 确认保存单条消息
const saveSingleMessage = async () => {
  if (!singleNoteTitle.value.trim()) {
    ElMessage.warning('请输入笔记标题');
    return;
  }

  try {
    const note = {
      title: singleNoteTitle.value.trim(),
      content: formatDialogToHtml(currentMessage.value),
      published: false,
    };

    await addPosts(note);
    ElMessage.success('笔记保存成功，请在草稿中查看');
    showSingleSaveDialog.value = false;
    currentMessage.value = null;
    singleNoteTitle.value = '';
  } catch (error) {
    console.error('保存笔记失败:', error);
    ElMessage.error('保存笔记失败');
  }
};

// 格式化消息预览
const formatMessagePreview = (content) => {
  if (!content) return '';

  try {
    // 先将内容转换为HTML
    const htmlContent = DOMPurify.sanitize(marked(content));

    // 提取纯文本用于截断
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    // 截取前15个字符作为预览
    const preview = textContent.length > 15 ? textContent.slice(0, 15) + '...' : textContent;

    // 生成预览HTML
    return DOMPurify.sanitize(marked(preview));
  } catch (error) {
    console.error('格式化预览失败:', error);
    return DOMPurify.sanitize(content.substring(0, 15) + '...');
  }
};

// 保存选中的消息为笔记
const saveSelectedAsNote = async () => {
  if (selectedMessages.value.length === 0) {
    ElMessage.warning('请至少选择一条消息');
    return;
  }

  if (!noteTitle.value.trim()) {
    ElMessage.warning('请输入笔记标题');
    return;
  }

  try {
    const selectedContent = selectedMessages.value
      .sort((a, b) => a - b)
      .map((index) => messages.value[index]);

    // 将所有对话内容包装在一个容器中
    const formattedContent = `
      <div class="chat-container" style="font-family: Arial, sans-serif;">
        ${selectedContent.map((msg) => formatDialogToHtml(msg)).join('\n')}
      </div>
    `.trim();

    const note = {
      title: noteTitle.value.trim(),
      content: formattedContent,
      published: false,
    };

    await addPosts(note);
    ElMessage.success('笔记保存成功，请在草稿中查看');
    showSaveDialog.value = false;
    selectedMessages.value = [];
    noteTitle.value = '';
  } catch (error) {
    console.error('保存笔记失败:', error);
    ElMessage.error('保存笔记失败');
  }
};

// 初始化
onMounted(() => {
  // 从 localStorage 读取位置
  try {
    const savedPosition = localStorage.getItem('ai_chat_position');
    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      position.x = pos.x;
      position.y = pos.y;
    }
  } catch (e) {
    console.error('无法解析保存的位置', e);
  }

  // 确保气泡在视口内
  nextTick(() => {
    adjustBubblePosition();
  });

  // 监听窗口大小变化
  window.addEventListener('resize', throttle(onWindowResize, 200));

  // 初始化时加载历史记录
  loadHistory();
});

// 调整气泡位置确保在可视区域内
const adjustBubblePosition = () => {
  if (bubbleRef.value) {
    const maxX = window.innerWidth - bubbleRef.value.offsetWidth;
    const maxY = window.innerHeight - bubbleRef.value.offsetHeight;

    position.x = Math.max(0, Math.min(position.x, maxX));
    position.y = Math.max(0, Math.min(position.y, maxY));
  }
};

const onWindowResize = () => {
  adjustBubblePosition();
};

// 在组件卸载时移除事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
});
</script>

<style scoped>
.message-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.save-note-container {
  padding: 0 20px;
}

.input-label,
.preview-label,
.selection-label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
  font-size: 14px;
}

.note-title-input {
  margin-bottom: 20px;
}

.message-preview {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  background-color: #f8f9fa;
  margin-bottom: 20px;
}

.preview-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.messages-selection {
  margin-top: 20px;
}

.checkbox-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.message-selection-item {
  margin-bottom: 10px;
}

.message-selection-item :deep(.el-checkbox) {
  width: 100%;
}

.message-selection-item :deep(.el-checkbox__label) {
  white-space: normal;
  padding-left: 8px;
}

.message-preview-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.message-role {
  font-weight: bold;
  color: #409eff;
  font-size: 13px;
}

.message-content-preview {
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
}

.message-content-preview :deep(p) {
  margin: 0;
}

.message-content-preview :deep(pre),
.message-content-preview :deep(code) {
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
}

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}

:deep(.el-dialog__body) {
  padding-top: 20px;
  padding-bottom: 0;
}

/* 滚动条样式 */
.preview-content::-webkit-scrollbar,
.checkbox-list::-webkit-scrollbar {
  width: 6px;
}

.preview-content::-webkit-scrollbar-thumb,
.checkbox-list::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.preview-content::-webkit-scrollbar-track,
.checkbox-list::-webkit-scrollbar-track {
  background-color: #f8f9fa;
}

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

.reasoning-loading {
  animation: spin 1s linear infinite;
  font-size: 12px;
  margin-right: 5px;
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
