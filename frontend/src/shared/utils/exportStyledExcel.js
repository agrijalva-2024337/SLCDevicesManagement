import { triggerBlobDownload } from '@/shared/utils/downloadFile';

const SLC = {
  navy: '#0C1440',
  navyMid: '#143259',
  lavender: '#DADDFA',
  white: '#FDFDFF',
  accent: '#26A621',
  even: '#E8EAF8',
  grid: '#C9CDE8',
};

function xmlEscape(value) {
  return String(value ?? '')
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
  return `${base}-${date}.xls`;
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
    const value = row[index]?.text ?? '';
    max = Math.max(max, String(value).length);
  }
  return Math.min(56, Math.max(12, max + 3)) * 7;
}

function dataCell(style, type, text) {
  return `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${xmlEscape(text)}</Data></Cell>`;
}

/**
 * Excel 2003 XML (.xls) con la paleta SLC de las tablas: navy, accent y lavender.
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

  const colCount = Math.max(1, headers.length);
  const merge = Math.max(0, colCount - 1);
  const exportedAt = new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const columnXml = headers
    .map((header, index) => `<Column ss:AutoFitWidth="0" ss:Width="${columnWidth(header, prepared, index)}"/>`)
    .join('');

  const headerCells = headers
    .map((header) => dataCell('Header', 'String', String(header).toUpperCase()))
    .join('');

  const body = prepared
    .map((cells, index) => {
      const even = index % 2 === 1;
      const xml = cells
        .map((cell) => {
          const style =
            cell.type === 'Number' ? (even ? 'EvenNum' : 'OddNum') : even ? 'Even' : 'Odd';
          return dataCell(style, cell.type, cell.text);
        })
        .join('');
      return `<Row ss:AutoFitHeight="1">${xml}</Row>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${xmlEscape(title)}</Title>
  <Author>SLC Devices Management</Author>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="${SLC.navy}"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="${SLC.white}"/>
   <Interior ss:Color="${SLC.navy}" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Meta">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="${SLC.white}"/>
   <Interior ss:Color="${SLC.navyMid}" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="${SLC.white}"/>
   <Interior ss:Color="${SLC.navy}" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="${SLC.accent}"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${SLC.navyMid}"/>
   </Borders>
  </Style>
  <Style ss:ID="Odd">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="${SLC.navy}"/>
   <Interior ss:Color="${SLC.white}" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${SLC.grid}"/>
   </Borders>
  </Style>
  <Style ss:ID="Even">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="${SLC.navy}"/>
   <Interior ss:Color="${SLC.even}" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${SLC.grid}"/>
   </Borders>
  </Style>
  <Style ss:ID="OddNum">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="${SLC.navy}"/>
   <Interior ss:Color="${SLC.white}" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${SLC.grid}"/>
   </Borders>
  </Style>
  <Style ss:ID="EvenNum">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="${SLC.navy}"/>
   <Interior ss:Color="${SLC.even}" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${SLC.grid}"/>
   </Borders>
  </Style>
  <Style ss:ID="Footer">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="${SLC.navy}"/>
   <Interior ss:Color="${SLC.lavender}" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${xmlEscape(sheetNameOf(sheetName ?? title))}">
  <Table ss:ExpandedColumnCount="${colCount}" ss:ExpandedRowCount="${prepared.length + 4}" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="18">
   ${columnXml}
   <Row ss:Height="28">
    <Cell ss:StyleID="Title" ss:MergeAcross="${merge}"><Data ss:Type="String">${xmlEscape(title)}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="Meta" ss:MergeAcross="${merge}"><Data ss:Type="String">${xmlEscape(`Exportado ${exportedAt} · SLC Devices Management`)}</Data></Cell>
   </Row>
   <Row ss:Height="22">${headerCells}</Row>
   ${body}
   <Row ss:Height="20">
    <Cell ss:StyleID="Footer" ss:MergeAcross="${merge}"><Data ss:Type="String">${xmlEscape(`${prepared.length} ${prepared.length === 1 ? 'registro' : 'registros'}`)}</Data></Cell>
   </Row>
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>3</SplitHorizontal>
   <TopRowBottomPane>3</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([`\uFEFF${xml}`], { type: 'application/vnd.ms-excel;charset=utf-8' });
  triggerBlobDownload(blob, filename || excelFilename(title));
}
