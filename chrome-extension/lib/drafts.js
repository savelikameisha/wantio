// Serialize storage operations so closing and reopening the popup cannot race a save.
export function createDraftStore(storage) {
  const key = "wantio_drafts_v1";
  let queue = Promise.resolve();
  function mutate(fn) {
    const task = queue.then(async () => {
      const records = (await storage.get(key))[key] || {};
      Object.keys(records).forEach((k) => {
        if (Date.now() - records[k].updatedAt >= 7 * 86400000)
          delete records[k];
      });
      const result = fn(records);
      await storage.set({ [key]: records });
      return result;
    });
    queue = task.catch(() => {});
    return task;
  }
  return {
    get(url) {
      return mutate((records) => records[url] || null);
    },
    put(url, item) {
      return mutate((records) => {
        if (records[url]?.saved && records[url].item.id === item.id) return;
        records[url] = { item, updatedAt: Date.now(), saved: false };
        Object.keys(records)
          .sort((a, b) => records[b].updatedAt - records[a].updatedAt)
          .slice(10)
          .forEach((k) => delete records[k]);
      });
    },
    complete(url, item) {
      return mutate((records) => {
        records[url] = { item, updatedAt: Date.now(), saved: true };
      });
    },
    remove(url) {
      return mutate((records) => {
        delete records[url];
      });
    },
  };
}
