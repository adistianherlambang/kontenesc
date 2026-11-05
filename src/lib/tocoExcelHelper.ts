import JSZip from "jszip";

export interface TocoProductRow {
  "Main Category"?: string;
  "Sub Category 1"?: string;
  "Sub Category 2"?: string;
  Judul?: string;
  Deskripsi?: string;
  Harga?: number | string;
  "Harga Diskon"?: number | string;
  SKU?: string;
  "Jenis Produk"?: string;
  "Total Stok"?: number | string;
  "Kondisi Barang"?: string;
  "Berat Produk"?: number | string;
  "Status Produk"?: string;
  Length?: number | string;
  Height?: number | string;
  Width?: number | string;
  Preorder?: string;
  "Foto 1"?: string;
  "Foto 2"?: string;
  "Foto 3"?: string;
  "Foto 4"?: string;
  "Foto 5"?: string;
  "Foto 6"?: string;
  "Foto 7"?: string;
  "Foto 8"?: string;
  "Foto 9"?: string;
  "Foto 10"?: string;
  [key: string]: any;
}

const COL_KEYS = [
  "Main Category",
  "Sub Category 1",
  "Sub Category 2",
  "Judul",
  "Deskripsi",
  "Harga",
  "Harga Diskon",
  "SKU",
  "Jenis Produk",
  "Total Stok",
  "Kondisi Barang",
  "Berat Produk",
  "Status Produk",
  "Length",
  "Height",
  "Width",
  "Preorder",
  "Foto 1",
  "Foto 2",
  "Foto 3",
  "Foto 4",
  "Foto 5",
  "Foto 6",
  "Foto 7",
  "Foto 8",
  "Foto 9",
  "Foto 10",
];

const COL_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z", "AA"
];

const NUMERIC_KEYS = new Set([
  "Harga",
  "Harga Diskon",
  "Total Stok",
  "Berat Produk",
  "Length",
  "Height",
  "Width",
]);

function escapeXml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Builds the XML row string for a single Toco product row.
 */
function buildRowXml(item: TocoProductRow, rowIdx: number): string {
  const cells: string[] = [];

  for (let c = 0; c < COL_KEYS.length; c++) {
    const key = COL_KEYS[c];
    const letter = COL_LETTERS[c];
    const cellRef = `${letter}${rowIdx}`;
    const rawVal = item[key];

    if (rawVal === undefined || rawVal === null || rawVal === "") {
      cells.push(`<c r="${cellRef}" t="inlineStr"><is><t></t></is></c>`);
      continue;
    }

    if (NUMERIC_KEYS.has(key)) {
      const num = Number(rawVal);
      if (!isNaN(num) && rawVal !== "") {
        cells.push(`<c r="${cellRef}"><v>${num}</v></c>`);
      } else {
        cells.push(`<c r="${cellRef}" t="inlineStr"><is><t></t></is></c>`);
      }
    } else {
      const escaped = escapeXml(String(rawVal));
      cells.push(`<c r="${cellRef}" t="inlineStr"><is><t>${escaped}</t></is></c>`);
    }
  }

  return `<row r="${rowIdx}" spans="1:27">${cells.join("")}</row>`;
}

/**
 * Injects products into toco_bulk_upload_template.xlsx and returns the generated blob/buffer.
 */
export async function generateTocoExcel(
  templateBuffer: ArrayBuffer | Uint8Array,
  items: TocoProductRow[]
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(templateBuffer);

  const sheetFile = zip.file("xl/worksheets/sheet3.xml");
  if (!sheetFile) {
    throw new Error("xl/worksheets/sheet3.xml tidak ditemukan di dalam template Excel.");
  }
  let sheetXml = await sheetFile.async("string");

  const tableFile = zip.file("xl/tables/table28.xml");
  let tableXml = tableFile ? await tableFile.async("string") : null;

  const totalRows = Math.max(items.length, 1);
  const endRow = totalRows + 1; // row 1 is header, data starts at row 2

  // Build row XMLs
  const rowXmls: string[] = [];
  if (items.length === 0) {
    rowXmls.push(`<row r="2" spans="1:27"><c r="R2" s="11"/></row>`);
  } else {
    items.forEach((item, idx) => {
      rowXmls.push(buildRowXml(item, idx + 2));
    });
  }

  // Replace rows starting at row 2 in sheetData
  sheetXml = sheetXml.replace(
    /(<row r="1"[\s\S]*?<\/row>)([\s\S]*?)(<\/sheetData>)/,
    `$1${rowXmls.join("")}$3`
  );

  // Update dimension in sheet3.xml
  sheetXml = sheetXml.replace(
    /<dimension ref="A1:AA\d+"\/>/,
    `<dimension ref="A1:AA${endRow}"/>`
  );
  zip.file("xl/worksheets/sheet3.xml", sheetXml);

  // Update table28.xml ref and autoFilter ref if present
  if (tableXml) {
    tableXml = tableXml.replace(
      /ref="A1:AA\d+"/g,
      `ref="A1:AA${Math.max(20, endRow)}"`
    );
    zip.file("xl/tables/table28.xml", tableXml);
  }

  return await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
