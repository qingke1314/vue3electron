<template>
  <div v-if="showUpdateDialog" class="update-dialog">
    <el-dialog
      v-model="showUpdateDialog"
      title="发现新版本"
      width="30%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="update-content">
        <p>发现新版本 {{ updateInfo.version }}，是否立即更新？</p>
        <el-progress
          v-if="downloadProgress > 0"
          :percentage="downloadProgress"
          :format="progressFormat"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel" :disabled="isDownloading">稍后再说</el-button>
          <el-button type="primary" @click="handleUpdate" :loading="isDownloading">
            {{ isDownloading ? '更新中...' : '立即更新' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const showUpdateDialog = ref(false);
const updateInfo = ref(null);
const downloadProgress = ref(0);
const isDownloading = ref(false);

// 格式化进度条显示
const progressFormat = (percentage) => {
  return percentage === 100 ? '下载完成' : `${percentage}%`;
};

// 检查更新
const checkForUpdates = () => {
  console.log('Checking for updates from renderer...');
  window.electronAPI.checkForUpdates();
};

// 处理更新
const handleUpdate = () => {
  console.log('Starting update...');
  isDownloading.value = true;
  window.electronAPI.startDownload();
};

// 处理取消
const handleCancel = () => {
  console.log('Update cancelled');
  showUpdateDialog.value = false;
};

// 监听更新事件
onMounted(() => {
  console.log('AppUpdater component mounted');
  
  // 检测到新版本
  window.electronAPI.onUpdateAvailable((info) => {
    console.log('Update available:', info);
    updateInfo.value = info;
    showUpdateDialog.value = true;
  });

  // 更新出错
  window.electronAPI.onUpdateError((error) => {
    console.error('Update error:', error);
    ElMessage.error(`更新出错: ${error}`);
    isDownloading.value = false;
  });

  // 下载进度
  window.electronAPI.onDownloadProgress((progressObj) => {
    console.log('Download progress:', progressObj);
    downloadProgress.value = Math.floor(progressObj.percent);
  });

  // 下载完成
  window.electronAPI.onUpdateDownloaded((info) => {
    console.log('Update downloaded:', info);
    ElMessage.success('更新下载完成，将在下次启动时安装');
    showUpdateDialog.value = false;
  });

  // 检查更新
  checkForUpdates();
});

// 清理事件监听
onUnmounted(() => {
  window.electronAPI.removeAllListeners('update-available');
  window.electronAPI.removeAllListeners('update-error');
  window.electronAPI.removeAllListeners('download-progress');
  window.electronAPI.removeAllListeners('update-downloaded');
});
</script>

<style scoped>
.update-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

.update-content {
  text-align: center;
  padding: 20px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 