<template>
  <div class="login-container">
    <div class="login-form">
      <div class="login-title">欢迎使用SecNote</div>
      <div class="login-description">你的自定义笔记小窝</div>
      <el-form ref="formRef" :model="form" size="middle" :rules="rules" label-width="0">
        <el-form-item label="" prop="email">
          <el-autocomplete
            v-model="form.email"
            :fetch-suggestions="querySearchEmails"
            placeholder="邮箱"
            clearable
            style="width: 100%"
            @select="handleEmailSelect"
          />
        </el-form-item>
        <el-form-item v-if="loginType == LOGIN_TYPE.REGISTER" label="" prop="username">
          <el-input placeholder="昵称(可选)" v-model="form.username" />
        </el-form-item>
        <el-form-item label="" prop="password">
          <el-input
            @keyup.enter="handleLogin(formRef)"
            placeholder="密码"
            v-model="form.password"
            type="password"
          />
        </el-form-item>
        <el-form-item>
          <el-button style="width: 100%" type="primary" @click="handleLogin(formRef)">{{
            loginType !== LOGIN_TYPE.LOGIN ? '注册' : '登录'
          }}</el-button>
          <div class="register-button-container">
            <el-button
              class="register-button"
              type="primary"
              link
              @click="
                loginType = loginType == LOGIN_TYPE.LOGIN ? LOGIN_TYPE.REGISTER : LOGIN_TYPE.LOGIN
              "
              >切换{{ loginType === LOGIN_TYPE.LOGIN ? '注册' : '登录' }}</el-button
            >
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { queryRegister, queryLogin } from '@/apis/users';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUsersStore } from '@/pinia/users';
import { ElMessage } from 'element-plus';

const LOGIN_TYPE = {
  LOGIN: 'login',
  REGISTER: 'register',
};
const formRef = ref(null);
const router = useRouter();
const loginType = ref(LOGIN_TYPE.LOGIN);
const form = ref({
  email: '',
  password: '',
  username: '',
});
const usersStore = useUsersStore();
const { setUserInfo } = usersStore;

const emailHistory = ref([]);
const MAX_EMAIL_HISTORY = 5;
const EMAIL_HISTORY_KEY = 'loginEmailHistory';

onMounted(() => {
  const storedHistory = localStorage.getItem(EMAIL_HISTORY_KEY);
  if (storedHistory) {
    emailHistory.value = JSON.parse(storedHistory);
  }
});

const rules = ref({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
});

const handleLogin = async (formInstance) => {
  if (loginType.value == LOGIN_TYPE.REGISTER) {
    handleRegister(formInstance);
    return;
  }
  if (!formInstance) return;
  formInstance.validate((valid) => {
    if (valid) {
      queryLogin({
        email: form.value.email,
        password: form.value.password,
      })
        .then((res) => {
          const { token, user } = res;
          ElMessage.success('你好，' + user.name + '，欢迎登录SecNote');
          setUserInfo(user);
          localStorage.setItem('token', token);

          const currentEmail = form.value.email;
          let history = [...emailHistory.value];
          history = history.filter((email) => email !== currentEmail);
          history.unshift(currentEmail);
          if (history.length > MAX_EMAIL_HISTORY) {
            history = history.slice(0, MAX_EMAIL_HISTORY);
          }
          emailHistory.value = history;
          localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify(history));
          router.push('/');
        })
        .catch((error) => {
          console.error('登录失败:', error);
        });
    } else {
      console.log('表单验证失败!');
      return false;
    }
  });
};

const handleRegister = async (formInstance) => {
  if (!formInstance) return;
  formInstance.validate((valid) => {
    if (valid) {
      queryRegister({
        email: form.value.email,
        name: form.value.username,
        password: form.value.password,
      })
        .then((res) => {
          ElMessage.success(res.message || '注册成功，请登录');
          form.value.password = '';
        })
        .catch((error) => {
          console.error('注册失败:', error);
        });
    } else {
      console.log('表单验证失败!');
      return false;
    }
  });
};

const querySearchEmails = (queryString, cb) => {
  const results = queryString
    ? emailHistory.value.filter(createFilter(queryString))
    : emailHistory.value;
  cb(results.map((email) => ({ value: email })));
};

const createFilter = (queryString) => {
  return (email) => {
    return email.toLowerCase().indexOf(queryString.toLowerCase()) === 0;
  };
};

const handleEmailSelect = (item) => {
  console.log('选择了邮箱:', item.value);
};
</script>

<style scoped>
.register-button-container {
  margin-top: 8px;
  text-align: right;
  width: 100%;
}
.login-title {
  font-weight: bold;
  font-size: 22px;
  text-align: center;
  color: #666;
}
.login-description {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin: 24px 0 32px 0;
  font-family: '黑体';
}
.login-container {
  background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  height: 100vh;
}
.login-form {
  width: 36vw;
  margin: 0 auto;
  padding: 40px 20px 10px 20px;
  background-color: var(--el-bg-color);
  top: 20%;
  position: relative;
  border-radius: 10px;
  box-shadow: 1px 1px 10px #d9d7d7;
}
</style>
