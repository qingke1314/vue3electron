import request from '@/utils/request';

export const getAllCategories = () => {
  return request.get('/categories/all');
};


export const addCategory = (category) => {
  return request.post('/categories', category);
};

