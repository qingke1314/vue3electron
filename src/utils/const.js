import {
  HomeFilled,
  Setting,
  Document,
  Memo,
  CollectionTag,
  Opportunity,
  Tickets,
  DocumentAdd,
  Files,
} from '@element-plus/icons-vue';

export const iconMap = {
  HomeFilled,
  Document,
  Setting,
  Opportunity,
  CollectionTag,
  Tickets,
  Memo,
  DocumentAdd,
  Files,
};

export const menuConfig = [
  {
    name: '首页',
    path: '/',
    icon: 'HomeFilled', // 假设你已经全局注册了 Element Plus 图标
  },
  {
    name: '日志管理',
    icon: 'Document',
    path: '/logs',
    children: [
      {
        name: '新建日志',
        path: '/logs/add',
        icon: 'DocumentAdd',
      },
      {
        name: '日志列表',
        path: '/logs/list',
        icon: 'Files',
      },
    ],
  },
  {
    name: '创意管理',
    path: '/ideas',
    icon: 'Opportunity',
  },
  {
    name: '错题集',
    // path: '/errors', // 父菜单可以没有path，如果它仅用于展开
    icon: 'CollectionTag',
    children: [
      {
        name: '前端错题',
        path: '/errors',
        icon: 'Tickets',
      },
      // {
      //   name: "后端错题",
      //   path: "/errors/backend",
      //   // icon: 'DataLine'
      // },
    ],
  },
  {
    name: '个人信息',
    path: '/configs',
    icon: 'Setting',
  },
];
