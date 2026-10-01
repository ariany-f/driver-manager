export function defaultStatus(statusList = []) {
  return statusList.find(item => item.padrao) || null;
}

export function statusIdOf(file, statusList = []) {
  const id = file?.status;
  if (id && statusList.some(item => item.id === id)) return id;
  return defaultStatus(statusList)?.id || '';
}
