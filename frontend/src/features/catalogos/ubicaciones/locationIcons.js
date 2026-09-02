import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

if (L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const FILLS = {
  default: '#0c1440',
  hover: '#26a621',
  selected: '#26a621',
  inactive: '#143259',
};

function pinSvg(fill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36" focusable="false">
    <path fill="${fill}" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/>
    <circle cx="12" cy="12" r="4.25" fill="#fdfdff"/>
  </svg>`;
}

function makeIcon(variant, size) {
  const height = Math.round(size * 1.5);
  return L.divIcon({
    className: `ubic-marker${variant === 'inactive' ? ' is-mute' : ''}`,
    html: pinSvg(FILLS[variant] ?? FILLS.default),
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height + 6],
  });
}

export const locationIcons = {
  default: makeIcon('default', 26),
  hover: makeIcon('hover', 30),
  selected: makeIcon('selected', 32),
  inactive: makeIcon('inactive', 26),
};

export function iconForLocation({ habilitado, selected, hovered }) {
  if (!habilitado) return locationIcons.inactive;
  if (selected) return locationIcons.selected;
  if (hovered) return locationIcons.hover;
  return locationIcons.default;
}
