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
import { CategoriaForm } from '@/features/catalogos/categorias/CategoriaForm';
import * as categoriaService from '@/features/catalogos/categorias/categoriaService';

const EMPTY_CATEGORIA = {
  nombre: '',
  descripcion: '',
};

function toCategoriaFormValues(row) {
  return {
    nombre: row.nombre ?? '',
    descripcion: row.descripcion ?? '',
  };
}

export function CategoriasPage() {
  const { visibleRows, isLoading, errorMessage, filter, setFilter, banner, setBanner, reload } =
    useCatalogCollection(categoriaService.getAll);
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
    if (!saving) {
      setFormOpen(false);
      setEditing(null);
    }
  }

  async function handleSave(values) {
    setSaving(true);

    try {
      if (editing) {
        await categoriaService.update(editing.id, { ...editing, ...values });
        setBanner({ variant: 'success', message: 'La categoría se actualizó correctamente.' });
      } else {
        await categoriaService.create({ ...values, habilitado: true });
        setBanner({ variant: 'success', message: 'La categoría se creó correctamente.' });
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
        await categoriaService.remove(confirmRow.id);
        setBanner({ variant: 'success', message: 'La categoría se inactivó correctamente.' });
      } else {
        await categoriaService.update(confirmRow.id, { ...confirmRow, habilitado: true });
        setBanner({ variant: 'success', message: 'La categoría se reactivó correctamente.' });
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
    { key: 'descripcion', header: 'Descripción' },
    { key: 'habilitado', header: 'Estado', type: 'status' },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Categorías de activo"
        description="Clasificación de activos para inventario y reportes."
        actions={<RegisterButton onClick={openCreate} label="Registrar categoría" />}
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
          emptyTitle="No hay categorías"
          emptyDescription="No hay categorías para mostrar."
          searchPlaceholder="Buscar categorías..."
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
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
      >
        <CategoriaForm
          key={editing ? `edit-${editing.id}` : 'new'}
          initialValues={editing ? toCategoriaFormValues(editing) : EMPTY_CATEGORIA}
          onSubmit={handleSave}
          onCancel={closeForm}
          isSubmitting={saving}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmRow)}
        onClose={() => (confirming ? null : setConfirmRow(null))}
        onConfirm={handleConfirm}
        title={confirmRow?.habilitado ? 'Inactivar categoría' : 'Reactivar categoría'}
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
