<template>
  <div class="configs-view">
    <el-card header="个人信息" shadow="never" class="info-card">
      <el-descriptions label-width="120px" :column="1" border>
        <el-descriptions-item label-align="center" align="left">
          <template #label
            ><el-icon><User /></el-icon> 头像</template
          >
          <div class="avatar-container">
            <el-avatar
              :size="60"
              :src="usersStore.userInfo?.avatar || defaultAvatar"
              @error="() => true"
            >
              <img src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" />
            </el-avatar>
            <el-upload
              name="avatarFile"
              :action="`${baseURL}/users/upload-avatar`"
              :show-file-list="false"
              :headers="{
                Authorization: `Bearer ${token}`,
              }"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              class="avatar-uploader"
              accept="image/png, image/jpeg, image/gif"
            >
              <el-button type="primary" link icon="Edit" class="edit-avatar-btn"
                >修改头像</el-button
              >
            </el-upload>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label-align="center" align="left">
          <template #label
            ><el-icon><User /></el-icon> 昵称</template
          >
          {{ usersStore.userInfo?.name || '未设置' }}
          <el-button icon="Edit" type="primary" link @click="handleEdit('name')" class="edit-btn"
            >编辑</el-button
          >
        </el-descriptions-item>

        <el-descriptions-item label-align="center" align="left">
          <template #label
            ><el-icon><Message /></el-icon> 邮箱</template
          >
          {{ usersStore.userInfo?.email || '未设置' }}
          <el-button
            icon="Edit"
            disabled
            type="primary"
            link
            @click="handleEdit('email')"
            class="edit-btn"
            >不可编辑</el-button
          >
        </el-descriptions-item>

        <el-descriptions-item label-align="center" align="left">
          <template #label
            ><el-icon><Phone /></el-icon> 手机号</template
          >
          {{ usersStore.userInfo?.phoneNumber || '未设置' }}
          <el-button
            icon="Edit"
            type="primary"
            link
            @click="handleEdit('phoneNumber')"
            class="edit-btn"
            >编辑</el-button
          >
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card header="安全设置" shadow="never" class="security-card">
      <div class="setting-item">
        <span>登录密码</span>
        <el-button type="primary" link @click="openPasswordDialog">修改密码</el-button>
      </div>
    </el-card>

    <!-- 编辑个人信息弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`修改${dialogTitle}`"
      width="400px"
      @close="handleCancel"
      draggable
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editFormRules" label-width="80px">
        <el-form-item :label="dialogTitle" prop="value">
          <el-input v-model="editForm.value" :placeholder="`请输入新的${dialogTitle}`" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSaveInfo" :loading="savingInfo">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="640px"
      @close="handlePasswordCancel"
      draggable
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordFormRules"
        label-width="100px"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            type="password"
            v-model="passwordForm.oldPassword"
            placeholder="请输入当前使用的密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            type="password"
            v-model="passwordForm.newPassword"
            placeholder="请输入新密码（6-20位，可包含字母、数字、下划线、@、#、$、%、^、&、*、()、.）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            type="password"
            v-model="passwordForm.confirmPassword"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handlePasswordCancel">取消</el-button>
          <el-button type="primary" @click="handlePasswordSave" :loading="savingPassword"
            >确认修改</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUsersStore } from '@/pinia/users';
import { updateCurrentUserProfile, updateUserPassword } from '@/apis/users'; // 假设 updateUserPassword 也在 users API中
import { User, Message, Phone, Edit } from '@element-plus/icons-vue';
import router from '@/router'; // 导入 router 实例/ 导入 ElMessage 和 ElMessageBox
import { storeToRefs } from 'pinia';

const baseURL = import.meta.env.VITE_API_BASE_URL;
const usersStore = useUsersStore();
const defaultAvatar = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'; // 默认头像

const { token } = storeToRefs(usersStore);

// 个人信息编辑相关
const dialogVisible = ref(false);
const editingField = ref(null);
const editFormRef = ref();
const editForm = ref({ value: '' });
const savingInfo = ref(false);

// 修改密码相关
const passwordDialogVisible = ref(false);
const passwordFormRef = ref();
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const savingPassword = ref(false);

const dialogTitle = computed(() => {
  if (editingField.value === 'name') return '昵称';
  if (editingField.value === 'email') return '邮箱';
  if (editingField.value === 'phoneNumber') return '手机号';
  return '';
});

const editFormRules = computed(() => {
  const rules = {
    value: [{ required: true, message: `请输入${dialogTitle.value}`, trigger: 'blur' }],
  };
  if (editingField.value === 'email') {
    rules.value.push({
      type: 'email',
      message: '请输入正确的邮箱格式',
      trigger: ['blur', 'change'],
    });
  }
  if (editingField.value === 'phoneNumber') {
    rules.value.push({
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur',
    });
  }
  return rules;
});

// --- 密码校验规则 ---
const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入新密码'));
  } else {
    if (passwordForm.value.confirmPassword !== '') {
      if (!passwordFormRef.value) return;
      passwordFormRef.value.validateField('confirmPassword', () => null);
    }
    // 密码复杂度校验示例：6-20位，字母、数字、下划线
    if (!/^[a-zA-Z0-9_@#$%^&*()\.]{6,20}$/.test(value)) {
      callback(new Error('密码必须为6-20位，可包含字母、数字、下划线、@、#、$、%、^、&、*、()、.'));
    } else {
      callback();
    }
  }
};
const validateConfirmPass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'));
  } else if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的新密码不一致!'));
  } else {
    callback();
  }
};

const passwordFormRules = ref({
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ validator: validatePass, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPass, trigger: 'blur' }],
});
// --- END 密码校验规则 ---

const handleEdit = (field) => {
  editingField.value = field;
  switch (field) {
    case 'name':
      editForm.value.value = usersStore.userInfo?.name || '';
      break;
    case 'email':
      editForm.value.value = usersStore.userInfo?.email || '';
      break;
    case 'phoneNumber':
      editForm.value.value = usersStore.userInfo?.phoneNumber || '';
      break;
  }
  dialogVisible.value = true;
  editFormRef.value?.clearValidate();
};

const handleCancel = () => {
  dialogVisible.value = false;
  editingField.value = null;
  editForm.value.value = '';
};

const handleSaveInfo = async () => {
  if (!editFormRef.value) return;
  await editFormRef.value.validate(async (valid) => {
    if (valid && editingField.value) {
      savingInfo.value = true;
      try {
        const updateData = {};
        updateData[editingField.value] = editForm.value.value;
        await updateCurrentUserProfile(updateData);
        usersStore.updateUserProfile({ [editingField.value]: editForm.value.value });
        ElMessage.success(`${dialogTitle.value}更新成功`);
        handleCancel();
      } catch (error) {
        console.error('更新用户信息失败:', error);
        ElMessage.error(error.message || '更新失败，请稍后再试');
      } finally {
        savingInfo.value = false;
      }
    }
  });
};

// --- 修改密码方法 ---
const openPasswordDialog = () => {
  passwordDialogVisible.value = true;
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  passwordFormRef.value?.clearValidate();
};

const handlePasswordCancel = () => {
  passwordDialogVisible.value = false;
};

const handlePasswordSave = async () => {
  if (!passwordFormRef.value) return;
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      savingPassword.value = true;
      try {
        await updateUserPassword({
          oldPassword: passwordForm.value.oldPassword,
          newPassword: passwordForm.value.newPassword,
        });
        ElMessageBox.confirm('密码修改成功，请重新登录。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(() => {
          usersStore.logout();
          router.push('/login');
        });
      } catch (error) {
        console.error('修改密码失败:', error);
      }
    }
  });
};

// --- 头像上传处理 ---
const handleAvatarSuccess = async (response, uploadFile) => {
  // 假设后端返回的 response 格式为 { success: boolean, data: { url: string }, message?: string }
  // 或者直接是 { url: string } 且 HTTP 状态码为 200
  // 这里我们简单处理，具体根据你的后端API调整
  let newAvatarUrl = '';
  if (response && response.data && response.data.url) {
    // 对应 { success: true, data: { url: '...' } }
    newAvatarUrl = response.data.url;
  } else if (response && response.url) {
    // 对应直接返回 { url: '...' }
    newAvatarUrl = response.url;
  } else {
    ElMessage.error(response.message || '头像上传失败，响应格式不正确');
    return;
  }

  try {
    await updateCurrentUserProfile({ avatar: newAvatarUrl });
    usersStore.updateUserProfile({ avatar: newAvatarUrl });
    ElMessage.success('头像更新成功');
  } catch (error) {
    console.error('更新头像信息失败:', error);
    ElMessage.error(error.message || '更新头像失败，请稍后再试');
  }
};

const beforeAvatarUpload = (rawFile) => {
  const isImage = ['image/jpeg', 'image/png', 'image/gif'].includes(rawFile.type);
  const isLt2M = rawFile.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('头像图片只能是 JPG/PNG/GIF 格式!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!');
    return false;
  }
  return true;
};
// --- END 头像上传处理 ---
</script>

<style lang="scss" scoped>
.configs-view {
  padding: 8px;
  background-color: var(--el-bg-color);
}

.info-card,
.security-card {
  margin-top: 8px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
}

.el-descriptions-item__label .el-icon {
  margin-right: 4px;
  vertical-align: middle;
}

.edit-btn {
  margin-left: 10px;
}

.el-descriptions-item__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0; // 与 el-descriptions-item 相似的padding
  font-size: var(--el-descriptions-item-label-font-size); // 与描述列表标签字体大小一致
  color: var(--el-text-color-regular);
}

.setting-item span {
  flex-grow: 1;
}

// 弹窗内表单样式，如果需要微调
.el-dialog .el-form-item {
  margin-bottom: 22px; // 保持合适的间距
}

.avatar-container {
  display: flex;
  align-items: center;
}

.avatar-uploader {
  margin-left: 20px;
}

.edit-avatar-btn {
  margin-left: 0; // 重置按钮边距，因为已经有 uploader 的边距
}
</style>
