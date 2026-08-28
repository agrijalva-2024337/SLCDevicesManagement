import { Route, Routes } from 'react-router-dom';
import { HomePage } from '@/app/pages/HomePage';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { AreasPage } from '@/features/organizacion/areas/AreasPage';
import { EmpresasPage } from '@/features/organizacion/empresas/EmpresasPage';
import { SedesPage } from '@/features/organizacion/sedes/SedesPage';
import { CategoriasPage } from '@/features/catalogos/categorias/CategoriasPage';
import { ProveedoresPage } from '@/features/catalogos/proveedores/ProveedoresPage';
import { UbicacionesPage } from '@/features/catalogos/ubicaciones/UbicacionesPage';
import { AppLayout } from '@/shared/layout/AppLayout';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogos/empresas" element={<EmpresasPage />} />
        <Route path="/catalogos/sedes" element={<SedesPage />} />
        <Route path="/catalogos/areas" element={<AreasPage />} />
        <Route path="/catalogos/categorias" element={<CategoriasPage />} />
        <Route path="/catalogos/proveedores" element={<ProveedoresPage />} />
        <Route path="/catalogos/ubicaciones" element={<UbicacionesPage />} />
        {/* <Route path="/activos" element={<ActivosPage />} /> */}
        {/* <Route path="/asignaciones" element={<AsignacionesPage />} /> */}
        {/* <Route path="/traslados" element={<TrasladosPage />} /> */}
        {/* <Route path="/mantenimientos" element={<MantenimientosPage />} /> */}
        {/* <Route path="/bajas" element={<BajasPage />} /> */}
        {/* <Route path="/inventario" element={<InventarioPage />} /> */}
        {/* <Route path="/reportes" element={<ReportesPage />} /> */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
