import { useState } from 'react';
import { AlertBanner } from '@/shared/components/AlertBanner';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { CatalogRowActions } from '@/shared/components/CatalogRowActions';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DataTable } from '@/shared/components/DataTable';
import { HabilitadoFilter } from '@/shared/components/HabilitadoFilter';
import { Modal } from '@/shared/components/Modal';
import { PageHeader } from '@/shared/components/PageHeader';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import {
  EMPTY_UBICACION,
  toUbicacionFormValues,
  UbicacionForm,
} from '@/features/catalogos/ubicaciones/UbicacionForm';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';

export function UbicacionesPage() {
  const { visibleRows, isLoading, errorMessage, filter, setFilter, banner, setBanner, reload } =
    useCatalogCollection(ubicacionService.getAll);
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
      const payload = {
        ...values,
        latitud: Number(values.latitud),
        longitud: Number(values.longitud),
      };

      if (editing) {
        await ubicacionService.update(editing.id, { ...editing, ...payload });
        setBanner({ variant: 'success', message: 'La ubicación se actualizó correctamente.' });
      } else {
        await ubicacionService.create({ ...payload, habilitado: true });
        setBanner({ variant: 'success', message: 'La ubicación se creó correctamente.' });
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
        await ubicacionService.remove(confirmRow.id);
        setBanner({ variant: 'success', message: 'La ubicación se inactivó correctamente.' });
      } else {
        await ubicacionService.update(confirmRow.id, { ...confirmRow, habilitado: true });
        setBanner({ variant: 'success', message: 'La ubicación se reactivó correctamente.' });
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
    { key: 'nombre', header: 'Nombre' },
    { key: 'descripcion', header: 'Descripción' },
    { key: 'latitud', header: 'Latitud', align: 'right' },
    { key: 'longitud', header: 'Longitud', align: 'right' },
    {
      key: 'habilitado',
      header: 'Estado',
      render: (row) => (
        <Badge variant={row.habilitado ? 'success' : 'ghost'}>
          {row.habilitado ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      sortable: false,
      render: (row) => (
        <CatalogRowActions
          row={row}
          onEdit={openEdit}
          onInactivate={setConfirmRow}
          onReactivate={setConfirmRow}
        />
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Ubicaciones"
        description="Puntos geográficos de resguardo o operación de activos."
        actions={
          <Button onClick={openCreate} type="button">
            Nueva
          </Button>
        }
      />

      {banner ? (
        <AlertBanner
          variant={banner.variant}
          message={banner.message}
          onDismiss={() => setBanner(null)}
        />
      ) : null}

      <HabilitadoFilter value={filter} onChange={setFilter} />

      <DataTable
        columns={columns}
        rows={visibleRows}
        isLoading={isLoading}
        errorMessage={errorMessage}
        emptyMessage="No hay ubicaciones para mostrar."
        searchPlaceholder="Buscar ubicaciones..."
        rowClassName={(row) => (row.habilitado ? '' : 'bg-slate-50 opacity-70')}
      />

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? 'Editar ubicación' : 'Nueva ubicación'}
      >
        <UbicacionForm
          key={editing ? `edit-${editing.id}` : 'new'}
          initialValues={editing ? toUbicacionFormValues(editing) : EMPTY_UBICACION}
          onSubmit={handleSave}
          onCancel={closeForm}
          isSubmitting={saving}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmRow)}
        onClose={() => (confirming ? null : setConfirmRow(null))}
        onConfirm={handleConfirm}
        title={confirmRow?.habilitado ? 'Inactivar ubicación' : 'Reactivar ubicación'}
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
