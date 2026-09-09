const loaderKeys = new WeakMap();

export function registerLoaderKey(fn, key) {
  if (typeof fn === 'function' && key) {
    loaderKeys.set(fn, key);
  }
  return fn;
}

export function getLoaderQueryKey(fn) {
  if (typeof fn !== 'function') {
    return undefined;
  }
  return loaderKeys.get(fn);
}
