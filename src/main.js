import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';
import App from './App.vue';
import router from './router';
import './style.css';
import './styles/element/index.scss';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(ElMessage);
app.use(ElMessageBox);

app.mount('#app').$nextTick(() => {
  // Use contextBridge
  window.ipcRenderer?.on('main-process-message', (_event, message) => {
    console.log(message);
  });
});

/**
 * 全局子组件错误处理
 */
app.config.errorHandler = (err) => {
  console.error(err);
};
