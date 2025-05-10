import request from '@/utils/request';

export const queryRegister = (data) => {
  return request({
    url: '/users',
    method: 'POST',
    data,
  });
};

export const queryLogin = (data) => {
  return request({
    url: '/login',
    method: 'POST',
    data,
  });
};
