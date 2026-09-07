import { motivosBaja } from '@/features/bajas/mocks/motivosBaja';
import { apiPaths } from '@/shared/api/paths';
import { createReadService } from '@/shared/services/createMockCrudService';

// [API] No existe MotivosBajaController. En VITE_USE_API_MOCK=false este GET
// falla hasta que Angel publique GET /api/MotivosBaja. El seed vive en
// Scripts/SeedCatalogosAddendum.sql (Venta, Desecho, Donacion, Perdida, Robo,
// Dano irreparable, Otro).
export const { getAll, getById } = createReadService({
  endpoint: apiPaths.motivosBaja,
  seed: motivosBaja,
});
