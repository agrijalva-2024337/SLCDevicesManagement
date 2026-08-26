import { PageHeader } from '@/shared/components/PageHeader';

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.description]
 */
export function PlaceholderPage({ title, description }) {
  return (
    <section>
      <PageHeader
        title={title}
        description={
          description ||
          'Módulo pendiente. Las pantallas de negocio se implementan en sprints posteriores.'
        }
      />
      <div className="rounded-md border border-dashed border-line bg-surface-raised px-4 py-10 text-center text-sm text-ink-muted">
        Sin contenido todavía.
      </div>
    </section>
  );
}
