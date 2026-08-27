import { useLocation, useParams } from 'react-router';
import { PageHeader } from '@/shared/components/PageHeader';
import { getPageTitle } from '@/shared/layout/navigation';

export function PlaceholderPage() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <section>
      <PageHeader
        title={title}
        description={
          slug
            ? 'Catálogo reservado. La pantalla genérica de mantenimiento se conectará cuando exista origen de datos.'
            : 'Módulo reservado. Esta plantilla se sustituye cuando el flujo de negocio esté listo.'
        }
      />
      <div className="rounded-lg border border-dashed border-border-strong bg-lavender px-5 py-8 text-sm text-text-muted">
        Ruta activa: <span className="font-mono text-navy">{pathname}</span>
      </div>
    </section>
  );
}
