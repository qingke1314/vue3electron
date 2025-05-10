import request from '@/utils/request';

export const getPosts = () => {
  return request.get('/posts/getAll');
};

export const getPostById = (id) => {
  return request.get(`/posts/${id}`);
};

export const connectCheck = (id) => {
  return request.get(`/`);
};

export const addPosts = (data) => {
  return request({
    url: '/posts/add',
    method: 'POST',
    data,
  });
};

/**
 * 更新日志
 * @param {*} id 日志id
 * @param {*} data 更新数据
 * @returns
 */
export const updatePosts = (id, data) => {
  return request({
    url: `/posts/${id}`,
    method: 'patch',
    data,
  });
};

/**
 * 删除日志
 */
export const deletePosts = (id) => {
  return request({
    url: `/posts/${id}`,
    method: 'delete',
  });
};

// --- 评论相关API ---

/**
 * 根据日志ID获取评论列表
 * @param {string} postId 日志ID
 */
export const getCommentsByPostId = (postId) => {
  return request.get(`/posts/${postId}/comments`);
};

/**
 * 为指定日志添加评论
 * @param {string} postId 日志ID
 * @param {object} commentData 评论数据 (例如 { content: '评论内容' })
 */
export const addCommentToPost = (postId, commentData) => {
  return request.post(`/posts/${postId}/comments`, commentData);
};
