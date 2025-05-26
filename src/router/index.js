import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';
import { useUsersStore } from '@/pinia/users'; // 导入 store

const routes = [
  {
    path: '/',
    redirect: '/home',
    component: () => import('../components/Layout.vue'),
    children: [
      {
        path: '/home',
        name: 'Home',
        component: Home,
        meta: { requiresAuth: true },
      },
      {
        path: '/directory-management',
        name: 'DirectoryManagement',
        meta: { requiresAuth: true },
        children: [
          {
            path: 'config',
            name: 'DirectoryConfig',
            component: () => import('../views/DirectoryManagement/DirectoryManagement.vue'),
            meta: { requiresAuth: true },
          },
          {
            path: 'overview',
            name: 'DirectoryOverview',
            component: () => import('../views/DirectoryList/DirectoryListPage.vue'),
            meta: { requiresAuth: true },
          },
        ],
      },
      {
        path: '/logs',
        name: 'Logs',
        meta: { requiresAuth: true },
        children: [
          {
            path: '/logs/add',
            name: 'LogsAdd',
            component: () => import('../views/Posts/LogsAdd/index.vue'),
            meta: { requiresAuth: true }, // 假设此页面需要登录
          },
          {
            path: '/logs/list',
            name: 'LogsListAll',
            component: () => import('../views/Posts/LogsList/index.vue'),
            meta: { requiresAuth: true }, // 假设此页面需要登录
          },
          {
            path: '/logs/list/dir/:directoryId',
            name: 'LogsListByDirectory',
            component: () => import('../views/Posts/LogsList/index.vue'),
            props: true, // 将路由参数 directoryId 作为 prop 传递给组件
            meta: { requiresAuth: true },
          },
          {
            path: '/logs/editor/:id',
            name: 'Editor',
            component: () => import('../views/Posts/Editor/index.vue'),
            meta: { requiresAuth: true }, // 假设此页面需要登录
          },
          {
            path: '/logs/detail/:id', // 使用:id作为动态参数
            name: 'LogDetail',
            component: () => import('../views/Posts/LogDetail.vue'), // 直接引用导入的组件
            meta: { requiresAuth: true }, // 通常详情页也需要登录
            props: true, // 将路由参数作为props传递给组件 (route.params.id 会作为 id prop)
          },
        ],
      },
      {
        path: '/configs',
        name: 'Configs',
        component: () => import('../views/ConfigsView.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }, // 登录页不需要认证
  },
  // 可以在这里添加一个404页面
  // { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue') }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const usersStore = useUsersStore();
  const token = usersStore.token;

  // 检查目标路由是否为登录页
  if (to.name === 'Login') {
    if (token) {
      // 如果有token，检查用户信息是否已加载
      if (!usersStore.isProfileLoaded) {
        const profileFetched = await usersStore.fetchAndSetUser();
        if (profileFetched) {
          next({ path: '/' }); // 用户信息加载成功，跳转到首页
          return;
        }
        // 如果加载失败（token可能无效），允许访问登录页，并清除无效信息
        usersStore.clearTokenAndInfo();
        next();
        return;
      }
      // 用户信息已加载，跳转到首页
      next({ path: '/' });
    } else {
      next(); // 没有token，正常访问登录页
    }
    return;
  }

  // 对于非登录页
  if (to.meta.requiresAuth) {
    if (token) {
      if (!usersStore.isProfileLoaded) {
        const profileFetched = await usersStore.fetchAndSetUser();
        if (!profileFetched) {
          usersStore.clearTokenAndInfo();
          next({ name: 'Login', query: { redirect: to.fullPath } });
          return;
        }
      }
      // 再次检查 isLoggedIn，因为 fetchAndSetUser 可能会改变它
      if (usersStore.isLoggedIn) {
        next();
      } else {
        // 如果 fetchAndSetUser 后依然不是 isLoggedIn，说明 token 有问题
        usersStore.clearTokenAndInfo();
        next({ name: 'Login', query: { redirect: to.fullPath } });
      }
    } else {
      next({ name: 'Login', query: { redirect: to.fullPath } });
    }
  } else {
    // 目标路由不需要认证，但如果用户有 token 且信息未加载，也尝试加载一次
    if (token && !usersStore.isProfileLoaded) {
      await usersStore.fetchAndSetUser(); // 不阻塞导航
    }
    next();
  }
});

export default router;
