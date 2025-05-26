import { ref, onMounted } from 'vue';

const THEME_STORAGE_KEY = 'app-theme';

export const availableThemes = [
  { name: '浅空蓝', value: 'blue', color: 'rgb(137 162 201)' },
  { name: '清新绿', value: 'default', color: 'rgb(90, 155, 90)' },
  { name: '热情红', value: 'red', color: 'rgb(217, 83, 79)' },
  { name: '神秘紫', value: 'purple', color: 'rgb(153, 102, 204)' },
  { name: '活力橙', value: 'orange', color: 'rgb(240, 173, 78)' },
  { name: '炫酷黑', value: 'black', color: 'rgb(0, 0, 0)' },
  // 你可以在这里添加更多主题
  // { name: '深邃暗', value: 'dark' },
];

export function useTheme() {
  const currentTheme = ref(availableThemes[0].value); // 默认主题

  const applyTheme = (themeName) => {
    if (availableThemes.some((t) => t.value === themeName)) {
      document.documentElement.setAttribute('data-theme', themeName);
      currentTheme.value = themeName;
      localStorage.setItem(THEME_STORAGE_KEY, themeName);
    } else {
      console.warn(`Theme "${themeName}" not found. Applying default.`);
      // 如果主题不存在，应用列表中的第一个主题作为默认
      applyTheme(availableThemes[0].value);
    }
  };

  const loadTheme = () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && availableThemes.some((t) => t.value === savedTheme)) {
      applyTheme(savedTheme);
    } else {
      applyTheme(availableThemes[0].value); // 应用默认主题
    }
  };

  // 在组件挂载时加载主题，确保只在客户端执行
  onMounted(() => {
    if (typeof window !== 'undefined') {
      loadTheme();
    }
  });

  return {
    currentTheme,
    setTheme: applyTheme, // 重命名为 setTheme 以便外部调用
    availableThemes,
    loadInitialTheme: loadTheme, // 暴露一个方法用于在应用根组件显式调用（如果需要）
  };
}
