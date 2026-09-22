import * as activoService from '@/features/activos/activoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as categoriaService from '@/features/catalogos/categorias/categoriaService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import { env } from '@/shared/config/env';
import { getLoaderQueryKey } from '@/shared/data/loaderKeys';
import { fetchQuery, getQueryData } from '@/shared/data/queryCache';
import { ttlForKey } from '@/shared/data/queryKeys';

const WARM_LOADERS = [
  empresaService.getAll,
  sedeService.getAll,
  estadoService.getAll,
  tipoAsignacionService.getAll,
  categoriaService.getAll,
  ubicacionService.getAll,
  responsableService.getAll,
  activoService.getAll,
  asignacionService.getAll,
];

export function warmAppCache(signal) {
  if (env.useApiMock || signal?.aborted) return;

  const queue = WARM_LOADERS.slice();
  let active = 0;

  function pump() {
    if (signal?.aborted) return;

    while (active < 2 && queue.length > 0) {
      const getAll = queue.shift();
      const key = getLoaderQueryKey(getAll);
      if (!key || getQueryData(key) !== undefined) continue;

      active += 1;
      fetchQuery(key, () => getAll(), { ttlMs: ttlForKey(key) })
        .catch(() => {})
        .finally(() => {
          active -= 1;
          pump();
        });
    }
  }

  pump();
}
