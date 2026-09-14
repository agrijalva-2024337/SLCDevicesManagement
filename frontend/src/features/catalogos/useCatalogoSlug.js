import { useLocation, useParams } from 'react-router';

/** Resuelve el slug del catálogo aunque la ruta sea fija (`catalogos/usuarios`) o `:slug`. */
export function useCatalogoSlug() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  if (slug) return slug;
  const match = pathname.match(/\/catalogos\/([^/]+)/);
  return match?.[1] ?? null;
}
