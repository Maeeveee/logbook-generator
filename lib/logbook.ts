export interface LogbookActivity {
  id: string;
  hariTanggal: string;
  jamMasuk: string;
  jamPulang: string;
  kegiatan: string;
}

export interface LogbookProfile {
  nama: string;
  nim: string;
  programStudi: string;
  namaMitra: string;
  namaPembimbing: string;
  namaMentor: string;
  ttdMahasiswa?: string;
}

export interface LogbookData extends LogbookProfile {
  namaMahasiswa: string;
  activities: LogbookActivity[];
}

const STORAGE_PROFILE_KEY = "logbook_saved_profile";

export function getSavedProfile(): Partial<LogbookProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveProfile(profile: Partial<LogbookProfile>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function clearSavedProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

export function resizeImageToDataURL(
  file: File,
  maxWidth = 400,
  maxHeight = 200,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function createActivity(): LogbookActivity {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    hariTanggal: "",
    jamMasuk: "",
    jamPulang: "",
    kegiatan: "",
  };
}

export function defaultLogbook(profile?: Partial<LogbookProfile>): LogbookData {
  return {
    nama: profile?.nama || "",
    nim: profile?.nim || "",
    programStudi: profile?.programStudi || "",
    namaMitra: profile?.namaMitra || "",
    namaMahasiswa: profile?.nama || "",
    namaPembimbing: profile?.namaPembimbing || "",
    namaMentor: profile?.namaMentor || "",
    ttdMahasiswa: profile?.ttdMahasiswa || "",
    activities: Array.from({ length: 5 }, () => createActivity()),
  };
}

export const NAMA_HARI_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export function formatDateToIndonesian(date: Date): string {
  const dayName = NAMA_HARI_ID[date.getDay()];
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${dayName}, ${d}/${m}/${y}`;
}

export function parseIndonesianDate(str: string): Date | null {
  if (!str) return null;
  const trimmed = str.trim();

  // 1. YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime())) return date;
  }

  // 2. Contains DD/MM/YYYY or DD-MM-YYYY
  const match = trimmed.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

export function generateWorkdayDates(startDate: Date, count = 5): string[] {
  const results: string[] = [];
  const curr = new Date(startDate);
  for (let i = 0; i < count; i++) {
    results.push(formatDateToIndonesian(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return results;
}

export function getNextDateFrom(dateStr: string): string {
  const parsed = parseIndonesianDate(dateStr);
  if (!parsed) return "";
  parsed.setDate(parsed.getDate() + 1);
  return formatDateToIndonesian(parsed);
}

export function slugifyName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "tanpa-nama";
}

export function todayISODate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** logbook-[name]-[date].pdf */
export function logbookFilename(nama: string, d = new Date()): string {
  return `logbook-${slugifyName(nama)}-${todayISODate(d)}.pdf`;
}


