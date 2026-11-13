function createCache(limit, ttl, load) {
  const entries = new Map();
  const pending = new Map();
  return async function get(key) {
    const entry = entries.get(key);
    if (entry && entry.expires > Date.now()) {
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    }
    entries.delete(key);
    if (pending.has(key)) return pending.get(key);
    const task = Promise.resolve().then(() => load(key)).then(value => {
      if (entries.size >= limit) entries.delete(entries.keys().next().value);
      entries.set(key, { value, expires: Date.now() + ttl });
      return value;
    }).finally(() => pending.delete(key));
    pending.set(key, task);
    return task;
  };
}

module.exports = { createCache };
