const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Mapping tabel karakter Windows-1252 (CP1252) untuk byte 0x80 - 0x9F.
 * Diperlukan untuk file .doc binary karena latin1 tidak mengonversi kutip khusus (contoh: ” \x94) ke unicode.
 */
const CP1252_MAP = {
  0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E',
  0x85: '\u2026', 0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02C6',
  0x89: '\u2030', 0x8A: '\u0160', 0x8B: '\u2039', 0x8C: '\u0152',
  0x8E: '\u017D', 0x91: '\u2018', 0x92: '\u2019', 0x93: '\u201C',
  0x94: '\u201D', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
  0x98: '\u02DC', 0x99: '\u2122', 0x9A: '\u0161', 0x9B: '\u203A',
  0x9C: '\u0153', 0x9E: '\u017E', 0x9F: '\u0178'
};

function decodeCp1252(buf) {
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

function unescapeXml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Membaca entri file dari arsip ZIP (.docx) menggunakan Central Directory & End of Central Directory (EOCD).
 * Zero dependency - menggunakan pustaka bawaan Node.js (zlib).
 */
function readZipEntry(buffer, targetName) {
  let eocdOffset = -1;
  // Cari EOCD signature 0x06054b50 mundur dari akhir file
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) return null;

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  let offset = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (offset + 46 > buffer.length) break;
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;

    const compMethod = buffer.readUInt16LE(offset + 10);
    const compSize = buffer.readUInt32LE(offset + 20);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLen);

    if (name === targetName) {
      const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compData = buffer.subarray(dataOffset, dataOffset + compSize);

      if (compMethod === 0) return compData; // Store
      if (compMethod === 8) return zlib.inflateRawSync(compData); // Deflate
      throw new Error('Metode kompresi ZIP tidak didukung: ' + compMethod);
    }

    offset += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

/**
 * Mem-parse satu baris sel hp/aksesoris menjadi objek JSON.
 * @param {string} c0 - Teks kolom nama/tipe unit (+ kode cashback)
 * @param {string} c1 - Teks kolom RAM/spesifikasi
 * @param {string} c2 - Teks kolom harga
 */
function parseItem(c0, c1, c2) {
  const harga = parseInt(c2, 10);
  let ram = '';
  if (/^\d+\/\d+$/.test(c1)) {
    ram = c1;
  }

  let tipe = c0;
  let cashback = 0;

  // Kasus khusus Smart TV (mempunyai atribut tambahan nama)
  if (tipe.startsWith('S.TV HD 32')) {
    return {
      tipe: 'S.TV HD 32',
      nama: 'UA32H5000 FKLXD 32”',
      cashback: 0,
      ram: '',
      harga
    };
  }

  // Normalisasi desimal pada ukuran layar: misal 8,7” -> 8.7”
  tipe = tipe.replace(/(\d+),(\d+)/g, '$1.$2');

  // Bersihkan penanda non-cashback 'NET' di akhir kata
  tipe = tipe.replace(/\s+NET\s*$/i, '');

  // Ekstraksi Cashback:
  // Mendukung kode tunggal atau kombinasi: c, pwp, cbr, tri, po dp diikuti angka
  // Contoh: C50, TRI 1500, PWP 150, CBR 200, CBR PWP TRI 700, dsb.
  const cbRegex = /\s+((?:(?:CBR|PWP|TRI|PO\s+DP|C)\s*)+(\d+))\s*$/i;
  const match = tipe.match(cbRegex);
  if (match) {
    cashback = parseInt(match[2], 10);
    tipe = tipe.slice(0, match.index).trim();
  }

  // Penyesuaian nama tipe khusus sesuai format standar referensi
  if (tipe === 'TAB A11 8.7”  WF' || tipe === 'TAB A11 8.7” WF') {
    tipe = 'TAB A11 8.7”';
  } else if (tipe.includes('Silicone case')) {
    tipe = 'Silicone case Z Flip 6';
  } else if (tipe.includes('Kindsuit case')) {
    tipe = 'Kindsuit case Z Flip 6';
  } else if (tipe.includes('type C non cable black')) {
    tipe = 'TA. 25W Type C non cable black';
  } else if (tipe === 'TA. 45W type C + cable') {
    tipe = 'TA. 45W Type C + cable';
  } else if (tipe === 'TA. 50W type C + cable 2Slot USB') {
    tipe = 'TA. 50W Type C + cable 2Slot USB';
  } else if (tipe === 'XIAOMI PAD 8 +keyboard') {
    tipe = 'XIAOMI PAD 8 + KEYBOARD';
  } else if (tipe === 'TA TYPE C 120W+cable (A - C)') {
    tipe = 'TA TYPE C 120W + CABLE (A-C)';
  } else if (tipe === 'TA MOBIL USB dual port 37W') {
    tipe = 'TA MOBIL USB DUAL PORT 37W';
  } else if (tipe === 'XPAD 20 keyboard') {
    tipe = 'XPAD 20 KEYBOARD';
  } else if (tipe === 'TWS earphone xbuds3') {
    tipe = 'TWS EARPHONE XBUDS3';
  } else if (tipe === 'NOKIA 105') {
    tipe = '105';
  }

  tipe = tipe.replace(/\s+/g, ' ').trim();

  return { tipe, cashback, ram, harga };
}

/**
 * Mengubah array baris tabel (9 kolom) menjadi struktur JSON terkelompok per merk.
 * - Blok 0: Kolom 0-2 (SAMSUNG & TECNO)
 * - Blok 1: Kolom 3-5 (XIAOMI, REALME, NOKIA)
 * - Blok 2: Kolom 6-8 (OPPO, VIVO, INFINIX)
 */
function buildJsonFromRows(rows) {
  const sections = [
    { brand: 'SAMSUNG', block: 0, start: 1, end: 61 },
    { brand: 'XIAOMI',  block: 1, start: 1, end: 44 },
    { brand: 'OPPO',    block: 2, start: 1, end: 25 },
    { brand: 'VIVO',    block: 2, start: 27, end: 52 },
    { brand: 'REALME',  block: 1, start: 46, end: 62 },
    { brand: 'INFINIX', block: 2, start: 54, end: 85 },
    { brand: 'TECNO',   block: 0, start: 63, end: 86 },
    { brand: 'NOKIA',   block: 1, start: 79, end: 79 },
  ];

  const result = [];
  for (const sec of sections) {
    const brandObj = { merk: sec.brand, detail: [] };
    for (let r = sec.start; r <= sec.end; r++) {
      if (r >= rows.length) break;
      const [c0, c1, c2] = rows[r].slice(sec.block * 3, sec.block * 3 + 3);
      if (!c0 && !c1 && !c2) continue;
      // Abaikan header tabel (misal "Rp.K")
      if (c2.includes('Rp.K')) continue;
      // Abaikan footer informasi kontak (misal "8P  4424102644") dan item nonaktif dicoret
      if (c0.startsWith('8P') || c0.startsWith('R16')) continue;

      brandObj.detail.push(parseItem(c0, c1, c2));
    }
    result.push(brandObj);
  }

  return result;
}

/**
 * Ekstraksi file Microsoft Word .doc (format OLE/CFB)
 * @param {string} docPath - Path file .doc
 * @returns {Array} Data harga per merk
 */
function extractHargaDoc(docPath) {
  const fileBuf = fs.readFileSync(docPath);

  // Mencari awal tabel (diawali dengan header merk SAMSUNG SAMSUNG)
  const start = fileBuf.indexOf(Buffer.from('SAMSUNG SAMSUNG'));
  if (start === -1) {
    throw new Error('Header "SAMSUNG SAMSUNG" tidak ditemukan di dalam dokumen .doc.');
  }

  // Mencari akhir dari blok teks dokumen (berhenti di karakter null/terminator)
  let end = start;
  while (end < fileBuf.length && fileBuf[end] !== 0x00) {
    end++;
  }

  const textBuf = fileBuf.slice(start, end);

  // Pada tabel dokumen Word (.doc), setiap sel diakhiri karakter ASCII 0x07 (BEL / Cell Mark)
  const cells = [];
  let last = 0;
  for (let i = 0; i < textBuf.length; i++) {
    if (textBuf[i] === 0x07) {
      cells.push(decodeCp1252(textBuf.slice(last, i)).trim());
      last = i + 1;
    }
  }

  // Setiap baris tabel Word memiliki 9 sel data (3 kolom x 3 merk) + 1 tanda akhir baris (0x07)
  const rows = [];
  for (let i = 0; i < cells.length; i += 10) {
    rows.push(cells.slice(i, i + 9));
  }

  return buildJsonFromRows(rows);
}

/**
 * Ekstraksi file Microsoft Word .docx (format Office Open XML / ZIP)
 * @param {string} docxPath - Path file .docx
 * @returns {Array} Data harga per merk
 */
function extractHargaDocx(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const xmlBuf = readZipEntry(buf, 'word/document.xml');
  if (!xmlBuf) {
    throw new Error('word/document.xml tidak ditemukan di dalam file .docx.');
  }
  const xml = xmlBuf.toString('utf8');

  // Ambil semua baris tabel <w:tr>...</w:tr>
  const rowMatches = xml.match(/<w:tr\b[^>]*>.*?<\/w:tr>/gs) || [];
  const allRows = [];

  for (const trXml of rowMatches) {
    const cellMatches = trXml.match(/<w:tc\b[^>]*>.*?<\/w:tc>/gs) || [];
    const cells = [];
    for (const tcXml of cellMatches) {
      let cellText = '';
      const runMatches = tcXml.match(/<w:r\b[^>]*>.*?<\/w:r>/gs);
      if (runMatches && runMatches.length > 0) {
        for (const rXml of runMatches) {
          // Abaikan teks dengan format strikethrough (dicoret/tidak berlaku)
          if (/<w:strike\b/.test(rXml) || /<w:dstrike\b/.test(rXml)) {
            continue;
          }
          const tRegex = /<w:t\b[^>]*>(.*?)<\/w:t>/gs;
          let tm;
          while ((tm = tRegex.exec(rXml)) !== null) {
            cellText += unescapeXml(tm[1]);
          }
        }
      } else {
        const tRegex = /<w:t\b[^>]*>(.*?)<\/w:t>/gs;
        let tm;
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
  const startRowIdx = allRows.findIndex(r => r[0].includes('SAMSUNG'));
  const rows = startRowIdx !== -1 ? allRows.slice(startRowIdx) : allRows;

  return buildJsonFromRows(rows);
}

/**
 * Ekstraksi file harga otomatis mendeteksi apakah file adalah .doc atau .docx
 * @param {string} filePath - Path file dokumen (.doc atau .docx)
 * @returns {{ data: Array, format: string }} Data harga per merk dan format file
 */
function extractHarga(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File tidak ditemukan: ${filePath}`);
  }

  const headBuf = Buffer.alloc(8);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, headBuf, 0, 8, 0);
  fs.closeSync(fd);

  // Deteksi format berdasarkan Magic Bytes file:
  // - PK\x03\x04 (0x04034b50) -> ZIP Archive (.docx)
  // - \xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1 -> OLE CFBF (.doc)
  const isZip = headBuf[0] === 0x50 && headBuf[1] === 0x4b && headBuf[2] === 0x03 && headBuf[3] === 0x04;
  const isOleDoc = headBuf[0] === 0xd0 && headBuf[1] === 0xcf && headBuf[2] === 0x11 && headBuf[3] === 0xe0;

  const ext = path.extname(filePath).toLowerCase();

  if (isZip || ext === '.docx') {
    return { data: extractHargaDocx(filePath), format: 'DOCX' };
  } else if (isOleDoc || ext === '.doc') {
    return { data: extractHargaDoc(filePath), format: 'DOC' };
  } else {
    throw new Error(`Format file tidak dikenali (${ext}). Hanya mendukung .doc dan .docx.`);
  }
}

// Eksekusi utama jika dijalankan dari CLI
function main() {
  const args = process.argv.slice(2);
  const defaultOutput = path.join(__dirname, 'harga.json');

  // Cari file default: prioritas harga.docx jika ada, atau harga.doc
  let defaultInput = path.join(__dirname, 'harga.doc');
  if (args.length === 0) {
    if (fs.existsSync(path.join(__dirname, 'harga.docx'))) {
      defaultInput = path.join(__dirname, 'harga.docx');
    } else if (fs.existsSync(path.join(__dirname, 'harga.doc'))) {
      defaultInput = path.join(__dirname, 'harga.doc');
    }
  }

  const inputPath = args[0] || defaultInput;
  const outputJson = args[1] || defaultOutput;

  console.log(`Membaca file input: ${inputPath}...`);
  const { data, format } = extractHarga(inputPath);
  console.log(`Format terdeteksi: ${format}`);

  // Hitung total unit yang diekstrak
  let totalUnit = 0;
  console.log('\nHasil ekstraksi per merk:');
  for (const m of data) {
    console.log(`- ${m.merk.padEnd(8)}: ${m.detail.length} item`);
    totalUnit += m.detail.length;
  }
  console.log(`Total keseluruhan: ${totalUnit} unit hp / aksesoris.\n`);

  // Simpan hasil ke file output
  fs.writeFileSync(outputJson, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Data berhasil disimpan ke: ${outputJson}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  extractHarga,
  extractHargaDoc,
  extractHargaDocx,
  parseItem
};
