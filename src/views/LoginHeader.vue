<template>
  <div class="login-header">
    <div class="left-controls">
      <el-icon :size="20" @click="toggleMenuVisibility" class="menu-toggle-icon">
        <component :is="isMenuVisible ? Fold : Expand" />
      </el-icon>
      <div class="logo"></div>
    </div>
    <div class="user-info">
      <el-avatar :size="40" :src="userInfo?.avatar" @error="() => true" class="user-avatar">
        <img src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" />
      </el-avatar>
      <div class="user-name">你好，{{ userInfo?.name }}</div>

      <!-- 添加主题切换器组件 -->
      <theme-switcher />

      <el-dropdown @command="handleCommand" class="user-actions-dropdown">
        <span>
          <el-icon :size="20" class="el-icon--right">
            <More class="user-icon" />
          </el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">
              <el-icon :size="14">
                <SwitchButton />
              </el-icon>
              登出
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import ThemeSwitcher from '@/components/ThemeSwitcher.vue';
import { More, SwitchButton, Fold, Expand } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useUsersStore } from '@/pinia/users';
import { storeToRefs } from 'pinia';
import { useLayoutStore } from '@/pinia/layout';
import { computed } from 'vue';

const router = useRouter();
const usersStore = useUsersStore();
const { userInfo } = storeToRefs(usersStore);
const { logout } = usersStore;

const layoutStore = useLayoutStore();
const { isMenuVisible } = storeToRefs(layoutStore);
const { toggleMenuVisibility } = layoutStore;

const handleCommand = (command) => {
  switch (command) {
    case 'logout':
      ElMessageBox.confirm('确定要登出吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          logout();
          router.push('/login');
        })
        .catch(() => {
          // 用户取消登出，可以根据需要添加提示，例如：
          // ElMessage.info('已取消登出');
        });
      break;
    default:
      break;
  }
};
</script>

<style scoped>
.login-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-controls {
  display: flex;
  align-items: center;
}

.menu-toggle-icon {
  margin-right: 15px;
  cursor: pointer;
  color: var(--el-color-primary);
}

.logo {
  font-size: 20px;
  font-weight: bold;
  font-family: 'Microsoft YaHei';
  color: var(--el-color-primary-light-5);
}
.user-info {
  display: flex;
  align-items: center;
}
.user-avatar {
  margin-right: 8px;
  border: 1px solid #eee;
}
.user-name {
  color: #333;
  margin-right: 10px;
}
.user-icon {
  cursor: pointer;
  transform: translateY(2px);
  color: #444;
}
.user-actions-dropdown {
  margin-left: 10px;
}
</style>
