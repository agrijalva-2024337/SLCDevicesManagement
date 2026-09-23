import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { ConsultaShell } from '@/features/consulta/ConsultaShell';
import { codigoDesdeQr, consultaPath } from '@/features/consulta/consultaPublicaService';
import { QrScanner } from '@/shared/components/QrScanner';

export function EscanearPage() {
  const navigate = useNavigate();

  const abrirFicha = useCallback(
    (valor) => {
      const codigo = codigoDesdeQr(valor);
      if (codigo) navigate(consultaPath(codigo));
    },
    [navigate],
  );

  return (
    <ConsultaShell>
      <h1 className="consulta-title">Escanear código QR</h1>

      <div className="consulta-card">
        <QrScanner onDetect={abrirFicha} />
      </div>

      <p className="consulta-links">
        <Link to="/">Volver al inicio</Link>
      </p>
    </ConsultaShell>
  );
}
