import { Button } from '@/shared/components/Button';

export function CatalogRowActions({ row, onEdit, onInactivate, onReactivate }) {
  return (
    <div className="flex flex-wrap justify-end gap-1" onClick={(event) => event.stopPropagation()}>
      <Button variant="ghost" onClick={() => onEdit(row)}>
        Editar
      </Button>
      {row.habilitado ? (
        <Button variant="danger" onClick={() => onInactivate(row)}>
          Inactivar
        </Button>
      ) : (
        <Button variant="secondary" onClick={() => onReactivate(row)}>
          Reactivar
        </Button>
      )}
    </div>
  );
}
