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

export const validateToken = () => {
  return request({
    url: '/validateToken',
    method: 'POST',
  });
};

export const updateCurrentUserProfile = (data) => {
  return request({
    url: '/users/profile',
    method: 'PATCH',
    data,
  });
};

export const updateUserPassword = (data) => {
  return request({
    url: '/users/changePassword',
    method: 'POST',
    data,
  });
};
