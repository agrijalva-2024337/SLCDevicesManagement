const listeners = new Set();

export function subscribeHttpErrors(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishHttpError(error) {
  listeners.forEach((listener) => listener(error));
}
