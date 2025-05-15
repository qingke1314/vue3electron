<template>
  <div class="login-header">
    <div class="logo"></div>
    <div class="user-info">
      <div class="user-name">你好，{{ userInfo?.name }}</div>
      <el-dropdown @command="handleCommand">
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
import { More, SwitchButton } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useUsersStore } from '@/pinia/users';
import { storeToRefs } from 'pinia';

const router = useRouter();
const usersStore = useUsersStore();
const { userInfo } = storeToRefs(usersStore);
const { logout } = usersStore;

const handleCommand = (command) => {
  switch (command) {
    case 'logout':
      ElMessageBox.confirm('确定要登出吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        logout();
        router.push('/login');
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
.user-name {
  color: #333;
  margin-right: 10px;
}
.user-icon {
  cursor: pointer;
  transform: translateY(2px);
  color: #444;
}
</style>
