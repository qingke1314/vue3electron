import request from '@/utils/request';

export const getAllCategories = () => {
  return request.get('/categories/all');
};

export const addCategory = (category) => {
  return request.post('/categories', category);
};

/**
 * 将多个日志导入到指定目录
 * @param {string} categoryId 目录ID
 * @param {Array<string>} postIds 日志ID数组
 * @returns {Promise} 导入结果
 */
export const importPostsToCategory = (categoryId, postIds) => {
  return request.post(`/categories/${categoryId}/logs`, { postIds });
};

export const addNewPostToCategory = (categoryId, postData) => {
  return request({
    url: `/categories/logs/new?categoryId=${categoryId}`,
    method: 'post',
    data: postData,
  });
};

export const removePostFromCatalog = ({ categoryId, postId }) => {
  return request({
    url: `/categories/${categoryId}/logs/${postId}`,
    method: 'delete',
  });
};

/**
 * 删除目录
 */
export const deleteCategory = (categoryId) => {
  return request({
    url: `/categories/${categoryId}`,
    method: 'delete',
  });
};

/**
 * 重命名
 */
export const renameCategory = (categoryId, newName) => {
  return request.patch(`/categories/${categoryId}/rename`, { name: newName });
};

/**
 * 获取对应目录下的所有日志
 */
export const getLogsByCategoryId = (categoryId) => {
  return request.get(`/categories/${categoryId}/logs`);
};
