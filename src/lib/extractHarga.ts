/**
 * Client-side Word Document (.doc / .docx) parser for Semarang Cell price list.
 * 100% in-browser processing via TypedArrays, DataView, and native DecompressionStream.
 * Zero external dependencies, safe for serverless/edge environments like Vercel.
 */

const CP1252_MAP: Record<number, string> = {
  0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E',
  0x85: '\u2026', 0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02C6',
  0x89: '\u2030', 0x8A: '\u0160', 0x8B: '\u2039', 0x8C: '\u0152',
  0x8E: '\u017D', 0x91: '\u2018', 0x92: '\u2019', 0x93: '\u201C',
  0x94: '\u201D', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
  0x98: '\u02DC', 0x99: '\u2122', 0x9A: '\u0161', 0x9B: '\u203A',
  0x9C: '\u0153', 0x9E: '\u017E', 0x9F: '\u0178'
};

export function decodeCp1252(buf: Uint8Array): string {
  let str = '';
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (CP1252_MAP[b]) {
      str += CP1252_MAP[b];
    } else {
      str += String.fromCharCode(b);
    }
  }
  return str;
}

export function unescapeXml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export interface HargaItem {
  tipe: string;
  nama?: string;
  cashback: number;
  ram: string;
  harga: number;
}

export interface HargaBrandResult {
  merk: string;
  detail: HargaItem[];
}

export interface ExtractResult {
  data: HargaBrandResult[];
  format: "DOC" | "DOCX";
  fileName: string;
  totalUnits: number;
}

/**
 * In-browser raw deflate decompression using native Web Compression Streams API.
 */
async function inflateRaw(compData: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Browser Anda belum mendukung DecompressionStream API.");
  }
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(compData as any);
  writer.close();

  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

/**
 * Reads a specific entry from a ZIP (.docx) archive in memory.
 */
async function readZipEntry(buffer: Uint8Array, targetName: string): Promise<Uint8Array | null> {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let eocdOffset = -1;

  // Search backwards for End of Central Directory signature 0x06054b50
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) return null;

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  let offset = cdOffset;
  const decoder = new TextDecoder();
  for (let i = 0; i < totalEntries; i++) {
    if (offset + 46 > buffer.length) break;
    if (view.getUint32(offset, true) !== 0x02014b50) break;

    const compMethod = view.getUint16(offset + 10, true);
    const compSize = view.getUint32(offset + 20, true);
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(buffer.subarray(offset + 46, offset + 46 + nameLen));

    if (name === targetName) {
      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compData = buffer.subarray(dataOffset, dataOffset + compSize);

      if (compMethod === 0) return compData; // Stored (no compression)
      if (compMethod === 8) return await inflateRaw(compData); // Deflate
      throw new Error(`Metode kompresi ZIP tidak didukung: ${compMethod}`);
    }

    offset += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

/**
 * Parses a single item row into a HargaItem object.
 */
export function parseItem(c0: string, c1: string, c2: string): HargaItem {
  const harga = parseInt(c2, 10);
  let ram = "";
  if (/^\d+\/\d+$/.test(c1)) {
    ram = c1;
  }

  let tipe = c0;
  let cashback = 0;

  // Kasus khusus Smart TV (mempunyai atribut tambahan nama)
  if (tipe.startsWith("S.TV HD 32")) {
    return {
      tipe: "S.TV HD 32",
      nama: "UA32H5000 FKLXD 32”",
      cashback: 0,
      ram: "",
      harga
    };
  }

  // Normalisasi desimal pada ukuran layar: misal 8,7” -> 8.7”
  tipe = tipe.replace(/(\d+),(\d+)/g, "$1.$2");

  // Bersihkan penanda non-cashback 'NET' di akhir kata
  tipe = tipe.replace(/\s+NET\s*$/i, "");

  // Ekstraksi Cashback:
  // Mendukung kode tunggal atau kombinasi: c, pwp, cbr, tri, po dp diikuti angka
  const cbRegex = /\s+((?:(?:CBR|PWP|TRI|PO\s+DP|C)\s*)+(\d+))\s*$/i;
  const match = tipe.match(cbRegex);
  if (match) {
    cashback = parseInt(match[2], 10);
    tipe = tipe.slice(0, match.index).trim();
  }

  // Penyesuaian nama tipe khusus sesuai format standar referensi
  if (tipe === "TAB A11 8.7”  WF" || tipe === "TAB A11 8.7” WF") {
    tipe = "TAB A11 8.7”";
  } else if (tipe.includes("Silicone case")) {
    tipe = "Silicone case Z Flip 6";
  } else if (tipe.includes("Kindsuit case")) {
    tipe = "Kindsuit case Z Flip 6";
  } else if (tipe.includes("type C non cable black")) {
    tipe = "TA. 25W Type C non cable black";
  } else if (tipe === "TA. 45W type C + cable") {
    tipe = "TA. 45W Type C + cable";
  } else if (tipe === "TA. 50W type C + cable 2Slot USB") {
    tipe = "TA. 50W Type C + cable 2Slot USB";
  } else if (tipe === "XIAOMI PAD 8 +keyboard") {
    tipe = "XIAOMI PAD 8 + KEYBOARD";
  } else if (tipe === "TA TYPE C 120W+cable (A - C)") {
    tipe = "TA TYPE C 120W + CABLE (A-C)";
  } else if (tipe === "TA MOBIL USB dual port 37W") {
    tipe = "TA MOBIL USB DUAL PORT 37W";
  } else if (tipe === "XPAD 20 keyboard") {
    tipe = "XPAD 20 KEYBOARD";
  } else if (tipe === "TWS earphone xbuds3") {
    tipe = "TWS EARPHONE XBUDS3";
  } else if (tipe === "NOKIA 105") {
    tipe = "105";
  }

  tipe = tipe.replace(/\s+/g, " ").trim();

  return { tipe, cashback, ram, harga };
}

/**
 * Builds categorized brand JSON from 9-column rows array.
 */
export function buildJsonFromRows(rows: string[][]): HargaBrandResult[] {
  const sections = [
    { brand: "SAMSUNG", block: 0, start: 1, end: 61 },
    { brand: "XIAOMI",  block: 1, start: 1, end: 44 },
    { brand: "OPPO",    block: 2, start: 1, end: 25 },
    { brand: "VIVO",    block: 2, start: 27, end: 52 },
    { brand: "REALME",  block: 1, start: 46, end: 62 },
    { brand: "INFINIX", block: 2, start: 54, end: 85 },
    { brand: "TECNO",   block: 0, start: 63, end: 86 },
    { brand: "NOKIA",   block: 1, start: 79, end: 79 },
  ];

  const result: HargaBrandResult[] = [];
  for (const sec of sections) {
    const brandObj: HargaBrandResult = { merk: sec.brand, detail: [] };
    for (let r = sec.start; r <= sec.end; r++) {
      if (r >= rows.length) break;
      const [c0, c1, c2] = rows[r].slice(sec.block * 3, sec.block * 3 + 3);
      if (!c0 && !c1 && !c2) continue;
      // Abaikan header tabel (misal "Rp.K")
      if (c2?.includes("Rp.K")) continue;
      // Abaikan footer informasi kontak (misal "8P  4424102644") dan item nonaktif dicoret
      if (c0?.startsWith("8P") || c0?.startsWith("R16")) continue;

      brandObj.detail.push(parseItem(c0 || "", c1 || "", c2 || ""));
    }
    result.push(brandObj);
  }

  return result;
}

/**
 * Extracts price data from binary Word .doc buffer.
 */
export function extractHargaDocFromBuffer(fileBuf: Uint8Array): HargaBrandResult[] {
  // Mencari awal tabel (diawali dengan header merk SAMSUNG SAMSUNG)
  const needle = new TextEncoder().encode("SAMSUNG SAMSUNG");
  let start = -1;
  for (let i = 0; i <= fileBuf.length - needle.length; i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (fileBuf[i + j] !== needle[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      start = i;
      break;
    }
  }

  if (start === -1) {
    throw new Error('Header "SAMSUNG SAMSUNG" tidak ditemukan di dalam dokumen .doc.');
  }

  // Mencari akhir dari blok teks dokumen (berhenti di karakter null/terminator 0x00)
  let end = start;
  while (end < fileBuf.length && fileBuf[end] !== 0x00) {
    end++;
  }

  const textBuf = fileBuf.subarray(start, end);

  // Pada tabel dokumen Word (.doc), setiap sel diakhiri karakter ASCII 0x07 (BEL / Cell Mark)
  const cells: string[] = [];
  let last = 0;
  for (let i = 0; i < textBuf.length; i++) {
    if (textBuf[i] === 0x07) {
      cells.push(decodeCp1252(textBuf.subarray(last, i)).trim());
      last = i + 1;
    }
  }

  // Setiap baris tabel Word memiliki 9 sel data (3 kolom x 3 merk) + 1 tanda akhir baris (0x07)
  const rows: string[][] = [];
  for (let i = 0; i < cells.length; i += 10) {
    rows.push(cells.slice(i, i + 9));
  }

  return buildJsonFromRows(rows);
}

/**
 * Extracts price data from modern Word .docx buffer.
 */
export async function extractHargaDocxFromBuffer(buf: Uint8Array): Promise<HargaBrandResult[]> {
  const xmlBuf = await readZipEntry(buf, "word/document.xml");
  if (!xmlBuf) {
    throw new Error('word/document.xml tidak ditemukan di dalam file .docx.');
  }
  const xml = new TextDecoder().decode(xmlBuf);

  // Ambil semua baris tabel <w:tr>...</w:tr>
  const rowMatches = xml.match(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g) || [];
  const allRows: string[][] = [];

  for (const trXml of rowMatches) {
    const cellMatches = trXml.match(/<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g) || [];
    const cells: string[] = [];
    for (const tcXml of cellMatches) {
      let cellText = "";
      const runMatches = tcXml.match(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/g);
      if (runMatches && runMatches.length > 0) {
        for (const rXml of runMatches) {
          // Abaikan teks dengan format strikethrough (dicoret/tidak berlaku)
          if (/<w:strike\b/.test(rXml) || /<w:dstrike\b/.test(rXml)) {
            continue;
          }
          const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
          let tm: RegExpExecArray | null;
          while ((tm = tRegex.exec(rXml)) !== null) {
            cellText += unescapeXml(tm[1]);
          }
        }
      } else {
        const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
        let tm: RegExpExecArray | null;
        while ((tm = tRegex.exec(tcXml)) !== null) {
          cellText += unescapeXml(tm[1]);
        }
      }
      cells.push(cellText.trim());
    }

    if (cells.length >= 9) {
      allRows.push(cells.slice(0, 9));
    }
  }

  // Sinkronisasi baris: cari baris di mana sel pertama memuat "SAMSUNG SAMSUNG"
  const startRowIdx = allRows.findIndex((r) => r[0]?.includes("SAMSUNG"));
  const rows = startRowIdx !== -1 ? allRows.slice(startRowIdx) : allRows;

  return buildJsonFromRows(rows);
}

/**
 * Universal client-side extractor for .doc and .docx price files.
 */
export async function extractHargaFromBuffer(
  buffer: ArrayBuffer | Uint8Array,
  fileName = "dokumen.docx"
): Promise<ExtractResult> {
  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (u8.length < 8) {
    throw new Error("Ukuran file terlalu kecil atau rusak.");
  }

  // Magic bytes check:
  // - PK\x03\x04 (ZIP / .docx)
  // - \xd0\xcf\x11\xe0 (OLE / .doc)
  const isZip = u8[0] === 0x50 && u8[1] === 0x4b && u8[2] === 0x03 && u8[3] === 0x04;
  const isOleDoc = u8[0] === 0xd0 && u8[1] === 0xcf && u8[2] === 0x11 && u8[3] === 0xe0;

  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  let format: "DOC" | "DOCX";
  let data: HargaBrandResult[];

  if (isZip || ext === "docx") {
    format = "DOCX";
    data = await extractHargaDocxFromBuffer(u8);
  } else if (isOleDoc || ext === "doc") {
    format = "DOC";
    data = extractHargaDocFromBuffer(u8);
  } else {
    throw new Error(`Format file tidak dikenali (.${ext}). Silakan unggah file berformat .doc atau .docx.`);
  }

  const totalUnits = data.reduce((acc, brand) => acc + brand.detail.length, 0);

  return {
    data,
    format,
    fileName,
    totalUnits
  };
}
