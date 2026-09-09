import fs from 'node:fs';

const iso3 = {
  af: 'afg', al: 'alb', dz: 'dza', as: 'asm', ad: 'and', ao: 'ago', ai: 'aia', aq: 'ata', ag: 'atg', ar: 'arg',
  am: 'arm', aw: 'abw', au: 'aus', at: 'aut', az: 'aze', bs: 'bhs', bh: 'bhr', bd: 'bgd', bb: 'brb', by: 'blr',
  be: 'bel', bz: 'blz', bj: 'ben', bm: 'bmu', bt: 'btn', bo: 'bol', bq: 'bes', ba: 'bih', bw: 'bwa', bv: 'bvt',
  br: 'bra', io: 'iot', bn: 'brn', bg: 'bgr', bf: 'bfa', bi: 'bdi', cv: 'cpv', kh: 'khm', cm: 'cmr', ca: 'can',
  ky: 'cym', cf: 'caf', td: 'tcd', cl: 'chl', cn: 'chn', cx: 'cxr', cc: 'cck', co: 'col', km: 'com', cg: 'cog',
  cd: 'cod', ck: 'cok', cr: 'cri', ci: 'civ', hr: 'hrv', cu: 'cub', cw: 'cuw', cy: 'cyp', cz: 'cze', dk: 'dnk',
  dj: 'dji', dm: 'dma', do: 'dom', ec: 'ecu', eg: 'egy', sv: 'slv', gq: 'gnq', er: 'eri', ee: 'est', sz: 'swz',
  et: 'eth', fk: 'flk', fo: 'fro', fj: 'fji', fi: 'fin', fr: 'fra', gf: 'guf', pf: 'pyf', tf: 'atf', ga: 'gab',
  gm: 'gmb', ge: 'geo', de: 'deu', gh: 'gha', gi: 'gib', gr: 'grc', gl: 'grl', gd: 'grd', gp: 'glp', gu: 'gum',
  gt: 'gtm', gg: 'ggy', gn: 'gin', gw: 'gnb', gy: 'guy', ht: 'hti', hm: 'hmd', va: 'vat', hn: 'hnd', hk: 'hkg',
  hu: 'hun', is: 'isl', in: 'ind', id: 'idn', ir: 'irn', iq: 'irq', ie: 'irl', im: 'imn', il: 'isr', it: 'ita',
  jm: 'jam', jp: 'jpn', je: 'jey', jo: 'jor', kz: 'kaz', ke: 'ken', ki: 'kir', kp: 'prk', kr: 'kor', kw: 'kwt',
  kg: 'kgz', la: 'lao', lv: 'lva', lb: 'lbn', ls: 'lso', lr: 'lbr', ly: 'lby', li: 'lie', lt: 'ltu', lu: 'lux',
  mo: 'mac', mg: 'mdg', mw: 'mwi', my: 'mys', mv: 'mdv', ml: 'mli', mt: 'mlt', mh: 'mhl', mq: 'mtq', mr: 'mrt',
  mu: 'mus', yt: 'myt', mx: 'mex', fm: 'fsm', md: 'mda', mc: 'mco', mn: 'mng', me: 'mne', ms: 'msr', ma: 'mar',
  mz: 'moz', mm: 'mmr', na: 'nam', nr: 'nru', np: 'npl', nl: 'nld', nc: 'ncl', nz: 'nzl', ni: 'nic', ne: 'ner',
  ng: 'nga', nu: 'niu', nf: 'nfk', mk: 'mkd', mp: 'mnp', no: 'nor', om: 'omn', pk: 'pak', pw: 'plw', ps: 'pse',
  pa: 'pan', pg: 'png', py: 'pry', pe: 'per', ph: 'phl', pn: 'pcn', pl: 'pol', pt: 'prt', pr: 'pri', qa: 'qat',
  re: 'reu', ro: 'rou', ru: 'rus', rw: 'rwa', bl: 'blm', sh: 'shn', kn: 'kna', lc: 'lca', mf: 'maf', pm: 'spm',
  vc: 'vct', ws: 'wsm', sm: 'smr', st: 'stp', sa: 'sau', sn: 'sen', rs: 'srb', sc: 'syc', sl: 'sle', sg: 'sgp',
  sx: 'sxm', sk: 'svk', si: 'svn', sb: 'slb', so: 'som', za: 'zaf', gs: 'sgs', ss: 'ssd', es: 'esp', lk: 'lka',
  sd: 'sdn', sr: 'sur', sj: 'sjm', se: 'swe', ch: 'che', sy: 'syr', tw: 'twn', tj: 'tjk', tz: 'tza', th: 'tha',
  tl: 'tls', tg: 'tgo', tk: 'tkl', to: 'ton', tt: 'tto', tn: 'tun', tr: 'tur', tm: 'tkm', tc: 'tca', tv: 'tuv',
  ug: 'uga', ua: 'ukr', ae: 'are', gb: 'gbr', us: 'usa', um: 'umi', uy: 'ury', uz: 'uzb', vu: 'vut', ve: 'ven',
  vn: 'vnm', vg: 'vgb', vi: 'vir', wf: 'wlf', eh: 'esh', ye: 'yem', zm: 'zmb', zw: 'zwe', xk: 'xkx',
};

const calling = {
  af: 93, al: 355, dz: 213, as: 1, ad: 376, ao: 244, ai: 1, ag: 1, ar: 54, am: 374, aw: 297, au: 61, at: 43,
  az: 994, bs: 1, bh: 973, bd: 880, bb: 1, by: 375, be: 32, bz: 501, bj: 229, bm: 1, bt: 975, bo: 591, ba: 387,
  bw: 267, br: 55, io: 246, vg: 1, bn: 673, bg: 359, bf: 226, bi: 257, kh: 855, cm: 237, ca: 1, cv: 238, ky: 1,
  cf: 236, td: 235, cl: 56, cn: 86, cx: 61, cc: 61, co: 57, km: 269, cg: 242, cd: 243, ck: 682, cr: 506, ci: 225,
  hr: 385, cu: 53, cw: 599, cy: 357, cz: 420, dk: 45, dj: 253, dm: 1, do: 1, ec: 593, eg: 20, sv: 503, gq: 240,
  er: 291, ee: 372, sz: 268, et: 251, fk: 500, fo: 298, fj: 679, fi: 358, fr: 33, gf: 594, pf: 689, ga: 241,
  gm: 220, ge: 995, de: 49, gh: 233, gi: 350, gr: 30, gl: 299, gd: 1, gp: 590, gu: 1, gt: 502, gg: 44, gn: 224,
  gw: 245, gy: 592, ht: 509, hn: 504, hk: 852, hu: 36, is: 354, in: 91, id: 62, ir: 98, iq: 964, ie: 353, im: 44,
  il: 972, it: 39, jm: 1, jp: 81, je: 44, jo: 962, kz: 7, ke: 254, ki: 686, xk: 383, kw: 965, kg: 996, la: 856,
  lv: 371, lb: 961, ls: 266, lr: 231, ly: 218, li: 423, lt: 370, lu: 352, mo: 853, mg: 261, mw: 265, my: 60,
  mv: 960, ml: 223, mt: 356, mh: 692, mq: 596, mr: 222, mu: 230, yt: 262, mx: 52, fm: 691, md: 373, mc: 377,
  mn: 976, me: 382, ms: 1, ma: 212, mz: 258, mm: 95, na: 264, nr: 674, np: 977, nl: 31, nc: 687, nz: 64, ni: 505,
  ne: 227, ng: 234, nu: 683, nf: 672, kp: 850, mk: 389, mp: 1, no: 47, om: 968, pk: 92, pw: 680, ps: 970, pa: 507,
  pg: 675, py: 595, pe: 51, ph: 63, pl: 48, pt: 351, pr: 1, qa: 974, re: 262, ro: 40, ru: 7, rw: 250, ws: 685,
  sm: 378, st: 239, sa: 966, sn: 221, rs: 381, sc: 248, sl: 232, sg: 65, sx: 1, sk: 421, si: 386, sb: 677, so: 252,
  za: 27, kr: 82, ss: 211, es: 34, lk: 94, sd: 249, sr: 597, sj: 47, se: 46, ch: 41, sy: 963, tw: 886, tj: 992,
  tz: 255, th: 66, tl: 670, tg: 228, tk: 690, to: 676, tt: 1, tn: 216, tr: 90, tm: 993, tc: 1, tv: 688, ug: 256,
  ua: 380, ae: 971, gb: 44, us: 1, uy: 598, uz: 998, vu: 678, va: 39, ve: 58, vn: 84, vi: 1, wf: 681, eh: 212,
  ye: 967, zm: 260, zw: 263,
};

const nombres = {
  af: 'Afganistán', al: 'Albania', dz: 'Argelia', as: 'Samoa Americana', ad: 'Andorra', ao: 'Angola', ai: 'Anguila',
  aq: 'Antártida', ag: 'Antigua y Barbuda', ar: 'Argentina', am: 'Armenia', aw: 'Aruba', au: 'Australia',
  at: 'Austria', az: 'Azerbaiyán', bs: 'Bahamas', bh: 'Baréin', bd: 'Bangladés', bb: 'Barbados', by: 'Belarús',
  be: 'Bélgica', bz: 'Belice', bj: 'Benín', bm: 'Bermudas', bt: 'Bután', bo: 'Bolivia', bq: 'Caribe Neerlandés',
  ba: 'Bosnia y Herzegovina', bw: 'Botsuana', bv: 'Isla Bouvet', br: 'Brasil', io: 'Territorio Británico del Océano Índico',
  bn: 'Brunéi', bg: 'Bulgaria', bf: 'Burkina Faso', bi: 'Burundi', cv: 'Cabo Verde', kh: 'Camboya', cm: 'Camerún',
  ca: 'Canadá', ky: 'Islas Caimán', cf: 'República Centroafricana', td: 'Chad', cl: 'Chile', cn: 'China',
  cx: 'Isla de Navidad', cc: 'Islas Cocos', co: 'Colombia', km: 'Comoras', cg: 'Congo', cd: 'Congo (RDC)',
  ck: 'Islas Cook', cr: 'Costa Rica', ci: "Côte d'Ivoire", hr: 'Croacia', cu: 'Cuba', cw: 'Curazao', cy: 'Chipre',
  cz: 'Chequia', dk: 'Dinamarca', dj: 'Yibuti', dm: 'Dominica', do: 'República Dominicana', ec: 'Ecuador',
  eg: 'Egipto', sv: 'El Salvador', gq: 'Guinea Ecuatorial', er: 'Eritrea', ee: 'Estonia', sz: 'Esuatini',
  et: 'Etiopía', fk: 'Islas Malvinas', fo: 'Islas Feroe', fj: 'Fiyi', fi: 'Finlandia', fr: 'Francia',
  gf: 'Guayana Francesa', pf: 'Polinesia Francesa', tf: 'Territorios Australes Franceses', ga: 'Gabón',
  gm: 'Gambia', ge: 'Georgia', de: 'Alemania', gh: 'Ghana', gi: 'Gibraltar', gr: 'Grecia', gl: 'Groenlandia',
  gd: 'Granada', gp: 'Guadalupe', gu: 'Guam', gt: 'Guatemala', gg: 'Guernsey', gn: 'Guinea', gw: 'Guinea-Bisáu',
  gy: 'Guyana', ht: 'Haití', hm: 'Islas Heard y McDonald', va: 'Ciudad del Vaticano', hn: 'Honduras',
  hk: 'Hong Kong', hu: 'Hungría', is: 'Islandia', in: 'India', id: 'Indonesia', ir: 'Irán', iq: 'Irak',
  ie: 'Irlanda', im: 'Isla de Man', il: 'Israel', it: 'Italia', jm: 'Jamaica', jp: 'Japón', je: 'Jersey',
  jo: 'Jordania', kz: 'Kazajistán', ke: 'Kenia', ki: 'Kiribati', kp: 'Corea del Norte', kr: 'Corea del Sur',
  kw: 'Kuwait', kg: 'Kirguistán', la: 'Laos', lv: 'Letonia', lb: 'Líbano', ls: 'Lesoto', lr: 'Liberia',
  ly: 'Libia', li: 'Liechtenstein', lt: 'Lituania', lu: 'Luxemburgo', mo: 'Macao', mg: 'Madagascar',
  mw: 'Malaui', my: 'Malasia', mv: 'Maldivas', ml: 'Malí', mt: 'Malta', mh: 'Islas Marshall', mq: 'Martinica',
  mr: 'Mauritania', mu: 'Mauricio', yt: 'Mayotte', mx: 'México', fm: 'Micronesia', md: 'Moldavia', mc: 'Mónaco',
  mn: 'Mongolia', me: 'Montenegro', ms: 'Montserrat', ma: 'Marruecos', mz: 'Mozambique', mm: 'Myanmar',
  na: 'Namibia', nr: 'Nauru', np: 'Nepal', nl: 'Países Bajos', nc: 'Nueva Caledonia', nz: 'Nueva Zelanda',
  ni: 'Nicaragua', ne: 'Níger', ng: 'Nigeria', nu: 'Niue', nf: 'Isla Norfolk', mk: 'Macedonia del Norte',
  mp: 'Islas Marianas del Norte', no: 'Noruega', om: 'Omán', pk: 'Pakistán', pw: 'Palaos', ps: 'Palestina',
  pa: 'Panamá', pg: 'Papúa Nueva Guinea', py: 'Paraguay', pe: 'Perú', ph: 'Filipinas', pn: 'Pitcairn',
  pl: 'Polonia', pt: 'Portugal', pr: 'Puerto Rico', qa: 'Catar', re: 'Reunión', ro: 'Rumania', ru: 'Rusia',
  rw: 'Ruanda', bl: 'San Bartolomé', sh: 'Santa Elena', kn: 'San Cristóbal y Nieves', lc: 'Santa Lucía',
  mf: 'San Martín', pm: 'San Pedro y Miquelón', vc: 'San Vicente y las Granadinas', ws: 'Samoa',
  sm: 'San Marino', st: 'Santo Tomé y Príncipe', sa: 'Arabia Saudita', sn: 'Senegal', rs: 'Serbia',
  sc: 'Seychelles', sl: 'Sierra Leona', sg: 'Singapur', sx: 'Sint Maarten', sk: 'Eslovaquia', si: 'Eslovenia',
  sb: 'Islas Salomón', so: 'Somalia', za: 'Sudáfrica', gs: 'Georgia del Sur', ss: 'Sudán del Sur', es: 'España',
  lk: 'Sri Lanka', sd: 'Sudán', sr: 'Surinam', sj: 'Svalbard y Jan Mayen', se: 'Suecia', ch: 'Suiza', sy: 'Siria',
  tw: 'Taiwán', tj: 'Tayikistán', tz: 'Tanzania', th: 'Tailandia', tl: 'Timor-Leste', tg: 'Togo', tk: 'Tokelau',
  to: 'Tonga', tt: 'Trinidad y Tobago', tn: 'Túnez', tr: 'Turquía', tm: 'Turkmenistán', tc: 'Islas Turcas y Caicos',
  tv: 'Tuvalu', ug: 'Uganda', ua: 'Ucrania', ae: 'Emiratos Árabes Unidos', gb: 'Reino Unido', us: 'Estados Unidos',
  um: 'Islas menores de EE. UU.', uy: 'Uruguay', uz: 'Uzbekistán', vu: 'Vanuatu', ve: 'Venezuela', vn: 'Vietnam',
  vi: 'Islas Vírgenes de EE. UU.', wf: 'Wallis y Futuna', eh: 'Sáhara Occidental', ye: 'Yemen', zm: 'Zambia',
  zw: 'Zimbabue', xk: 'Kosovo',
};

const digitos = {
  gt: [8, 8], sv: [8, 8], hn: [8, 8], ni: [8, 8], cr: [8, 8], pa: [7, 8], bz: [7, 7], mx: [10, 10], us: [10, 10],
  ca: [10, 10], co: [10, 10], cl: [9, 9], ar: [10, 10], pe: [9, 9], ec: [9, 9], bo: [8, 8], py: [9, 9], uy: [8, 8],
  ve: [10, 10], br: [10, 11], es: [9, 9], do: [10, 10], pr: [10, 10], cu: [8, 8], gb: [10, 10], fr: [9, 9],
  de: [10, 11], it: [9, 10], pt: [9, 9],
};

const rows = Object.keys(iso3)
  .filter((c2) => calling[c2] != null && nombres[c2])
  .sort((a, b) => nombres[a].localeCompare(nombres[b], 'es'))
  .map((c2) => {
    const d = digitos[c2] || [7, 15];
    return {
      nombre: nombres[c2],
      codigoIso2: c2,
      codigoIso3: iso3[c2],
      codigoTelefonico: `+${calling[c2]}`,
      digitos: { min: d[0], max: d[1] },
    };
  });

const chile = rows.find((p) => p.codigoIso2 === 'cl');
const body = `/** Catálogo ISO 3166 mundial (nombres en español) + código telefónico ITU. */\nexport const PAISES_ISO_ROWS = ${JSON.stringify(rows)};\n`;
fs.writeFileSync(new URL('../src/shared/validation/paisesIso.data.js', import.meta.url), body);
console.log('countries', rows.length, 'chile', chile);
