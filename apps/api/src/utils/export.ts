// ---------------------------------------------------------------------------
// PDF colour palette (matches FlowRaze "Kinetic Architect" dark tokens
// expressed as RGB 0-1 floats for PDF operators)
// ---------------------------------------------------------------------------
// #0b1326  surface            → 0.043 0.075 0.149
// #bcc3ff  primary text       → 0.737 0.765 1.000
// #1e2a78  primary container  → 0.118 0.165 0.471
// #4ae176  growth / positive  → 0.290 0.882 0.463
// ---------------------------------------------------------------------------

type ExportRow = Record<string, string | number | boolean | null | undefined>;
type ExportValue = ExportRow[string];

// ── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCsvValue(value: ExportValue) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: ExportRow[], headers: string[]) {
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}

// ── Low-level PDF helpers ────────────────────────────────────────────────────

/** Escape a string literal for a PDF text stream. */
function pdfStr(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '?');
}

/** Truncate a cell value so it fits within `maxChars`. */
function cell(value: ExportValue, maxChars: number): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return s.length > maxChars ? `${s.slice(0, Math.max(0, maxChars - 3))}...` : s;
}

function formatReportValue(value: ExportValue, header = ''): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    const isCurrency = /revenue|value|cost|amount|closed/i.test(header);
    if (isCurrency) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(value).replace('IDR', 'Rp');
    }

    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
  }

  const date = /^\d{4}-\d{2}-\d{2}T/.test(value) ? new Date(value) : null;
  if (date && !Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  }

  return value;
}

// ── Layout constants ─────────────────────────────────────────────────────────

const PAGE_W = 842;  // A4 landscape width  (pt)
const PAGE_H = 595;  // A4 landscape height (pt)
const MARGIN = 36;   // page margin         (pt)

// Typography sizes
const TITLE_SIZE  = 20;
const META_SIZE   = 8;
const HEAD_SIZE   = 8;
const BODY_SIZE   = 8;

// Row heights
const TABLE_HEAD_H = 18;
const ROW_H        = 15;
const SUMMARY_TOP_GAP = 16;
const SUMMARY_CARD_H = 46;
const CHART_H = 78;
const SUMMARY_BOTTOM_GAP = 14;

// Colours
const COL_SURFACE   = '0.043 0.075 0.149';   // #0b1326
const COL_ACCENT    = '0.118 0.165 0.471';   // #1e2a78
const COL_BRAND     = '0.290 0.882 0.463';   // #4ae176
const COL_WHITE     = '1 1 1';
const COL_LIGHT_BG  = '0.957 0.961 0.980';   // slightly off-white stripe
const COL_GRID      = '0.820 0.827 0.878';   // column separator
const COL_DARK_TEXT = '0.082 0.106 0.200';   // near-black for light rows
const COL_DIM_TEXT  = '0.450 0.467 0.560';   // muted for meta / footer
const COL_CARD_BG   = '0.925 0.937 0.969';   // light blue panel
const COL_BAR_BG    = '0.878 0.890 0.941';   // muted chart rail

// ── Summary builder ─────────────────────────────────────────────────────────

interface SummaryMetric {
  label: string;
  value: string;
}

interface ChartItem {
  label: string;
  count: number;
}

interface ReportSummary {
  metrics: SummaryMetric[];
  chartTitle: string;
  chartItems: ChartItem[];
}

function titleCase(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pickDistributionHeader(headers: string[]) {
  return headers.find((header) => /status|stage|role|type|channel|source/i.test(header)) ?? headers[0] ?? '';
}

function buildDistribution(rows: ExportRow[], header: string): ChartItem[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const raw = row[header];
    const label = raw === null || raw === undefined || raw === '' ? 'Unknown' : titleCase(String(raw));
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5);
}

function buildNumericMetric(rows: ExportRow[], headers: string[]): SummaryMetric | null {
  const numericHeader = headers.find((header) =>
    rows.some((row) => typeof row[header] === 'number') && /revenue|value|cost|amount|leads|deals|activities/i.test(header)
  );

  if (!numericHeader) return null;

  const total = rows.reduce((sum, row) => {
    const value = row[numericHeader];
    return typeof value === 'number' ? sum + value : sum;
  }, 0);

  return { label: `Total ${numericHeader}`, value: formatReportValue(total, numericHeader) };
}

function buildReportSummary(rows: ExportRow[], headers: string[]): ReportSummary {
  const distributionHeader = pickDistributionHeader(headers);
  const numericMetric = buildNumericMetric(rows, headers);
  const metrics: SummaryMetric[] = [
    { label: 'Records', value: new Intl.NumberFormat('en-US').format(rows.length) },
    numericMetric ?? { label: 'Columns', value: String(headers.length) },
    {
      label: 'Generated',
      value: new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date()),
    },
  ];

  return {
    metrics,
    chartTitle: distributionHeader ? `${distributionHeader} Mix` : 'Record Mix',
    chartItems: distributionHeader ? buildDistribution(rows, distributionHeader) : [],
  };
}

// ── Column layout calculator ─────────────────────────────────────────────────

interface ColDef {
  header: string;
  x: number;      // left edge
  width: number;  // usable width (pt)
  maxChars: number;
}

function buildCols(headers: string[]): ColDef[] {
  const tableW = PAGE_W - MARGIN * 2;
  // Give each column equal width (capped) – weight toward text columns
  const colW = Math.floor(tableW / headers.length);
  return headers.map((header, i) => {
    const x = MARGIN + i * colW;
    const width = i === headers.length - 1 ? PAGE_W - MARGIN - x : colW;
    // Approximate characters that fit: width / ~4.8pt per char at size 8
    const maxChars = Math.max(4, Math.floor(width / 4.8));
    return { header, x, width, maxChars };
  });
}

// ── Raw PDF content stream builder ───────────────────────────────────────────

type ContentStream = string[];

function pushRect(
  s: ContentStream,
  x: number, y: number, w: number, h: number,
  fillRgb: string, stroke = false,
) {
  s.push(`${fillRgb} rg`);
  s.push(`${x} ${y} ${w} ${h} re f${stroke ? 'S' : ''}`);
}

function pushTextLine(
  s: ContentStream,
  text: string,
  x: number, y: number,
  size: number,
  rgbColor: string,
  font: 'F1' | 'F2' = 'F1',  // F1=Helvetica, F2=Helvetica-Bold
) {
  s.push(`BT`);
  s.push(`/${font} ${size} Tf`);
  s.push(`${rgbColor} rg`);
  s.push(`${x} ${y} Td`);
  s.push(`(${pdfStr(text)}) Tj`);
  s.push(`ET`);
}

function pushHLine(s: ContentStream, x1: number, y: number, x2: number, rgbColor: string, lw = 0.5) {
  s.push(`${lw} w`);
  s.push(`${rgbColor} RG`);
  s.push(`${x1} ${y} m ${x2} ${y} l S`);
}

function pushMetricCards(s: ContentStream, summary: ReportSummary, topY: number) {
  const gap = 12;
  const cardW = (PAGE_W - MARGIN * 2 - gap * 2) / 3;

  summary.metrics.slice(0, 3).forEach((metric, index) => {
    const x = MARGIN + index * (cardW + gap);
    const y = topY - SUMMARY_CARD_H;
    pushRect(s, x, y, cardW, SUMMARY_CARD_H, COL_CARD_BG);
    pushRect(s, x, y, 4, SUMMARY_CARD_H, index === 0 ? COL_BRAND : COL_ACCENT);
    pushTextLine(s, metric.label.toUpperCase(), x + 12, y + 28, META_SIZE, COL_DIM_TEXT, 'F2');
    pushTextLine(s, cell(metric.value, Math.floor((cardW - 24) / 7)), x + 12, y + 12, 14, COL_DARK_TEXT, 'F2');
  });
}

function pushDistributionChart(s: ContentStream, summary: ReportSummary, topY: number) {
  const y = topY - CHART_H;
  const chartW = PAGE_W - MARGIN * 2;
  const titleY = y + CHART_H - 18;
  pushRect(s, MARGIN, y, chartW, CHART_H, COL_WHITE);
  pushHLine(s, MARGIN, y + CHART_H, MARGIN + chartW, COL_GRID);
  pushTextLine(s, summary.chartTitle.toUpperCase(), MARGIN + 10, titleY, META_SIZE, COL_DIM_TEXT, 'F2');

  if (summary.chartItems.length === 0) {
    pushTextLine(s, 'No grouped data available for this export.', MARGIN + 10, y + 28, BODY_SIZE, COL_DIM_TEXT, 'F1');
    return;
  }

  const maxCount = Math.max(...summary.chartItems.map((item) => item.count), 1);
  const labelW = 112;
  const barW = chartW - labelW - 72;
  const rowGap = 11;

  summary.chartItems.forEach((item, index) => {
    const rowY = y + CHART_H - 34 - index * rowGap;
    const width = Math.max(4, (item.count / maxCount) * barW);
    pushTextLine(s, cell(item.label, 20), MARGIN + 10, rowY, BODY_SIZE, COL_DARK_TEXT, 'F1');
    pushRect(s, MARGIN + labelW, rowY - 2, barW, 6, COL_BAR_BG);
    pushRect(s, MARGIN + labelW, rowY - 2, width, 6, index === 0 ? COL_BRAND : COL_ACCENT);
    pushTextLine(s, String(item.count), MARGIN + labelW + barW + 12, rowY, BODY_SIZE, COL_DARK_TEXT, 'F2');
  });
}

function buildPageContent(
  pageIndex: number,
  totalPages: number,
  title: string,
  meta: string,
  cols: ColDef[],
  pageRows: ExportRow[],
  totalRows: number,
  summary: ReportSummary,
): string {
  const s: ContentStream = [];

  // ── Header bar ──────────────────────────────────────────────────────────
  const headerBarH = 54;
  const headerBarY = PAGE_H - headerBarH;
  pushRect(s, 0, headerBarY, PAGE_W, headerBarH, COL_SURFACE);

  // Brand accent stripe (left edge)
  pushRect(s, 0, headerBarY, 5, headerBarH, COL_BRAND);

  // Logo / title text
  pushTextLine(s, 'FlowRaze', MARGIN + 8, PAGE_H - 23, TITLE_SIZE, COL_WHITE, 'F2');

  // Report sub-title to the right of the brand name
  const subtitleX = MARGIN + 8 + TITLE_SIZE * 5.2;
  pushTextLine(s, `/ ${title}`, subtitleX, PAGE_H - 22, 11, '0.737 0.765 1.000', 'F1');

  // Meta line (date, rows)
  pushTextLine(s, meta, MARGIN + 8, PAGE_H - 42, META_SIZE, COL_BRAND, 'F1');

  // Total rows badge (right side)
  const badge = `${totalRows} record${totalRows !== 1 ? 's' : ''}`;
  const badgeX = PAGE_W - MARGIN - badge.length * 4.8 - 12;
  pushRect(s, badgeX, PAGE_H - 36, badge.length * 4.8 + 12, 16, COL_ACCENT);
  pushTextLine(s, badge, badgeX + 6, PAGE_H - 30, META_SIZE, COL_WHITE, 'F2');

  let tableTop = headerBarY - 4;

  if (pageIndex === 0) {
    const summaryTop = headerBarY - SUMMARY_TOP_GAP;
    pushMetricCards(s, summary, summaryTop);
    pushDistributionChart(s, summary, summaryTop - SUMMARY_CARD_H - 10);
    tableTop = summaryTop - SUMMARY_CARD_H - 10 - CHART_H - SUMMARY_BOTTOM_GAP;
  }

  // ── Table header row ────────────────────────────────────────────────────
  const tableHeadY = tableTop - TABLE_HEAD_H;
  const tableW = PAGE_W - MARGIN * 2;

  pushRect(s, MARGIN, tableHeadY, tableW, TABLE_HEAD_H, COL_ACCENT);

  for (const col of cols) {
    pushTextLine(
      s,
      col.header.toUpperCase(),
      col.x + 4, tableHeadY + 5,
      HEAD_SIZE, COL_WHITE, 'F2',
    );
  }

  // ── Data rows ───────────────────────────────────────────────────────────
  let rowY = tableHeadY;

  for (let ri = 0; ri < pageRows.length; ri++) {
    rowY -= ROW_H;
    const rowBg = ri % 2 === 0 ? COL_LIGHT_BG : COL_WHITE;
    pushRect(s, MARGIN, rowY, tableW, ROW_H, rowBg);

      const currentRow = pageRows[ri]!;
    for (const col of cols) {
      const text = cell(formatReportValue(currentRow[col.header], col.header), col.maxChars);
      pushTextLine(s, text, col.x + 4, rowY + 4, BODY_SIZE, COL_DARK_TEXT, 'F1');
    }

    // Column separators
    for (let ci = 1; ci < cols.length; ci++) {
      const lineX = cols[ci]!.x;
      s.push(`0.5 w`);
      s.push(`${COL_GRID} RG`);
      s.push(`${lineX} ${rowY} m ${lineX} ${rowY + ROW_H} l S`);
    }
  }

  // Bottom border of data table
  pushHLine(s, MARGIN, rowY, MARGIN + tableW, COL_GRID, 0.75);

  // ── Footer ──────────────────────────────────────────────────────────────
  const footerY = 18;
  pushHLine(s, MARGIN, footerY + 10, PAGE_W - MARGIN, COL_GRID);

  const footerLeft = `Generated by FlowRaze CRM  •  ${new Date().toUTCString()}`;
  pushTextLine(s, footerLeft, MARGIN, footerY, META_SIZE, COL_DIM_TEXT, 'F1');

  const pageLabel = `Page ${pageIndex + 1} of ${totalPages}`;
  const pageLabelX = PAGE_W - MARGIN - pageLabel.length * 4.8;
  pushTextLine(s, pageLabel, pageLabelX, footerY, META_SIZE, COL_DIM_TEXT, 'F1');

  return s.join('\n');
}

// ── PDF object / xref assembler ──────────────────────────────────────────────

function buildPdf(contentStreams: string[]): Buffer {
  // Object layout:
  //  1  Catalog
  //  2  Pages
  //  3..N  Page objects
  //  N+1..M  Content streams
  //  M+1  Font F1 (Helvetica)
  //  M+2  Font F2 (Helvetica-Bold)

  const pageCount = contentStreams.length;

  let pdf = '%PDF-1.4\n%\xFF\xFF\xFF\xFF\n';

  // Reserve IDs:
  //  id 1  → Catalog
  //  id 2  → Pages
  //  id 3..(3+pageCount-1)  → Page objects
  //  id (3+pageCount)..(3+2*pageCount-1) → Content streams
  //  id (3+2*pageCount) → Font F1
  //  id (3+2*pageCount+1) → Font F2

  const catalogId = 1;
  const pagesId   = 2;
  const pageIds   = Array.from({ length: pageCount }, (_, i) => 3 + i);
  const streamIds = Array.from({ length: pageCount }, (_, i) => 3 + pageCount + i);
  const fontF1Id  = 3 + 2 * pageCount;
  const fontF2Id  = 3 + 2 * pageCount + 1;

  // Build all object bodies (as strings, 1-indexed position)
  // We build them in order 1, 2, page objects, stream objects, fonts.

  const allBodies: string[] = [];

  // 1: Catalog
  allBodies.push(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  // 2: Pages
  const kidsRefs = pageIds.map((id) => `${id} 0 R`).join(' ');
  allBodies.push(
    `<< /Type /Pages /Kids [${kidsRefs}] /Count ${pageCount} >>`,
  );

  // 3..: Page objects
  for (let i = 0; i < pageCount; i++) {
    allBodies.push(
      `<< /Type /Page /Parent ${pagesId} 0 R` +
      ` /MediaBox [0 0 ${PAGE_W} ${PAGE_H}]` +
      ` /Resources << /Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R >> >>` +
      ` /Contents ${streamIds[i]} 0 R >>`,
    );
  }

  // Content streams
  for (let i = 0; i < pageCount; i++) {
    const stream = contentStreams[i] ?? '';
    const streamBytes = Buffer.byteLength(stream, 'utf8');
    allBodies.push(
      `<< /Length ${streamBytes} >>\nstream\n${stream}\nendstream`,
    );
  }

  // Font F1: Helvetica
  allBodies.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
  // Font F2: Helvetica-Bold
  allBodies.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

  // Now emit all objects in order
  const byteOffsets: number[] = [];

  for (let idx = 0; idx < allBodies.length; idx++) {
    byteOffsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${idx + 1} 0 obj\n${allBodies[idx]}\nendobj\n`;
  }

  // xref
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  const totalObjs = allBodies.length + 1; // +1 for free object 0
  pdf += `xref\n0 ${totalObjs}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of byteOffsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${totalObjs} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}

// ── Public API ───────────────────────────────────────────────────────────────

export function toPdf(title: string, rows: ExportRow[], headers: string[]): Buffer {
  const cols = buildCols(headers);
  const summary = buildReportSummary(rows, headers);

  const headerBarH = 54;
  const footerArea = 40; // reserved for footer
  const firstTableTop =
    PAGE_H -
    headerBarH -
    SUMMARY_TOP_GAP -
    SUMMARY_CARD_H -
    10 -
    CHART_H -
    SUMMARY_BOTTOM_GAP;
  const laterTableTop = PAGE_H - headerBarH - 4;
  const firstRowsPerPage = Math.max(1, Math.floor((firstTableTop - TABLE_HEAD_H - footerArea) / ROW_H));
  const laterRowsPerPage = Math.max(1, Math.floor((laterTableTop - TABLE_HEAD_H - footerArea) / ROW_H));

  // Slice rows into pages
  const pages: ExportRow[][] = [];
  if (rows.length === 0) {
    pages.push([]);
  } else {
    pages.push(rows.slice(0, firstRowsPerPage));
    for (let i = firstRowsPerPage; i < rows.length; i += laterRowsPerPage) {
      pages.push(rows.slice(i, i + laterRowsPerPage));
    }
  }

  const meta = `Exported: ${new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })}`;

  const streams = pages.map((pageRows, pageIndex) =>
    buildPageContent(pageIndex, pages.length, title, meta, cols, pageRows, rows.length, summary),
  );

  return buildPdf(streams);
}

export function exportFilename(entity: string, format: string) {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `flowraze-${entity}-${timestamp}.${format}`;
}
