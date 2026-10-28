import { ContentItem } from "./firebase";

/**
 * Robust RFC 4180 compliant CSV parser supporting multiline fields and quotes.
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const cleanText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',' || char === ';') {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  // Push last field if present
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  // Parse header
  const headers = rows[0].map(h => h.toLowerCase().replace(/[\s_-]+/g, ""));
  const dataRows = rows.slice(1);

  return dataRows.map(row => {
    const item: Record<string, string> = {};
    headers.forEach((header, idx) => {
      item[header] = row[idx] || "";
    });
    return item;
  });
}

/**
 * Converts parsed CSV rows into ContentItem array.
 */
export function convertRowsToContentItems(rows: Record<string, string>[], startingNo: number): ContentItem[] {
  return rows.map((r, idx) => {
    const no = parseInt(r.no || r.nomor || "") || (startingNo + idx);
    const executedVal = (r.executed || r.dieksekusi || r.selesai || r.status || "").toLowerCase();
    const isExecuted = executedVal === "true" || executedVal === "1" || executedVal === "ya" || executedVal === "sudah" || executedVal === "selesai";
    const priorityVal = (r.priority || r.prioritas || "").toLowerCase();
    const isPriority = priorityVal === "true" || priorityVal === "1" || priorityVal === "ya" || priorityVal === "yes";

    return {
      id: `konten-${no}`,
      no,
      kategori: r.kategori || r.category || "Edukasi & Tips",
      judul: r.judul || r.title || "Ide Konten Baru",
      copywriting: r.copywriting || r.teks || r.content || "",
      ambience: r.ambience || r.visual || r.arahanvisual || "",
      caption: r.caption || r.takarir || "",
      executed: isExecuted,
      priority: isPriority,
      platform: (r.platform as any) || "Instagram Feed",
      targetDate: r.targetdate || r.tanggal || "",
      updatedAt: new Date().toISOString()
    };
  });
}

/**
 * Generates CSV string from ContentItems
 */
export function contentItemsToCSV(items: ContentItem[]): string {
  const headers = ["no", "kategori", "judul", "copywriting", "ambience", "caption", "platform", "executed"];
  
  const escapeField = (val: any) => {
    const str = val === undefined || val === null ? "" : String(val);
    if (str.includes(",") || str.includes(";") || str.includes("\n") || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(","),
    ...items.map(item => [
      escapeField(item.no),
      escapeField(item.kategori),
      escapeField(item.judul),
      escapeField(item.copywriting),
      escapeField(item.ambience),
      escapeField(item.caption),
      escapeField(item.platform || "Instagram Feed"),
      escapeField(item.executed ? "true" : "false")
    ].join(","))
  ];

  return lines.join("\n");
}

export const SAMPLE_CSV_TEMPLATE = `no,kategori,judul,copywriting,ambience,caption,platform,executed
61,Edukasi & Spesifikasi,Perbedaan Kamera OIS vs EIS,"kamera stabil tanpa tripod?
kenali ois vs eis:
• ois: stabilisasi lensa fisik
• eis: stabilisasi sensor digital","Close-up modul lensa kamera bergerak halus","Kamera goyang saat jalan santai? OIS jawabannya! Cek koleksi kamera stabil kami.","Instagram Feed",false
62,Tips & Perawatan,Tips Bersihkan Layar HP,"layar kotor jangan asal semprot!
1. pakai kain microfiber
2. hindari alkohol keras
3. lap searah perlahan","Tangan membersihkan layar smartphone berkilau bersih","Layar jernih bikin nyaman dipakai kerja seharian. Mampir pasang tempered glass rapi di store!","Instagram Carousel",false`;

export const SAMPLE_JSON_TEMPLATE = `[
  {
    "no": 61,
    "kategori": "Edukasi & Spesifikasi",
    "judul": "Perbedaan Kamera OIS vs EIS",
    "copywriting": "kamera stabil tanpa tripod?\\nkenali ois vs eis:\\n• ois: stabilisasi lensa fisik\\n• eis: stabilisasi sensor digital",
    "ambience": "Close-up modul lensa kamera bergerak halus di atas meja studio",
    "caption": "Kamera goyang saat jalan santai? OIS solusinya! Konsultasikan ke admin kami.\\n\\nWa admin : 088272202241",
    "platform": "Instagram Feed",
    "executed": false
  }
]`;
