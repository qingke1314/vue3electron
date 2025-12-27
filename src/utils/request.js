import axios from 'axios';
import router from '@/router'; // 导入你的 Vue Router 实例
import { useUsersStore } from '@/pinia/users';

const baseURL = import.meta.env.VITE_API_BASE_URL;
// 创建 Axios 实例
const service = axios.create({
  baseURL: baseURL, // 假设你的代理配置了 /api
  timeout: 15000, // 请求超时时间 (毫秒)
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么，例如添加 token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    console.error('Request Error:', error); // for debug
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 1) { // 假设 0 代表成功
      // 处理错误，例如弹窗提示
      console.error('API Error:', res.message || 'Error');
      return Promise.reject(new Error(res.message || 'Error'));
    } else {
      return res; // 只返回业务数据部分
    }
  },
  (error) => {
    console.log('error', error);
    // 对响应错误做点什么
    console.error('Response Error:', error.response || error.message || error); // for debug

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token'); // 清除 token

      ElMessageBox.confirm('认证信息不合法或已过期，请重新登录。', '重新登录提示', {
        confirmButtonText: '重新登录',
        cancelButtonText: '取消',
        type: 'warning',
        showClose: false, // 不显示右上角的关闭按钮
        closeOnClickModal: false, // 不允许点击遮罩层关闭
        closeOnPressEscape: false, // 不允许按 ESC 关闭
        // 此处可以设置 center: true 让弹窗居中
      })
        .then(() => {
          useUsersStore().logout();
          router.push('/login');
        })
        .catch(() => {
          // 用户点击取消或关闭弹窗（如果允许的话）
          // 可以选择不执行任何操作，或者根据需求执行其他逻辑
          console.log('用户取消了重新登录');
          // 如果希望用户取消后仍能尝试跳转到登录页（例如，如果他们关闭了所有提示）
          // 也可以在这里再次尝试跳转，但这取决于产品设计
          // router.push('/login');
        });
      // 返回一个 pending的Promise，阻止后续的错误处理链继续执行，因为我们已经处理了401
      return new Promise(() => {});
    } else {
      ElMessage.error(error.response.data.message || '请求失败');
    }
    // 可以根据状态码进行统一错误处理
    // if (error.response) {
    //   switch (error.response.status) {
    //     case 401:
    //       // 重新登录或跳转到登录页
    //       break;
    //     case 403:
    //       // 提示无权限
    //       break;
    //     // ...
    //   }
    // }
    return Promise.reject(error);
  }
);

export default service;
