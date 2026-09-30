export function findFolder(folders, targetId) {
  for (const folder of folders || []) {
    if (folder.id === targetId) return folder;
    if (folder.children?.length) {
      const found = findFolder(folder.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

export function getAncestorFolderIds(folders, targetId) {
  const walk = (nodes, trail) => {
    for (const node of nodes || []) {
      if (node.id === targetId) return trail;
      if (node.children?.length) {
        const found = walk(node.children, [...trail, node.id]);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(folders, []) || [];
}

export const flattenFolders = (folders, parentPath = '') => {
  let result = [];
  folders.forEach(folder => {
    const currentPath = parentPath ? `${parentPath}/${folder.name}` : `/${folder.name}`;
    result.push({ id: folder.id, name: folder.name, path: currentPath });
    if (folder.children && folder.children.length > 0) {
      result = result.concat(flattenFolders(folder.children, currentPath));
    }
  });
  return result;
};

export const addFolderToTree = (folders, parentId, newFolder) => {
  if (!parentId) return [...folders, newFolder];
  return folders.map(folder => {
    if (folder.id === parentId) return { ...folder, children: [...(folder.children || []), newFolder] };
    if (folder.children) return { ...folder, children: addFolderToTree(folder.children, parentId, newFolder) };
    return folder;
  });
};

export const renameFolderInTree = (folders, idToRename, newName) => {
  return folders.map(folder => {
    if (folder.id === idToRename) return { ...folder, name: newName };
    if (folder.children) return { ...folder, children: renameFolderInTree(folder.children, idToRename, newName) };
    return folder;
  });
};

export const deleteFolderFromTree = (folders, idToRemove) => {
  return folders.filter(folder => folder.id !== idToRemove).map(folder => {
    if (folder.children) return { ...folder, children: deleteFolderFromTree(folder.children, idToRemove) };
    return folder;
  });
};

export const getDescendantFolderIds = (folders, targetId) => {
  let targetNode = null;
  const findNode = (nodes) => {
    for (const node of nodes) {
      if (node.id === targetId) {
        targetNode = node;
        return;
      }
      if (node.children) findNode(node.children);
    }
  };
  findNode(folders);

  const ids = [];
  const collectIds = (node) => {
    if (!node) return;
    ids.push(node.id);
    if (node.children) node.children.forEach(collectIds);
  };
  collectIds(targetNode);
  return ids;
};
