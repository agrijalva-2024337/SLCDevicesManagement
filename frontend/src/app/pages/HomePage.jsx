import { useMemo, useState } from 'react';
import { Button } from '@/shared/components/Button';
import { DataTable } from '@/shared/components/DataTable';
import { FeedbackState } from '@/shared/components/FeedbackState';
import { Form, FormField, inputClassName } from '@/shared/components/Form';
import { Modal } from '@/shared/components/Modal';
import { PageHeader } from '@/shared/components/PageHeader';
import { env } from '@/shared/config/env';
import { useApiHealth } from '@/shared/hooks/useApiHealth';
import httpClient from '@/shared/services/httpClient';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

const SAMPLE_ROWS = [
  { id: 1, codigo: 'ACT-001', nombre: 'Laptop Dell', estado: 'Activo' },
  { id: 2, codigo: 'ACT-002', nombre: 'Monitor LG', estado: 'Asignado' },
  { id: 3, codigo: 'ACT-003', nombre: 'Impresora HP', estado: 'En taller' },
  { id: 4, codigo: 'ACT-004', nombre: 'Tablet Samsung', estado: 'Activo' },
  { id: 5, codigo: 'ACT-005', nombre: 'Proyector Epson', estado: 'Baja' },
];

const COLUMNS = [
  { key: 'codigo', header: 'Código' },
  { key: 'nombre', header: 'Nombre' },
  { key: 'estado', header: 'Estado' },
];

export function HomePage() {
  const { status, data, error } = useApiHealth();
  const [page, setPage] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('confirm');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [savedName, setSavedName] = useState('');

  const pageSize = 3;
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return SAMPLE_ROWS.slice(start, start + pageSize);
  }, [page]);

  function openConfirm() {
    setModalMode('confirm');
    setModalOpen(true);
  }

  function openForm() {
    setModalMode('form');
    setFieldErrors({});
    setFormError('');
    setModalOpen(true);
  }

  function handleFormSubmit(event) {
    const formData = new FormData(event.target);
    const nombre = String(formData.get('nombre') || '').trim();

    if (!nombre) {
      setFieldErrors({ nombre: 'El nombre es obligatorio.' });
      setFormError('');
      return;
    }

    setFieldErrors({});
    setFormError('');
    setSavedName(nombre);
    setModalOpen(false);
  }

  function simulateHttpError() {
    httpClient.get('/fe02-error-de-prueba').catch(() => {
      // El interceptor publica el toast; no hace falta lógica extra.
    });
  }

  return (
    <section className="space-y-8">
      <PageHeader
        title="Inicio"
        description="Layout provisional de SLCDevicesManagement. Usa el perfil simulado del header para ver cómo se oculta la navegación."
      />

      <div className="rounded-md border border-line bg-surface-raised p-4">
        <h2 className="text-sm font-semibold text-ink">Cliente HTTP</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Mock: {String(env.useApiMock)} · API: {env.apiUrl || '(no definida)'}
        </p>
        <div className="mt-3">
          <FeedbackState
            status={status}
            loadingMessage="Comprobando el cliente HTTP..."
            errorMessage={getErrorMessage(error)}
          >
            {data ? (
              <p className="rounded-md bg-success-soft px-3 py-2 text-sm text-success">
                {data.message}
              </p>
            ) : null}
          </FeedbackState>
        </div>
        <div className="mt-3">
          <Button variant="secondary" onClick={simulateHttpError}>
            Simular error HTTP
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Tabla genérica</h2>
          <Button variant="secondary" onClick={() => setTableLoading((value) => !value)}>
            {tableLoading ? 'Quitar carga' : 'Ver estado de carga'}
          </Button>
        </div>
        <DataTable
          columns={COLUMNS}
          rows={pagedRows}
          isLoading={tableLoading}
          emptyMessage="No hay activos de ejemplo."
          pagination={{
            page,
            pageSize,
            total: SAMPLE_ROWS.length,
            onPageChange: setPage,
          }}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">Modal y formulario</h2>
        {savedName ? (
          <p className="text-sm text-success">Último nombre guardado (demo): {savedName}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={openConfirm}>Abrir confirmación</Button>
          <Button variant="secondary" onClick={openForm}>
            Abrir formulario
          </Button>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === 'confirm' ? 'Confirmar acción' : 'Formulario de ejemplo'}
        size={modalMode === 'form' ? 'lg' : 'sm'}
        footer={
          modalMode === 'confirm' ? (
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setModalOpen(false)}>Confirmar</Button>
            </>
          ) : null
        }
      >
        {modalMode === 'confirm' ? (
          <p className="text-sm text-ink-muted">
            Este modal es genérico. Las páginas de negocio pasarán el texto y las acciones.
          </p>
        ) : (
          <Form onSubmit={handleFormSubmit} error={formError}>
            <FormField label="Nombre" htmlFor="nombre" error={fieldErrors.nombre}>
              <input
                id="nombre"
                name="nombre"
                className={inputClassName}
                aria-invalid={Boolean(fieldErrors.nombre)}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </Form>
        )}
      </Modal>
    </section>
  );
}
