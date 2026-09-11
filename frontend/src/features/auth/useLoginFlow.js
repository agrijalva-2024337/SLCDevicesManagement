import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import { getValidationErrors } from '@/shared/api/errors';
import { enforceRequired } from '@/shared/utils/fieldErrors';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

function normalizeAutorizadas(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((id) => Number(id)).filter((id) => Number.isFinite(id));
}

function resolveEmpresasLista(autorizadas, catalogo) {
  const byId = new Map((catalogo ?? []).map((empresa) => [Number(empresa.id), empresa]));
  return autorizadas.map((id) => {
    const found = byId.get(Number(id));
    return {
      id: Number(id),
      nombre: found?.nombre?.trim() ? found.nombre : `Empresa #${id}`,
    };
  });
}

/**
 * Flujo de login: credenciales → (opcional) selección de empresa → app.
 */
export function useLoginFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuth();
  const { selectEmpresa } = useEmpresaActiva();

  const [paso, setPaso] = useState('credenciales');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [idsAutorizados, setIdsAutorizados] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresasLoading, setEmpresasLoading] = useState(false);
  const [empresasError, setEmpresasError] = useState(null);
  const [seleccionandoId, setSeleccionandoId] = useState(null);

  const irAlApp = useCallback(() => {
    const from = location.state?.from;
    navigate(typeof from === 'string' && from.startsWith('/') ? from : '/app', { replace: true });
  }, [location.state?.from, navigate]);

  const cargarEmpresas = useCallback(async (autorizadas) => {
    setEmpresasLoading(true);
    setEmpresasError(null);
    try {
      const catalogo = await empresaService.getAll();
      const rows = Array.isArray(catalogo) ? catalogo : (catalogo?.data ?? []);
      setEmpresas(resolveEmpresasLista(autorizadas, rows));
    } catch (error) {
      setEmpresas(resolveEmpresasLista(autorizadas, []));
      setEmpresasError(getErrorMessage(error) || 'No se pudieron cargar las empresas.');
    } finally {
      setEmpresasLoading(false);
    }
  }, []);

  useEffect(() => {
    if (paso !== 'empresa' || idsAutorizados.length < 2) {
      return;
    }
    void cargarEmpresas(idsAutorizados);
  }, [paso, idsAutorizados, cargarEmpresas]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) {
      return;
    }

    const nextErrors = {};
    enforceRequired(nextErrors, { correo, clave }, 'correo', 'correo o usuario');
    enforceRequired(nextErrors, { correo, clave }, 'clave', 'contraseña');
    setFieldErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      const session = await login({ emailOrUsername: correo, password: clave });
      const autorizadas = normalizeAutorizadas(session?.usuario?.empresasAutorizadas);

      if (autorizadas.length > 1) {
        setIdsAutorizados(autorizadas);
        setPaso('empresa');
        return;
      }

      if (autorizadas.length === 1) {
        selectEmpresa(autorizadas[0]);
      }

      irAlApp();
    } catch (error) {
      const apiFields = getValidationErrors(error);
      if (Object.keys(apiFields).length > 0) {
        setFieldErrors({
          correo: apiFields.emailOrUsername ?? apiFields.correo,
          clave: apiFields.password ?? apiFields.clave,
        });
      }
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function handleSelectEmpresa(id) {
    if (seleccionandoId != null) {
      return;
    }
    setSeleccionandoId(id);
    selectEmpresa(id);
    irAlApp();
  }

  function handleCancelEmpresa() {
    logout();
    setPaso('credenciales');
    setIdsAutorizados([]);
    setEmpresas([]);
    setEmpresasError(null);
    setSeleccionandoId(null);
    setClave('');
  }

  function handleRetryEmpresas() {
    void cargarEmpresas(idsAutorizados);
  }

  return {
    paso,
    correo,
    setCorreo,
    clave,
    setClave,
    mostrarClave,
    setMostrarClave,
    fieldErrors,
    setFieldErrors,
    formError,
    saving,
    empresas,
    empresasLoading,
    empresasError,
    seleccionandoId,
    handleSubmit,
    handleSelectEmpresa,
    handleCancelEmpresa,
    handleRetryEmpresas,
  };
}
