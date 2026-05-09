import type { LeadStatus } from '@/types';

const HEADER_ALIASES: Record<Exclude<keyof LeadImportRow, 'rowNumber'>, string[]> = {
  fullName: ['fullname', 'name', 'leadname', 'contactname'],
  email: ['email', 'emailaddress', 'e-mail'],
  phone: ['phone', 'phonenumber', 'telephone', 'telp', 'whatsapp', 'wa'],
  companyName: ['company', 'companyname', 'organization', 'organisation'],
  source: ['source', 'leadsource'],
  serviceType: ['service', 'servicetype', 'project', 'projectservice'],
  status: ['status', 'leadstatus'],
  campaignId: ['campaignid', 'campaign'],
  notes: ['notes', 'note', 'description'],
};

const XLSX_CONTENT_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export type LeadImportRow = {
  fullName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  source?: string;
  serviceType?: string;
  status?: LeadStatus | string;
  campaignId?: string;
  notes?: string;
  rowNumber: number;
};

type ZipEntry = {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  return firstLine.split('\t').length > firstLine.split(',').length ? '\t' : ',';
}

export function parseDelimitedRows(text: string, delimiter = detectDelimiter(text)) {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(field.trim());
      field = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      row.push(field.trim());
      if (row.some((value) => value !== '')) {
        rows.push(row);
      }
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field.trim());
  if (row.some((value) => value !== '')) {
    rows.push(row);
  }

  return rows;
}

function rowsToLeadImportRows(rows: string[][]) {
  const [headers, ...dataRows] = rows;
  if (!headers || headers.length === 0) {
    throw new Error('Import file must include a header row');
  }

  const aliases = new Map<string, keyof LeadImportRow>();
  Object.entries(HEADER_ALIASES).forEach(([field, names]) => {
    names.forEach((name) => aliases.set(name, field as keyof LeadImportRow));
  });

  const mappedHeaders = headers.map((header) => aliases.get(normalizeHeader(header)));

  return dataRows
    .map((cells, index) => {
      const row: LeadImportRow = { rowNumber: index + 2 };

      cells.forEach((cell, cellIndex) => {
        const field = mappedHeaders[cellIndex];
        if (field && field !== 'rowNumber' && cell.trim()) {
          row[field] = cell.trim();
        }
      });

      return row;
    })
    .filter((row) => Object.keys(row).some((key) => key !== 'rowNumber'));
}

function readTextFile(file: File) {
  return file.text();
}

function getUint16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function getUint32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

function findEndOfCentralDirectory(view: DataView) {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (getUint32(view, offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new Error('Excel workbook is not a valid .xlsx file');
}

function readZipEntries(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  const eocdOffset = findEndOfCentralDirectory(view);
  const entryCount = getUint16(view, eocdOffset + 10);
  let offset = getUint32(view, eocdOffset + 16);
  const entries = new Map<string, ZipEntry>();

  for (let index = 0; index < entryCount; index += 1) {
    if (getUint32(view, offset) !== 0x02014b50) {
      throw new Error('Excel workbook has an invalid directory');
    }

    const method = getUint16(view, offset + 10);
    const compressedSize = getUint32(view, offset + 20);
    const nameLength = getUint16(view, offset + 28);
    const extraLength = getUint16(view, offset + 30);
    const commentLength = getUint16(view, offset + 32);
    const localHeaderOffset = getUint32(view, offset + 42);
    const name = decoder.decode(new Uint8Array(buffer, offset + 46, nameLength));

    entries.set(name, { name, method, compressedSize, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

async function inflateRaw(data: Uint8Array) {
  const Decompression = globalThis.DecompressionStream;
  if (!Decompression) {
    throw new Error('This browser cannot read compressed .xlsx files. Please import a CSV file instead.');
  }

  const bytes = new ArrayBuffer(data.byteLength);
  new Uint8Array(bytes).set(data);
  const stream = new Blob([bytes]).stream().pipeThrough(new Decompression('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function extractZipText(buffer: ArrayBuffer, entries: Map<string, ZipEntry>, name: string) {
  const entry = entries.get(name);
  if (!entry) {
    return '';
  }

  const view = new DataView(buffer);
  if (getUint32(view, entry.localHeaderOffset) !== 0x04034b50) {
    throw new Error('Excel workbook has an invalid file entry');
  }

  const nameLength = getUint16(view, entry.localHeaderOffset + 26);
  const extraLength = getUint16(view, entry.localHeaderOffset + 28);
  const dataOffset = entry.localHeaderOffset + 30 + nameLength + extraLength;
  const compressed = new Uint8Array(buffer, dataOffset, entry.compressedSize);
  const data =
    entry.method === 0
      ? compressed
      : entry.method === 8
        ? await inflateRaw(compressed)
        : null;

  if (!data) {
    throw new Error('Excel workbook uses an unsupported compression format');
  }

  return new TextDecoder().decode(data);
}

function parseXml(text: string) {
  const document = new DOMParser().parseFromString(text, 'application/xml');
  if (document.querySelector('parsererror')) {
    throw new Error('Excel workbook contains invalid XML');
  }

  return document;
}

function getFirstSheetPath(workbookXml: string, relsXml: string) {
  const workbook = parseXml(workbookXml);
  const rels = parseXml(relsXml);
  const sheet = workbook.querySelector('sheet');
  const relationshipId = sheet?.getAttribute('r:id') ?? sheet?.getAttribute('id');

  if (!relationshipId) {
    throw new Error('Excel workbook does not include a worksheet');
  }

  const relationship = Array.from(rels.querySelectorAll('Relationship')).find(
    (item) => item.getAttribute('Id') === relationshipId
  );
  const target = relationship?.getAttribute('Target');
  if (!target) {
    throw new Error('Excel workbook worksheet cannot be found');
  }

  return target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\.\//, '')}`;
}

function getSharedStrings(sharedStringsXml: string) {
  if (!sharedStringsXml) {
    return [];
  }

  const document = parseXml(sharedStringsXml);
  return Array.from(document.querySelectorAll('si')).map((item) =>
    Array.from(item.querySelectorAll('t')).map((text) => text.textContent ?? '').join('')
  );
}

function columnIndex(cellRef: string | null) {
  const letters = cellRef?.match(/[A-Z]+/i)?.[0] ?? '';
  return letters
    .toUpperCase()
    .split('')
    .reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function sheetToRows(sheetXml: string, sharedStrings: string[]) {
  const document = parseXml(sheetXml);
  const rows: string[][] = [];

  document.querySelectorAll('sheetData row').forEach((rowElement) => {
    const row: string[] = [];

    rowElement.querySelectorAll('c').forEach((cell) => {
      const index = columnIndex(cell.getAttribute('r'));
      const type = cell.getAttribute('t');
      const valueNode = cell.querySelector('v');
      const inlineNode = cell.querySelector('is t');
      const rawValue = valueNode?.textContent ?? inlineNode?.textContent ?? '';
      const value = type === 's' ? sharedStrings[Number(rawValue)] ?? '' : rawValue;

      row[index >= 0 ? index : row.length] = value.trim();
    });

    if (row.some((value) => value)) {
      rows.push(row);
    }
  });

  return rows;
}

async function parseXlsxFile(file: File) {
  const buffer = await file.arrayBuffer();
  const entries = readZipEntries(buffer);
  const workbookXml = await extractZipText(buffer, entries, 'xl/workbook.xml');
  const relsXml = await extractZipText(buffer, entries, 'xl/_rels/workbook.xml.rels');
  const sharedStringsXml = await extractZipText(buffer, entries, 'xl/sharedStrings.xml');
  const sheetPath = getFirstSheetPath(workbookXml, relsXml);
  const sheetXml = await extractZipText(buffer, entries, sheetPath);

  if (!sheetXml) {
    throw new Error('Excel workbook worksheet cannot be read');
  }

  return rowsToLeadImportRows(sheetToRows(sheetXml, getSharedStrings(sharedStringsXml)));
}

export async function parseLeadImportFile(file: File) {
  const name = file.name.toLowerCase();

  if (name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.txt')) {
    const text = await readTextFile(file);
    return rowsToLeadImportRows(parseDelimitedRows(text));
  }

  if (name.endsWith('.xlsx') || XLSX_CONTENT_TYPES.has(file.type)) {
    return parseXlsxFile(file);
  }

  if (name.endsWith('.xls')) {
    throw new Error('Legacy .xls files are not supported. Save the spreadsheet as .xlsx or CSV and try again.');
  }

  const text = await readTextFile(file);
  return rowsToLeadImportRows(parseDelimitedRows(text));
}
