import { tiposMantenimiento } from '@/features/mantenimientos/mocks/tiposMantenimiento';
import { apiPaths } from '@/shared/api/paths';
import { createReadService } from '@/shared/services/createMockCrudService';

// [API] No existe TiposMantenimientoController. En VITE_USE_API_MOCK=false este GET
// falla hasta que Angel publique GET /api/TiposMantenimiento. El seed vive en
// Scripts/SeedCatalogosAddendum.sql (Preventivo, Correctivo).
export const { getAll, getById } = createReadService({
  endpoint: apiPaths.tiposMantenimiento,
  seed: tiposMantenimiento,
});
