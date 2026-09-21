import { triggerBlobDownload } from '@/shared/utils/downloadFile';

const SLC = {
  navy: 'FF0C1440',
  navyMid: 'FF143259',
  lavender: 'FFDADDFA',
  white: 'FFFDFDFF',
  accent: 'FF26A621',
  even: 'FFE8EAF8',
  grid: 'FFC9CDE8',
};

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[index] = crc >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function u32(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function zipStore(files) {
  const encoder = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = file.data;
    const crc = crc32(data);
    const local = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      data,
    ]);
    locals.push(local);
    centrals.push(
      concatBytes([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBytes,
      ]),
    );
    offset += local.length;
  }

  const centralDir = concatBytes(centrals);
  return concatBytes([
    ...locals,
    centralDir,
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ]);
}

function stripXmlControls(value) {
  let next = '';
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) continue;
    next += char;
  }
  return next;
}

function xmlEscape(value) {
  return stripXmlControls(String(value ?? ''))
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function sheetNameOf(name) {
  const cleaned = String(name ?? 'Registros')
    .replace(/[:\\/?*[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || 'Registros').slice(0, 31);
}

export function excelFilename(name) {
  const base =
    String(name ?? 'registros')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'registros';
  const date = new Date().toISOString().slice(0, 10);
  return `${base}-${date}.xlsx`;
}

export function withXlsxExtension(name, fallback = 'registros.xlsx') {
  const raw = String(name ?? '').trim() || fallback;
  return `${raw.replace(/\.xlsx?$/i, '')}.xlsx`;
}

function colLetter(index) {
  let next = index + 1;
  let label = '';
  while (next > 0) {
    const rem = (next - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    next = Math.floor((next - 1) / 26);
  }
  return label;
}

function cellRef(columnIndex, rowNumber) {
  return `${colLetter(columnIndex)}${rowNumber}`;
}

function cellKind(column, raw) {
  if (raw == null || raw === '') return { type: 'String', text: '' };
  if (typeof raw === 'boolean') {
    return { type: 'String', text: raw ? 'Habilitado' : 'Deshabilitado' };
  }
  if (column.numeric || typeof raw === 'number') {
    const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.-]/g, ''));
    if (Number.isFinite(n) && String(raw).trim() !== '' && !String(raw).includes('Q')) {
      return { type: 'Number', text: String(n) };
    }
  }
  return { type: 'String', text: String(raw) };
}

function columnWidth(header, rows, index) {
  let max = String(header ?? '').length;
  for (const row of rows) {
    max = Math.max(max, String(row[index]?.text ?? '').length);
  }
  return Math.min(56, Math.max(12, max + 3));
}

function inlineCell(ref, style, cell) {
  if (cell.type === 'Number') {
    return `<c r="${ref}" s="${style}"><v>${xmlEscape(cell.text)}</v></c>`;
  }
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(cell.text)}</t></is></c>`;
}

function textCell(ref, style, text) {
  return inlineCell(ref, style, { type: 'String', text });
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="#,##0.00"/>
  </numFmts>
  <fonts count="5">
    <font><sz val="11"/><color rgb="${SLC.navy}"/><name val="Calibri"/></font>
    <font><b/><sz val="16"/><color rgb="${SLC.white}"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="${SLC.white}"/><name val="Calibri"/></font>
    <font><b/><sz val="9"/><color rgb="${SLC.white}"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="${SLC.navy}"/><name val="Calibri"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="${SLC.navy}"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="${SLC.navyMid}"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="${SLC.white}"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="${SLC.even}"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="${SLC.lavender}"/></patternFill></fill>
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <right style="thin"><color rgb="${SLC.navyMid}"/></right>
      <bottom style="medium"><color rgb="${SLC.accent}"/></bottom>
    </border>
    <border>
      <bottom style="thin"><color rgb="${SLC.grid}"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="4" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="5" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="6" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;
}

function sheetXml({ title, exportedAt, headers, prepared }) {
  const colCount = Math.max(1, headers.length);
  const lastCol = colLetter(colCount - 1);
  const footerRow = prepared.length + 4;
  const merge =
    colCount > 1
      ? `<mergeCells count="3"><mergeCell ref="A1:${lastCol}1"/><mergeCell ref="A2:${lastCol}2"/><mergeCell ref="A${footerRow}:${lastCol}${footerRow}"/></mergeCells>`
      : '';

  const cols = headers
    .map((header, index) => {
      const width = columnWidth(header, prepared, index);
      return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
    })
    .join('');

  const headerCells = headers
    .map((header, index) => textCell(cellRef(index, 3), 3, String(header).toUpperCase()))
    .join('');

  const body = prepared
    .map((cells, rowIndex) => {
      const even = rowIndex % 2 === 1;
      const rowNumber = rowIndex + 4;
      const xml = cells
        .map((cell, columnIndex) => {
          const style =
            cell.type === 'Number' ? (even ? 7 : 6) : even ? 5 : 4;
          return inlineCell(cellRef(columnIndex, rowNumber), style, cell);
        })
        .join('');
      return `<row r="${rowNumber}" ht="18" customHeight="1">${xml}</row>`;
    })
    .join('');

  const countLabel = `${prepared.length} ${prepared.length === 1 ? 'registro' : 'registros'}`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${cols}</cols>
  <sheetData>
    <row r="1" ht="28" customHeight="1">${textCell('A1', 1, title)}</row>
    <row r="2" ht="18" customHeight="1">${textCell('A2', 2, `Exportado ${exportedAt} · SLC Devices Management`)}</row>
    <row r="3" ht="22" customHeight="1">${headerCells}</row>
    ${body}
    <row r="${footerRow}" ht="20" customHeight="1">${textCell(`A${footerRow}`, 8, countLabel)}</row>
  </sheetData>
  ${merge}
</worksheet>`;
}

function workbookXml(sheetName) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function workbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function corePropsXml(title, isoDate) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xmlEscape(title)}</dc:title>
  <dc:creator>SLC Devices Management</dc:creator>
  <cp:lastModifiedBy>SLC Devices Management</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${isoDate}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${isoDate}</dcterms:modified>
</cp:coreProperties>`;
}

function appPropsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>SLC Devices Management</Application>
</Properties>`;
}

function utf8(text) {
  return new TextEncoder().encode(text);
}

/**
 * Office Open XML (.xlsx) con la paleta SLC de las tablas: navy, accent y lavender.
 */
export function exportStyledExcel({
  title = 'Registros',
  sheetName,
  filename,
  columns = [],
  rows = [],
} = {}) {
  const headers = columns.map((column) => column.header ?? column.key ?? '');
  const prepared = rows.map((row) =>
    columns.map((column) => {
      const raw = typeof column.getValue === 'function' ? column.getValue(row) : row[column.key];
      return cellKind(column, raw);
    }),
  );

  const now = new Date();
  const exportedAt = new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  const bytes = zipStore([
    { name: '[Content_Types].xml', data: utf8(contentTypesXml()) },
    { name: '_rels/.rels', data: utf8(rootRelsXml()) },
    { name: 'docProps/core.xml', data: utf8(corePropsXml(title, now.toISOString())) },
    { name: 'docProps/app.xml', data: utf8(appPropsXml()) },
    { name: 'xl/workbook.xml', data: utf8(workbookXml(sheetNameOf(sheetName ?? title))) },
    { name: 'xl/_rels/workbook.xml.rels', data: utf8(workbookRelsXml()) },
    { name: 'xl/styles.xml', data: utf8(stylesXml()) },
    {
      name: 'xl/worksheets/sheet1.xml',
      data: utf8(sheetXml({ title, exportedAt, headers, prepared })),
    },
  ]);

  const blob = new Blob([bytes], { type: XLSX_MIME });
  triggerBlobDownload(blob, withXlsxExtension(filename || excelFilename(title)));
}
