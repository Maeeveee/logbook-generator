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

export interface LogbookWeek {
  id: string;
  weekNumber: number;
  month?: string; // e.g. "2026-09"
  activities: LogbookActivity[];
}

export interface LogbookData extends LogbookProfile {
  namaMahasiswa: string;
  activities: LogbookActivity[];
  weekNumber?: number;
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

const STORAGE_WEEKS_KEY = "logbook_saved_weeks";
const STORAGE_ACTIVE_WEEK_KEY = "logbook_saved_active_week_id";

export function createDefaultWeek(weekNumber = 1, month?: string): LogbookWeek {
  let dates: string[] = [];
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    dates = getWorkdaysForMonthWeek(y, m, weekNumber);
  }
  const activities = Array.from({ length: 5 }, (_, i) =>
    createActivity({
      hariTanggal: dates[i] || "",
      jamMasuk: "08:00",
      jamPulang: "16:00",
    }),
  );
  return {
    id: `week-${weekNumber}-${Date.now()}`,
    weekNumber,
    month,
    activities,
  };
}

export function isWeekModified(w: LogbookWeek): boolean {
  if (w.activities.length !== 5) return true;
  return w.activities.some(
    (a) =>
      Boolean(a.kegiatan && a.kegiatan.trim() !== "") ||
      (a.jamMasuk && a.jamMasuk !== "08:00") ||
      (a.jamPulang && a.jamPulang !== "16:00"),
  );
}

export function getSavedWeeks(): LogbookWeek[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_WEEKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Menyimpan seluruh data minggu yang aktif/terbuka ke localStorage
 * sehingga seluruh tab minggu pada bulan yang dipilih tetap utuh dan lengkap saat reload.
 */
export function saveWeeks(weeks: LogbookWeek[], activeWeekId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_WEEKS_KEY, JSON.stringify(weeks));
  } catch (err) {
    console.warn("Gagal menyimpan data minggu ke localStorage:", err);
  }
}

export function clearSavedWeeks(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_WEEKS_KEY);
    localStorage.removeItem(STORAGE_ACTIVE_WEEK_KEY);
  } catch {
    /* ignore */
  }
}

export function getSavedActiveWeekId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_ACTIVE_WEEK_KEY);
  } catch {
    return null;
  }
}

export function saveActiveWeekId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_ACTIVE_WEEK_KEY, id);
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
  maxWidth = 320,
  maxHeight = 160,
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

export function createActivity(
  initial?: Partial<LogbookActivity>,
): LogbookActivity {
  return {
    id:
      initial?.id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    hariTanggal: initial?.hariTanggal || "",
    jamMasuk: initial?.jamMasuk !== undefined ? initial.jamMasuk : "08:00",
    jamPulang: initial?.jamPulang !== undefined ? initial.jamPulang : "16:00",
    kegiatan: initial?.kegiatan || "",
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
  // Lewati akhir pekan (Sabtu=6, Minggu=0) jika tanggal mulai jatuh di akhir pekan
  while (curr.getDay() === 0 || curr.getDay() === 6) {
    curr.setDate(curr.getDate() + 1);
  }
  while (results.length < count) {
    if (curr.getDay() !== 0 && curr.getDay() !== 6) {
      results.push(formatDateToIndonesian(curr));
    }
    curr.setDate(curr.getDate() + 1);
  }
  return results;
}

export interface MonthWeekOption {
  weekIndex: number;
  startDate: Date;
  endDate: Date;
  label: string;
  shortLabel: string;
  dates: string[];
}

export function getFirstMondayOfMonth(year: number, month: number): Date {
  const firstDay = new Date(year, month - 1, 1);
  const dayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const monday = new Date(firstDay);
  if (dayOfWeek === 1) {
    return monday;
  } else if (dayOfWeek >= 2 && dayOfWeek <= 4) {
    // Selasa, Rabu, Kamis -> Hari Senin dari minggu yang sama
    monday.setDate(monday.getDate() - (dayOfWeek - 1));
    return monday;
  } else {
    // Jumat (5), Sabtu (6), Minggu (0) -> Hari Senin minggu pertama berikutnya
    const daysUntilNextMonday = (8 - dayOfWeek) % 7 || 7;
    monday.setDate(monday.getDate() + daysUntilNextMonday);
    return monday;
  }
}

export function formatDateShort(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}`;
}

export function getMonthWeekOptions(
  year: number,
  month: number,
): MonthWeekOption[] {
  const firstMon = getFirstMondayOfMonth(year, month);
  const options: MonthWeekOption[] = [];

  for (let w = 1; w <= 5; w++) {
    const startMon = new Date(firstMon);
    startMon.setDate(startMon.getDate() + (w - 1) * 7);

    // Jika hari Senin sudah berada di bulan berikutnya, hentikan opsi
    if (w > 1 && startMon.getMonth() !== month - 1) {
      break;
    }

    const endFri = new Date(startMon);
    endFri.setDate(endFri.getDate() + 4);

    const dates = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(startMon);
      d.setDate(d.getDate() + i);
      return formatDateToIndonesian(d);
    });

    options.push({
      weekIndex: w,
      startDate: startMon,
      endDate: endFri,
      label: `Minggu ${w} (${formatDateShort(startMon)} - ${formatDateShort(endFri)})`,
      shortLabel: `${formatDateShort(startMon)} - ${formatDateShort(endFri)}`,
      dates,
    });
  }

  return options;
}

export function getWorkdaysForMonthWeek(
  year: number,
  month: number,
  weekIndex: number,
): string[] {
  const options = getMonthWeekOptions(year, month);
  const match = options.find((o) => o.weekIndex === weekIndex);
  if (match) return match.dates;
  const lastOption = options[options.length - 1];
  if (!lastOption) return [];
  const start = new Date(lastOption.startDate);
  start.setDate(start.getDate() + (weekIndex - lastOption.weekIndex) * 7);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return formatDateToIndonesian(d);
  });
}

export function extractMonthFromDateStr(str: string): string | null {
  const parsed = parseIndonesianDate(str);
  if (!parsed) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function extractDateShort(str: string): string {
  if (!str) return "";
  const match = str.match(/(\d{1,2})[\/\-](\d{1,2})/);
  return match
    ? `${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")}`
    : "";
}

export function getWeekDateRangeSummary(activities: LogbookActivity[]): string {
  const filled = activities.filter((a) => a.hariTanggal);
  if (filled.length === 0) return "";
  const first = extractDateShort(filled[0].hariTanggal);
  const last = extractDateShort(filled[filled.length - 1].hariTanggal);
  if (first && last && first !== last) return `${first} - ${last}`;
  return first;
}

export function getNextDateFrom(dateStr: string): string {
  const parsed = parseIndonesianDate(dateStr);
  if (!parsed) return "";
  parsed.setDate(parsed.getDate() + 1);
  return formatDateToIndonesian(parsed);
}

export function getNextMondayFrom(dateStr: string): Date | null {
  const parsed = parseIndonesianDate(dateStr);
  if (!parsed) return null;
  const curr = new Date(parsed);
  // Advance until next Monday (day 1)
  do {
    curr.setDate(curr.getDate() + 1);
  } while (curr.getDay() !== 1);
  return curr;
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

/** logbook-[name]-[minggu-X]-[date].pdf */
export function logbookFilename(
  nama: string,
  weekNumber?: number,
  d = new Date(),
): string {
  const weekPart = weekNumber ? `-minggu-${weekNumber}` : "";
  return `logbook-${slugifyName(nama)}${weekPart}-${todayISODate(d)}.pdf`;
}

/** logbook-[name]-bulan-[bulan-tahun]-[date].pdf */
export function monthlyLogbookFilename(
  nama: string,
  monthValue: string,
  d = new Date(),
): string {
  const found = AVAILABLE_MONTHS.find((m) => m.value === monthValue);
  const monthSlug = found ? slugifyName(found.label) : monthValue;
  return `logbook-${slugifyName(nama)}-bulan-${monthSlug}-${todayISODate(d)}.pdf`;
}

export const AVAILABLE_MONTHS = [
  { value: "2026-07", label: "Juli 2026", year: 2026, month: 7 },
  { value: "2026-08", label: "Agustus 2026", year: 2026, month: 8 },
  { value: "2026-09", label: "September 2026", year: 2026, month: 9 },
  { value: "2026-10", label: "Oktober 2026", year: 2026, month: 10 },
  { value: "2026-11", label: "November 2026", year: 2026, month: 11 },
  { value: "2026-12", label: "Desember 2026", year: 2026, month: 12 },
  { value: "2027-01", label: "Januari 2027", year: 2027, month: 1 },
  { value: "2027-02", label: "Februari 2027", year: 2027, month: 2 },
] as const;

export function initWeeksForMonth(
  monthValue: string,
  existingWeeks: LogbookWeek[] = [],
  defaultJamMasuk = "08:00",
  defaultJamPulang = "16:00",
): LogbookWeek[] {
  const foundMonth = AVAILABLE_MONTHS.find((m) => m.value === monthValue);
  const [y, m] = foundMonth
    ? [foundMonth.year, foundMonth.month]
    : monthValue.split("-").map(Number);

  const options = getMonthWeekOptions(y, m);
  const result: LogbookWeek[] = [...existingWeeks];

  options.forEach((opt) => {
    const weekId = `week-${monthValue}-w${opt.weekIndex}`;
    const exists = result.find(
      (w) =>
        w.id === weekId ||
        (w.month === monthValue && w.weekNumber === opt.weekIndex),
    );
    if (!exists) {
      result.push({
        id: weekId,
        weekNumber: opt.weekIndex,
        month: monthValue,
        activities: opt.dates.map((hariTanggal) =>
          createActivity({
            hariTanggal,
            jamMasuk: defaultJamMasuk,
            jamPulang: defaultJamPulang,
            kegiatan: "",
          }),
        ),
      });
    }
  });

  return result;
}

export function getCurrentMonthValue(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const val = `${y}-${m}`;
  const found = AVAILABLE_MONTHS.find((item) => item.value === val);
  return found ? found.value : "2026-09";
}

export function isCurrentCalendarWeek(
  week: LogbookWeek,
  referenceDate = new Date(),
): boolean {
  if (!week.activities || week.activities.length === 0) return false;

  const dates = week.activities
    .map((a) => parseIndonesianDate(a.hariTanggal))
    .filter((d): d is Date => d !== null);

  if (dates.length === 0) return false;

  const firstDate = new Date(dates[0]);
  firstDate.setHours(0, 0, 0, 0);

  const lastDate = new Date(dates[dates.length - 1]);
  // Jika hari terakhir adalah hari kerja Jumat (5), bentangkan hingga hari Minggu (tambah 2 hari)
  // agar pengguna yang mengakses logbook di hari Sabtu/Minggu tetap melihat badge "Minggu Ini"
  if (lastDate.getDay() === 5) {
    lastDate.setDate(lastDate.getDate() + 2);
  }
  lastDate.setHours(23, 59, 59, 999);

  return referenceDate >= firstDate && referenceDate <= lastDate;
}
