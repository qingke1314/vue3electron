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
  Folder,
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
  Folder,
};

export const menuConfig = [
  {
    name: '首页',
    path: '/',
    icon: 'HomeFilled', // 假设你已经全局注册了 Element Plus 图标
  },
  {
    name: '目录管理',
    icon: 'Folder',
    children: [
      {
        name: '目录概览',
        path: '/directory-management/overview',
        icon: 'Files',
      },
      {
        name: '目录配置',
        path: '/directory-management/config',
        icon: 'Memo',
      },
    ],
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
    name: '个人信息',
    path: '/configs',
    icon: 'Setting',
  },
];
