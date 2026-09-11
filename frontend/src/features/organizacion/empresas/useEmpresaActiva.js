import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/features/auth/useAuth';
import {
  clearEmpresaActivaStorage,
  EMPRESA_ACTIVA_STORAGE_KEY,
} from '@/features/organizacion/empresas/empresaActivaStorage';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import { RolUsuario } from '@/shared/api/contracts';
import { useResource } from '@/shared/hooks/useResource';

const EmpresaActivaContext = createContext(null);

function readStoredId() {
  const raw = window.localStorage.getItem(EMPRESA_ACTIVA_STORAGE_KEY);
  if (raw == null || raw === '') {
    return null;
  }
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export { clearEmpresaActivaStorage, EMPRESA_ACTIVA_STORAGE_KEY } from '@/features/organizacion/empresas/empresaActivaStorage';

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
    // Sin idEmpresa (catálogo aún global en API): no ocultar por empresa.
    return true;
  });
}

function normalizeEmpresasAutorizadas(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
}

export function EmpresaActivaProvider({ children }) {
  const { usuario, rol, idEmpresa, empresasAutorizadas, isReady } = useAuth();
  const isAdminGeneral = rol === RolUsuario.AdministradorGeneral;
  const autorizadas = useMemo(
    () => normalizeEmpresasAutorizadas(empresasAutorizadas),
    [empresasAutorizadas],
  );
  // Selector para AdminGeneral o cualquier usuario con más de una empresa del backend.
  const canSwitchEmpresa = isAdminGeneral || autorizadas.length > 1;
  const isLocked = !canSwitchEmpresa;

  const empresasResource = useResource(empresaService.getAll, {
    enabled: isReady && Boolean(usuario),
  });
  const [selectedId, setSelectedId] = useState(readStoredId);

  useEffect(() => {
    if (!usuario) {
      setSelectedId(null);
    }
  }, [usuario]);

  const selectEmpresa = useCallback((id) => {
    const next = id === '' || id == null ? null : Number(id);
    const stored = Number.isFinite(next) ? next : null;
    setSelectedId(stored);
    if (stored == null) {
      clearEmpresaActivaStorage();
      return;
    }
    window.localStorage.setItem(EMPRESA_ACTIVA_STORAGE_KEY, String(stored));
  }, []);

  const empresasValidas = useMemo(() => {
    const all = (empresasResource.data ?? []).filter((empresa) => empresa.habilitado !== false);
    if (isAdminGeneral) {
      return all;
    }
    if (autorizadas.length === 0) {
      return all.filter((empresa) => Number(empresa.id) === Number(idEmpresa));
    }
    const allowed = new Set(autorizadas);
    return all.filter((empresa) => allowed.has(Number(empresa.id)));
  }, [autorizadas, empresasResource.data, idEmpresa, isAdminGeneral]);

  const idActiva = useMemo(() => {
    if (isLocked) {
      if (autorizadas.length === 1) {
        return autorizadas[0];
      }
      return idEmpresa;
    }

    if (selectedId == null) {
      // AdminGeneral: null = todas. Multi-empresa: default a la primera autorizada.
      return isAdminGeneral ? null : (autorizadas[0] ?? idEmpresa ?? null);
    }

    if (empresasResource.isLoading) {
      return selectedId;
    }

    return empresasValidas.some((empresa) => Number(empresa.id) === Number(selectedId))
      ? selectedId
      : isAdminGeneral
        ? null
        : (autorizadas[0] ?? idEmpresa ?? null);
  }, [
    autorizadas,
    empresasResource.isLoading,
    empresasValidas,
    idEmpresa,
    isAdminGeneral,
    isLocked,
    selectedId,
  ]);

  const value = useMemo(
    () => ({
      empresas: empresasValidas,
      idActiva,
      isAdminGeneral,
      canSwitchEmpresa,
      isLocked,
      isLoading: empresasResource.isLoading,
      selectEmpresa,
    }),
    [
      canSwitchEmpresa,
      empresasResource.isLoading,
      empresasValidas,
      idActiva,
      isAdminGeneral,
      isLocked,
      selectEmpresa,
    ],
  );

  return createElement(EmpresaActivaContext.Provider, { value }, children);
}

export function useEmpresaActiva() {
  const context = useContext(EmpresaActivaContext);
  if (!context) {
    throw new Error('useEmpresaActiva debe usarse dentro de EmpresaActivaProvider.');
  }
  return context;
}
