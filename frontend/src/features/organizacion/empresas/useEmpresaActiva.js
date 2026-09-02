import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import { RolUsuario } from '@/shared/api/contracts';

const STORAGE_KEY = 'slcdm_empresa_activa';
const EmpresaActivaContext = createContext(null);

function readStoredId() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw == null || raw === '') {
    return null;
  }
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function filterRowsByEmpresa(rows, idEmpresa, { idField = 'idEmpresa', sedes } = {}) {
  if (idEmpresa == null || idEmpresa === '') {
    return rows;
  }

  const wanted = Number(idEmpresa);
  return (rows ?? []).filter((row) => {
    if (idField === 'id') {
      return Number(row.id) === wanted;
    }
    if (row[idField] != null && row[idField] !== '') {
      return Number(row[idField]) === wanted;
    }
    if (row.idSede != null && Array.isArray(sedes)) {
      const sede = sedes.find((item) => Number(item.id) === Number(row.idSede));
      return sede ? Number(sede.idEmpresa) === wanted : false;
    }
    return true;
  });
}

export function EmpresaActivaProvider({ children }) {
  const { rol, idEmpresa, isReady } = useAuth();
  const isAdminGeneral = rol === RolUsuario.AdministradorGeneral;
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(readStoredId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await empresaService.getAll();
        if (!cancelled) {
          setEmpresas(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setEmpresas([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (isReady) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [isReady]);

  const selectEmpresa = useCallback((id) => {
    const next = id === '' || id == null ? null : Number(id);
    const stored = Number.isFinite(next) ? next : null;
    setSelectedId(stored);
    if (stored == null) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, String(stored));
  }, []);

  const idActiva = isAdminGeneral ? selectedId : idEmpresa;

  const value = useMemo(
    () => ({
      empresas,
      idActiva,
      isAdminGeneral,
      isLocked: !isAdminGeneral,
      isLoading,
      selectEmpresa,
    }),
    [empresas, idActiva, isAdminGeneral, isLoading, selectEmpresa],
  );

  return <EmpresaActivaContext.Provider value={value}>{children}</EmpresaActivaContext.Provider>;
}

export function useEmpresaActiva() {
  const context = useContext(EmpresaActivaContext);
  if (!context) {
    throw new Error('useEmpresaActiva debe usarse dentro de EmpresaActivaProvider.');
  }
  return context;
}
