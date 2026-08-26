import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';

export function ForbiddenPage() {
  return (
    <section>
      <PageHeader
        title="Sin acceso"
        description="Este perfil simulado no puede entrar a esa sección. Cambia el perfil en el header o vuelve al inicio."
      />
      <Link to="/" className="text-sm font-medium text-brand underline underline-offset-2">
        Volver al inicio
      </Link>
    </section>
  );
}
