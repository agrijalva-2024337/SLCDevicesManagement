export const headerNav = [
  { id: 'plataforma', label: 'Plataforma' },
  { id: 'soporte', label: 'Soporte' },
];

export const heroContent = {
  marca: 'SLC Devices Management',
  ctaPrimario: 'Comenzar ahora',
  ctaSecundario: 'Ver demo de la plataforma',
};

export const footerContent = {
  wordmark: 'SLCDM',
  descripcion:
    'Inventario de activos multiempresa para Sistemas Logísticos y Corporativos, S.A. Un solo resguardo para el ciclo de vida del equipo.',
  cta: 'Entrar a la plataforma',
  copyright: '© 2026 Sistemas Logísticos y Corporativos, S.A.',
  legal: 'Uso interno · Inventario corporativo de dispositivos',
  columnas: [
    {
      titulo: 'Plataforma',
      enlaces: [
        { label: 'Capacidades', href: '#plataforma' },
        { label: 'Soporte de TI', href: '#soporte' },
        { label: 'Panel de control', href: '/app' },
      ],
    },
    {
      titulo: 'Acceso',
      enlaces: [
        { label: 'Iniciar sesión', href: '/login' },
        { label: 'Ver demo', href: '/app' },
        { label: 'Volver al inicio', href: '#inicio' },
      ],
    },
    {
      titulo: 'Contacto TI',
      enlaces: [
        { label: 'ti@slc.example', href: 'mailto:ti@slc.example' },
        { label: '+502 0000 0000', href: 'tel:+50200000000' },
        { label: 'Lun–Vie, 8:00 a 17:00', href: '#soporte' },
      ],
    },
  ],
};

export const soporteContent = {
  kicker: 'Acompañamiento',
  titulo: 'Soporte del área de TI',
  descripcion:
    'El equipo de tecnología de SLC acompaña el resguardo del inventario corporativo. Escríbanos para altas de usuario, incidencias o capacitación.',
  cta: 'Iniciar sesión',
  contactos: [
    { label: 'Correo', valor: 'ti@slc.example', href: 'mailto:ti@slc.example' },
    { label: 'Teléfono', valor: '+502 0000 0000', href: 'tel:+50200000000' },
    { label: 'Horario', valor: 'Lunes a viernes, 8:00 a 17:00' },
  ],
};
