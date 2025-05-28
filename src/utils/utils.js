export const getItemById = (id, tree, key = 'id') => {
  if (!tree) return null;
  for (const item of tree) {
    if (item[key] === id) return item;
    if (item.children) {
      const result = getItemById(id, item.children, key);
      if (result) return result;
    }
  }
  return null;
};
