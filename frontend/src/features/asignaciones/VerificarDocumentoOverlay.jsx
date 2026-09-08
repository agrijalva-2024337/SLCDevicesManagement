import { useId, useState } from 'react';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import { env } from '@/shared/config/env';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { formatDate } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import { formatHash } from '@/shared/utils/sha256';

function pickPdf(fileList) {
  const file = fileList?.[0];
  if (!file) return null;
  const isPdf = file.type === 'application/pdf' || String(file.name).toLowerCase().endsWith('.pdf');
  return isPdf ? file : null;
}

export function VerificarDocumentoOverlay({ open, asignacion, onClose }) {
  const inputId = useId();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const hashRegistro = formatHash(asignacion?.hashDocumento);
  const tieneHash = Boolean(asignacion?.hashDocumento);

  async function handleVerify() {
    if (!asignacion || saving) return;
    setError(null);
    setResult(null);
    setSaving(true);
    try {
      const next = await asignacionService.verificarDocumento(asignacion.id, file);
      setResult(next);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function handleFiles(fileList) {
    const next = pickPdf(fileList);
    setResult(null);
    if (!next && fileList?.[0]) {
      setFile(null);
      setError('Solo se aceptan archivos PDF.');
      return;
    }
    setError(null);
    setFile(next);
  }

  return (
    <DetailOverlay
      open={open}
      title={asignacion?.activoNombre ?? 'Asignación'}
      kicker="Verificar documento"
      onClose={onClose}
    >
      {asignacion ? (
        <div className="space-y-5">
          <div className="app-fields">
            <DetailField label="Activo" value={asignacion.activoNombre} />
            <DetailField label="Responsable" value={asignacion.responsableNombre} />
            <DetailField
              label="Hash del registro"
              value={<span className="app-hash">{hashRegistro}</span>}
            />
            <DetailField
              label="Acta generada"
              value={tieneHash ? formatDate(asignacion.documentoPdfGeneradoEn) : 'Sin acta registrada'}
            />
          </div>

          {!tieneHash ? (
            <div className="app-feedback app-feedback--empty" role="status">
              Esta asignación no tiene un hash de acta. Puede calcular la firma del PDF, pero no hay
              registro contra el que comparar.
            </div>
          ) : null}

          <div>
            <label className="app-label" htmlFor={inputId}>
              PDF del acta
            </label>
            <label
              htmlFor={inputId}
              className={`app-file-drop${dragOver ? ' is-active' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                handleFiles(event.dataTransfer.files);
              }}
            >
              <i className="pi pi-upload" aria-hidden="true" />
              <span>
                {file
                  ? file.name
                  : 'Arrastre un PDF aquí o haga clic para seleccionarlo'}
              </span>
            </label>
            <input
              id={inputId}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(event) => {
                handleFiles(event.target.files);
                event.target.value = '';
              }}
            />
          </div>

          {env.useApiMock && asignacion.documentoPdfUrl ? (
            <p className="text-sm text-text-muted">
              En mock, la asignación #1 coincide con{' '}
              <a className="font-semibold text-navy underline" href={asignacion.documentoPdfUrl} download>
                el acta de ejemplo
              </a>
              .
            </p>
          ) : null}

          {error ? (
            <div className="app-feedback app-feedback--error" role="alert">
              {error}
            </div>
          ) : null}

          {result ? (
            <div
              className={`app-feedback ${result.coincide ? 'app-feedback--success' : 'app-feedback--error'}`}
              role="status"
            >
              <p className="font-semibold">
                {result.coincide
                  ? `Documento válido — generado el ${formatDate(result.fechaGenerado)}`
                  : result.hashRegistro
                    ? 'Este documento no coincide con nuestros registros'
                    : 'No hay un acta registrada para comparar. El hash no se guardó al enviar el correo.'}
              </p>
              <div className="app-compare mt-3">
                <p>
                  <span className="app-label">Hash del registro</span>
                  <span className="app-hash">{formatHash(result.hashRegistro)}</span>
                </p>
                <p>
                  <span className="app-label">Firma del documento</span>
                  <span className="app-hash">{formatHash(result.firmaDocumento)}</span>
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="app-btn app-btn--primary"
              disabled={saving || !file}
              onClick={handleVerify}
            >
              <i className="pi pi-verified" aria-hidden="true" />
              {saving ? 'Verificando…' : 'Verificar documento'}
            </button>
          </div>
        </div>
      ) : null}
    </DetailOverlay>
  );
}
