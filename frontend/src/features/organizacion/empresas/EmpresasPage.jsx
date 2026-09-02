import { useState } from 'react';
import { AlertBanner } from '@/shared/components/AlertBanner';
import { CatalogRowActions } from '@/shared/components/CatalogRowActions';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DataTable } from '@/shared/components/DataTable';
import { FeedbackState } from '@/shared/components/FeedbackState';
import { HabilitadoFilter } from '@/shared/components/HabilitadoFilter';
import { Modal } from '@/shared/components/Modal';
import { PageHeader } from '@/shared/components/PageHeader';
import { RegisterButton } from '@/shared/components/RecordActions';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import { EmpresaForm } from '@/features/organizacion/empresas/EmpresaForm';
import * as empresaService from '@/features/organizacion/empresas/empresaService';

const EMPTY_EMPRESA = {
  nombre: '',
  nitCodigo: '',
  direccion: '',
  telefono: '',
};

function toEmpresaFormValues(row) {
  return {
    nombre: row.nombre ?? '',
    nitCodigo: row.nitCodigo ?? '',
    direccion: row.direccion ?? '',
    telefono: row.telefono ?? '',
  };
}

export function EmpresasPage() {
  const { visibleRows, isLoading, errorMessage, filter, setFilter, banner, setBanner, reload } =
    useCatalogCollection(empresaService.getAll);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirming, setConfirming] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditing(null);
  }

  async function handleSave(values) {
    setSaving(true);

    try {
      if (editing) {
        await empresaService.update(editing.id, { ...editing, ...values });
        setBanner({ variant: 'success', message: 'La empresa se actualizó correctamente.' });
      } else {
        await empresaService.create({ ...values, habilitado: true });
        setBanner({ variant: 'success', message: 'La empresa se creó correctamente.' });
      }

      setFormOpen(false);
      setEditing(null);
      await reload();
    } catch (error) {
      setBanner({ variant: 'error', message: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    if (!confirmRow) {
      return;
    }

    setConfirming(true);

    try {
      if (confirmRow.habilitado) {
        await empresaService.remove(confirmRow.id);
        setBanner({ variant: 'success', message: 'La empresa se inactivó correctamente.' });
      } else {
        await empresaService.update(confirmRow.id, { ...confirmRow, habilitado: true });
        setBanner({ variant: 'success', message: 'La empresa se reactivó correctamente.' });
      }

      setConfirmRow(null);
      await reload();
    } catch (error) {
      setBanner({ variant: 'error', message: getErrorMessage(error) });
    } finally {
      setConfirming(false);
    }
  }

  const columns = [
    { key: 'nombre', header: 'Nombre', primary: true },
    { key: 'nitCodigo', header: 'NIT / código' },
    { key: 'direccion', header: 'Dirección' },
    { key: 'telefono', header: 'Teléfono' },
    { key: 'habilitado', header: 'Estado', type: 'status' },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Empresas"
        description="Catálogo de empresas del grupo. Los cambios de esta sesión viven en memoria (modo mock)."
        actions={<RegisterButton onClick={openCreate} label="Registrar empresa" />}
      />

      {banner ? (
        <AlertBanner
          variant={banner.variant}
          message={banner.message}
          onDismiss={() => setBanner(null)}
        />
      ) : null}

      <HabilitadoFilter value={filter} onChange={setFilter} />

      {errorMessage ? (
        <FeedbackState status="error" errorMessage={errorMessage} />
      ) : (
        <DataTable
          columns={columns}
          rows={visibleRows}
          loading={isLoading}
          emptyTitle="No hay empresas"
          emptyDescription="No hay empresas para mostrar."
          searchPlaceholder="Buscar empresas..."
          getRowActions={(row) => ({
            view: { onClick: () => openEdit(row) },
            edit: { onClick: () => openEdit(row) },
          })}
          renderExpandedContent={(row) => (
            <CatalogRowActions
              row={row}
              onEdit={openEdit}
              onInactivate={setConfirmRow}
              onReactivate={setConfirmRow}
            />
          )}
        />
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? 'Editar empresa' : 'Nueva empresa'}
      >
        <EmpresaForm
          key={editing ? `edit-${editing.id}` : 'new'}
          initialValues={editing ? toEmpresaFormValues(editing) : EMPTY_EMPRESA}
          onSubmit={handleSave}
          onCancel={closeForm}
          isSubmitting={saving}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmRow)}
        onClose={() => (confirming ? null : setConfirmRow(null))}
        onConfirm={handleConfirm}
        title={confirmRow?.habilitado ? 'Inactivar empresa' : 'Reactivar empresa'}
        message={
          confirmRow?.habilitado
            ? `¿Inactivar "${confirmRow?.nombre}"? El registro seguirá visible como inactivo.`
            : `¿Reactivar "${confirmRow?.nombre}"?`
        }
        confirmLabel={confirmRow?.habilitado ? 'Inactivar' : 'Reactivar'}
        variant={confirmRow?.habilitado ? 'danger' : 'primary'}
        isConfirming={confirming}
      />
    </section>
  );
}
