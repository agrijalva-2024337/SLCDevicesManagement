import { useQueryResource } from '@/shared/data/useQueryResource';

export function useResource(loadFn, options) {
  return useQueryResource(loadFn, options);
}
