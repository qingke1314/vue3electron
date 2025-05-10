import { createRouter, createWebHashHistory } from 'vue-router';
import Login from '../views/Login.vue'; // 导入登录组件

const routes = [
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    meta: { requiresAuth: true }, // 假设首页需要登录
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: { requiresAuth: true }, // 假设首页需要登录
      },
      {
        path: '/logs/add',
        name: 'PostsAdd',
        component: () => import('../views/Posts/LogsAdd/index.vue'),
        meta: { requiresAuth: true }, // 假设此页面需要登录
      },
      {
        path: '/logs/list',
        name: 'LogsList',
        component: () => import('../views/Posts/LogsList/index.vue'),
        meta: { requiresAuth: true }, // 假设此页面需要登录
      },
      {
        path: '/logs/detail/:id', // 使用:id作为动态参数
        name: 'LogDetail',
        component: () => import('../views/Posts/LogDetail.vue'), // 直接引用导入的组件
        meta: { requiresAuth: true }, // 通常详情页也需要登录
        props: true, // 将路由参数作为props传递给组件 (route.params.id 会作为 id prop)
      },
      {
        path: '/errors',
        name: 'Errors',
        component: () => import('../views/ErrorsView.vue'),
        meta: { requiresAuth: true }, // 假设此页面需要登录
      },
      {
        path: '/configs',
        name: 'Configs',
        component: () => import('../views/ConfigsView.vue'),
        meta: { requiresAuth: true }, // 假设此页面需要登录
      },
      {
        path: '/ideas',
        name: 'Ideas',
        component: () => import('../views/IdeasView/index.vue'),
        meta: { requiresAuth: true }, // 假设此页面需要登录
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
];

const router = createRouter({
  history: createWebHashHistory(), // Electron 通常使用 Hash 模式
  routes,
});

// 全局前置守卫
router.beforeEach((to, _from, next) => {
  const isLoggedIn = localStorage.getItem('token');

  if (to.matched.some((record) => record.meta.requiresAuth) && !isLoggedIn) {
    // 如果目标路由需要认证且用户未登录
    next({ name: 'Login' }); // 重定向到登录页
  } else if (to.name === 'Login' && isLoggedIn) {
    // 如果用户已登录且试图访问登录页，则重定向到首页
    next({ name: 'Home' });
  } else {
    next(); // 否则，正常导航
  }
});

export default router;
