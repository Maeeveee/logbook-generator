import { createActivity, type LogbookActivity } from "./logbook";

/**
 * Normalizes time string to standard "HH:mm" (24-hour format).
 * Accepts: "8:00", "08:00", "8.00", "08.00", "08:00:00"
 */
export function normalizeTime(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim().replace(".", ":");
  const match = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hour = match[1].padStart(2, "0");
  const minute = match[2];
  const hNum = parseInt(hour, 10);
  const mNum = parseInt(minute, 10);
  if (hNum < 0 || hNum > 23 || mNum < 0 || mNum > 59) return "";
  return `${hour}:${minute}`;
}

/**
 * Extracts start and end times from a time range string.
 * Example: "08:00 - 17:00", "08.00 s/d 16.30", "08:00-17:00", "08:00 to 17:00"
 */
export function extractTimeRange(raw: string): { masuk: string; pulang: string } {
  if (!raw) return { masuk: "", pulang: "" };
  const parts = raw.split(/\s*(?:-|–|—|s\/?d|to|sampai)\s*/i);
  if (parts.length >= 2) {
    return {
      masuk: normalizeTime(parts[0]),
      pulang: normalizeTime(parts[1]),
    };
  }
  return { masuk: normalizeTime(raw), pulang: "" };
}

/**
 * Parses JSON content (either array of activities or object containing activities array).
 */
function tryParseJson(text: string): LogbookActivity[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    let items: Record<string, unknown>[] = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && typeof parsed === "object" && Array.isArray(parsed.activities)) {
      items = parsed.activities;
    } else {
      return null;
    }

    if (items.length === 0) return [];

    return items.map((item) => {
      const act = createActivity();
      act.hariTanggal = String(item.hariTanggal ?? item.tanggal ?? item.date ?? item.day ?? "").trim();
      act.jamMasuk = normalizeTime(String(item.jamMasuk ?? item.masuk ?? item.startTime ?? ""));
      act.jamPulang = normalizeTime(String(item.jamPulang ?? item.pulang ?? item.endTime ?? ""));
      act.kegiatan = String(item.kegiatan ?? item.activity ?? item.deskripsi ?? item.description ?? "").trim();
      return act;
    });
  } catch {
    return null;
  }
}

/**
 * Check if a text row looks like a header (contains common column labels)
 */
function isHeaderRow(line: string): boolean {
  const lower = line.toLowerCase();
  const headerKeywords = [
    "hari",
    "tanggal",
    "kegiatan",
    "jam masuk",
    "jam pulang",
    "waktu",
    "aktivitas",
    "deskripsi",
  ];
  let matches = 0;
  for (const kw of headerKeywords) {
    if (lower.includes(kw)) matches++;
  }
  return matches >= 2;
}

/**
 * Splits a CSV/delimited line properly taking quotes into account.
 */
function splitDelimitedLine(line: string, delimiter: string): string[] {
  if (delimiter === "|") {
    return line.split("|").map((col) => col.trim());
  }

  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Detect delimiter used across multiple lines.
 */
function detectDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 10).filter((l) => l.trim().length > 0);
  const counts = { "|": 0, "\t": 0, ";": 0, ",": 0 };

  for (const line of sample) {
    if (line.includes("|")) counts["|"]++;
    if (line.includes("\t")) counts["\t"]++;
    if (line.includes(";")) counts[";"]++;
    if (line.includes(",")) counts[","]++;
  }

  if (counts["|"] > 0) return "|";
  if (counts["\t"] > 0) return "\t";
  if (counts[";"] > 0) return ";";
  if (counts[","] > 0) return ",";
  return "|";
}

/**
 * Parse block/key-value format:
 * Hari/Tanggal: Senin, 01/09/2026
 * Jam: 08:00 - 17:00
 * Kegiatan: Merancang sistem
 */
function parseKeyValueBlocks(lines: string[]): LogbookActivity[] | null {
  const hasKeyIndicators = lines.some((l) =>
    /^(?:hari|tanggal|tgl|jam|waktu|masuk|pulang|kegiatan|aktivitas)\s*:/i.test(l.trim()),
  );

  if (!hasKeyIndicators) return null;

  const activities: LogbookActivity[] = [];
  let current: Partial<LogbookActivity> | null = null;

  const pushCurrent = () => {
    if (current && (current.hariTanggal || current.kegiatan || current.jamMasuk)) {
      const act = createActivity();
      act.hariTanggal = current.hariTanggal || "";
      act.jamMasuk = current.jamMasuk || "";
      act.jamPulang = current.jamPulang || "";
      act.kegiatan = current.kegiatan || "";
      activities.push(act);
    }
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || /^[-=_*]{3,}$/.test(line)) {
      // Separator or empty line
      pushCurrent();
      continue;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const val = line.slice(colonIdx + 1).trim();

      if (!current) current = {};

      if (key.includes("hari") || key.includes("tanggal") || key === "tgl" || key === "date") {
        if (current.hariTanggal) {
          // New block started without empty line
          pushCurrent();
          current = {};
        }
        current.hariTanggal = val;
      } else if (key.includes("masuk") || key === "start") {
        current.jamMasuk = normalizeTime(val);
      } else if (key.includes("pulang") || key === "keluar" || key === "end") {
        current.jamPulang = normalizeTime(val);
      } else if (key.includes("jam") || key.includes("waktu") || key === "time") {
        const tr = extractTimeRange(val);
        current.jamMasuk = tr.masuk;
        current.jamPulang = tr.pulang;
      } else if (key.includes("kegiatan") || key.includes("aktivitas") || key.includes("pekerjaan") || key.includes("desc")) {
        current.kegiatan = val;
      } else if (current.kegiatan) {
        current.kegiatan += ` ${line}`;
      }
    } else if (current) {
      if (current.kegiatan) {
        current.kegiatan += `\n${line}`;
      }
    }
  }

  pushCurrent();
  return activities.length > 0 ? activities : null;
}

/**
 * Main parser function: Converts raw text (dropped file or pasted text)
 * into a structured list of LogbookActivity.
 */
export function parseLogbookText(input: string): LogbookActivity[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // 1. Try JSON
  const jsonResult = tryParseJson(trimmed);
  if (jsonResult && jsonResult.length > 0) {
    return jsonResult;
  }

  const rawLines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) return [];

  // 2. Try Key-Value Blocks
  const blockResult = parseKeyValueBlocks(rawLines);
  if (blockResult && blockResult.length > 0) {
    return blockResult;
  }

  // 3. Delimited (Pipe, TSV, CSV, Semicolon)
  const delimiter = detectDelimiter(rawLines);
  const activities: LogbookActivity[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Skip potential header row on first 2 lines
    if (i <= 1 && isHeaderRow(line)) {
      continue;
    }

    const cols = splitDelimitedLine(line, delimiter);

    // Filter out completely empty rows or table divider lines (e.g. Markdown |---|---|)
    if (cols.every((c) => !c || /^[-:]+$/.test(c))) {
      continue;
    }

    const act = createActivity();

    if (cols.length >= 4) {
      // Format: Hari/Tanggal | Jam Masuk | Jam Pulang | Kegiatan (or more columns joined)
      act.hariTanggal = cols[0];
      act.jamMasuk = normalizeTime(cols[1]);
      act.jamPulang = normalizeTime(cols[2]);
      act.kegiatan = cols.slice(3).join(" | ");
    } else if (cols.length === 3) {
      act.hariTanggal = cols[0];
      // Check if second column is a time range like "08:00 - 17:00"
      const tr = extractTimeRange(cols[1]);
      if (tr.masuk && tr.pulang) {
        act.jamMasuk = tr.masuk;
        act.jamPulang = tr.pulang;
        act.kegiatan = cols[2];
      } else {
        // Col 1 is jamMasuk, Col 2 is Kegiatan, or Col 1 is Kegiatan Col 2 is desc
        if (tr.masuk) {
          act.jamMasuk = tr.masuk;
          act.kegiatan = cols[2];
        } else {
          act.kegiatan = `${cols[1]} - ${cols[2]}`;
        }
      }
    } else if (cols.length === 2) {
      act.hariTanggal = cols[0];
      // Check if col 1 has time or is purely kegiatan
      const tr = extractTimeRange(cols[1]);
      if (tr.masuk && tr.pulang) {
        act.jamMasuk = tr.masuk;
        act.jamPulang = tr.pulang;
      } else {
        act.kegiatan = cols[1];
      }
    } else if (cols.length === 1) {
      // Single line freeform, e.g. "Senin, 01/09/2026: (08:00 - 17:00) Diskusi modul auth"
      const single = cols[0];
      // Try extracting time range
      const timeMatch = single.match(/(\d{1,2}[:.]\d{2})\s*(?:-|–|—|s\/?d|to)\s*(\d{1,2}[:.]\d{2})/);
      let rest = single;
      if (timeMatch) {
        act.jamMasuk = normalizeTime(timeMatch[1]);
        act.jamPulang = normalizeTime(timeMatch[2]);
        rest = single.replace(timeMatch[0], "").replace(/[()]/g, " ").trim();
      }

      // Try split by first colon or dash for date vs kegiatan
      const splitPoint = rest.search(/[:\-–—]\s+/);
      if (splitPoint > 0 && splitPoint < 40) {
        act.hariTanggal = rest.slice(0, splitPoint).trim();
        act.kegiatan = rest.slice(splitPoint + 1).replace(/^[:\-–—]\s*/, "").trim();
      } else {
        act.kegiatan = rest;
      }
    }

    if (act.hariTanggal || act.kegiatan || act.jamMasuk) {
      activities.push(act);
    }
  }

  return activities;
}

/** Sample templates for the user */
export const SAMPLE_PIPE_TEXT = `Senin, 01/09/2026 | 08:00 | 17:00 | Pengenalan lingkungan kerja dan briefing proyek bersama pembimbing
Selasa, 02/09/2026 | 08:00 | 16:30 | Setup environment development dan analisis kebutuhan fitur
Rabu, 03/09/2026 | 08:00 | 17:00 | Slicing antarmuka dashboard admin dan perbaikan layout responsif
Kamis, 04/09/2026 | 08:00 | 17:00 | Integrasi API authentication dan pengujian form login
Jumat, 05/09/2026 | 08:00 | 15:30 | Evaluasi mingguan bersama mentor lapangan dan dokumentasi tugas`;

export const SAMPLE_CSV_TEXT = `Hari/Tanggal,Jam Masuk,Jam Pulang,Kegiatan
"Senin, 01/09/2026","08:00","17:00","Pengenalan lingkungan kerja dan briefing proyek bersama pembimbing"
"Selasa, 02/09/2026","08:00","16:30","Setup environment development dan analisis kebutuhan fitur"
"Rabu, 03/09/2026","08:00","17:00","Slicing antarmuka dashboard admin dan perbaikan layout responsif"
"Kamis, 04/09/2026","08:00","17:00","Integrasi API authentication dan pengujian form login"
"Jumat, 05/09/2026","08:00","15:30","Evaluasi mingguan bersama mentor lapangan dan dokumentasi tugas"`;

export const SAMPLE_BLOCK_TEXT = `Hari/Tanggal: Senin, 01/09/2026
Jam: 08:00 - 17:00
Kegiatan: Pengenalan lingkungan kerja dan briefing proyek bersama pembimbing

Hari/Tanggal: Selasa, 02/09/2026
Jam: 08:00 - 16:30
Kegiatan: Setup environment development dan analisis kebutuhan fitur

Hari/Tanggal: Rabu, 03/09/2026
Jam: 08:00 - 17:00
Kegiatan: Slicing antarmuka dashboard admin dan perbaikan layout responsif`;
