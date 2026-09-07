import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import * as activoService from '@/features/activos/activoService';
import { codigoDesdeQr } from '@/features/consulta/consultaPublicaService';
import { PageHeader } from '@/shared/components/PageHeader';
import { QrScanner } from '@/shared/components/QrScanner';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

export function EscanearActivoPage() {
  const navigate = useNavigate();
  const [aviso, setAviso] = useState(null);

  const resolver = useCallback(
    async (valor) => {
      const codigo = codigoDesdeQr(valor);
      setAviso(null);

      try {
        const activo = await activoService.buscarPorCodigo(codigo);
        if (!activo) {
          setAviso(`Ningún activo coincide con «${codigo}». Verifique la etiqueta o busque en el listado.`);
          return;
        }
        navigate(`/app/activos/${activo.id}`);
      } catch (error) {
        setAviso(getErrorMessage(error));
      }
    },
    [navigate],
  );

  return (
    <section>
      <PageHeader
        title="Escanear código QR"
        description="Apunte la cámara a la etiqueta del equipo o suba una foto del código. Al reconocerlo se abre la ficha del activo."
        actions={
          <Link to="/app/activos" className="app-btn app-btn--ghost">
            <i className="pi pi-arrow-left" aria-hidden="true" />
            Volver al listado
          </Link>
        }
      />

      <div className="app-panel mx-auto max-w-xl">
        {aviso ? (
          <div className="app-feedback app-feedback--empty mb-4" role="status">
            {aviso}
          </div>
        ) : null}
        <QrScanner onDetect={resolver} manualLabel="O escriba el código, la serie o el id del activo" />
      </div>
    </section>
  );
}
