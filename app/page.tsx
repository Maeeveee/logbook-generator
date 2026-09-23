"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarRange,
  Check,
  ChevronDown,
  Download,
  FileText,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/confirm-modal";
import { LogbookForm } from "@/components/logbook-form";
import { LogbookImportModal } from "@/components/logbook-import-modal";
import { LogbookPreview } from "@/components/logbook-preview";
import { WeekSwitcher } from "@/components/week-switcher";
import {
  AVAILABLE_MONTHS,
  clearSavedProfile,
  clearSavedWeeks,
  createActivity,
  defaultLogbook,
  getCurrentMonthValue,
  getSavedActiveWeekId,
  getSavedProfile,
  getSavedWeeks,
  getWorkdaysForMonthWeek,
  initWeeksForMonth,
  isCurrentCalendarWeek,
  logbookFilename,
  monthlyLogbookFilename,
  saveActiveWeekId,
  saveProfile,
  saveWeeks,
  todayISODate,
  type LogbookActivity,
  type LogbookData,
  type LogbookWeek,
} from "@/lib/logbook";
import { exportLogbookPdf, exportMonthlyLogbookPdf } from "@/lib/logbook-pdf";

export default function Page() {
  const [data, setData] = useState(defaultLogbook);
  const [weeks, setWeeks] = useState<LogbookWeek[]>([]);
  const [activeWeekId, setActiveWeekId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");
  const [exporting, setExporting] = useState<"week" | "month" | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [confirmResetKegiatanOpen, setConfirmResetKegiatanOpen] = useState(false);
  const [confirmResetSemuaOpen, setConfirmResetSemuaOpen] = useState(false);
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const resetMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown reset & export jika klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        isResetMenuOpen &&
        resetMenuRef.current &&
        !resetMenuRef.current.contains(target)
      ) {
        setIsResetMenuOpen(false);
      }
      if (
        isExportMenuOpen &&
        exportMenuRef.current &&
        !exportMenuRef.current.contains(target)
      ) {
        setIsExportMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isResetMenuOpen, isExportMenuOpen]);

  // Muat data profil tersimpan dan inisialisasi minggu-minggu otomatis dari localStorage
  useEffect(() => {
    const savedProfile = getSavedProfile();
    const profileData =
      Object.keys(savedProfile).length > 0
        ? {
            ...savedProfile,
            namaMahasiswa: savedProfile.nama || "",
          }
        : {};

    // Tentukan bulan awal (prioritaskan bulan aktif sebelumnya atau bulan kalender saat ini)
    const currentMonthVal = getCurrentMonthValue();
    const savedActiveId = getSavedActiveWeekId();
    let loadedWeeks = getSavedWeeks();

    let targetMonth = currentMonthVal;
    const existingActive = loadedWeeks.find((w) => w.id === savedActiveId);
    if (existingActive && existingActive.month) {
      targetMonth = existingActive.month;
    }

    setSelectedMonth(targetMonth);

    // Inisialisasi seluruh minggu untuk bulan terpilih agar selalu lengkap (misal 5 minggu, bukan hanya 1)
    loadedWeeks = initWeeksForMonth(targetMonth, loadedWeeks);

    let activeWeek = loadedWeeks.find((w) => w.id === savedActiveId);
    if (!activeWeek || activeWeek.month !== targetMonth) {
      // Prioritaskan mencari minggu yang merupakan "Minggu Ini" di bulan ini
      const thisCalendarWeek = loadedWeeks.find(
        (w) => w.month === targetMonth && isCurrentCalendarWeek(w),
      );
      activeWeek =
        thisCalendarWeek ||
        loadedWeeks.find((w) => w.month === targetMonth) ||
        loadedWeeks[0];
    }

    const initialActiveId = activeWeek.id;
    saveActiveWeekId(initialActiveId);

    if (activeWeek.month) {
      setSelectedMonth(activeWeek.month);
    }

    setWeeks(loadedWeeks);
    setActiveWeekId(initialActiveId);
    setData((prev) => ({
      ...prev,
      ...profileData,
      weekNumber: activeWeek.weekNumber,
      activities: activeWeek.activities,
    }));
    setIsLoaded(true);
  }, []);

  // Debounced auto-save (500ms): Menghindari freeze / I/O disk berat pada setiap ketikan huruf
  useEffect(() => {
    if (!isLoaded) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      saveProfile({
        nama: data.nama,
        nim: data.nim,
        programStudi: data.programStudi,
        namaMitra: data.namaMitra,
        namaPembimbing: data.namaPembimbing,
        namaMentor: data.namaMentor,
        ttdMahasiswa: data.ttdMahasiswa,
      });

      if (weeks.length > 0) {
        saveWeeks(weeks, activeWeekId);
      }
      if (activeWeekId) {
        saveActiveWeekId(activeWeekId);
      }
      setIsSaving(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [
    isLoaded,
    data.nama,
    data.nim,
    data.programStudi,
    data.namaMitra,
    data.namaPembimbing,
    data.namaMentor,
    data.ttdMahasiswa,
    weeks,
    activeWeekId,
  ]);

  // Jaminan data tetap tersimpan saat tab browser ditutup atau di-refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProfile({
        nama: data.nama,
        nim: data.nim,
        programStudi: data.programStudi,
        namaMitra: data.namaMitra,
        namaPembimbing: data.namaPembimbing,
        namaMentor: data.namaMentor,
        ttdMahasiswa: data.ttdMahasiswa,
      });
      if (weeks.length > 0) {
        saveWeeks(weeks, activeWeekId);
      }
      if (activeWeekId) {
        saveActiveWeekId(activeWeekId);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [data, weeks, activeWeekId]);

  const filename = useMemo(
    () => logbookFilename(data.nama || data.namaMahasiswa, data.weekNumber),
    [data.nama, data.namaMahasiswa, data.weekNumber],
  );

  const handleExportWeek = async () => {
    setExporting("week");
    try {
      await exportLogbookPdf(data);
    } finally {
      setExporting(null);
    }
  };

  const handleExportMonth = async () => {
    setExporting("month");
    try {
      // Pastikan kegiatan aktif minggu saat ini tersinkronisasi ke daftar monthWeeks
      const currentMonthWeeks = weeks
        .filter((w) => w.month === selectedMonth)
        .map((w) =>
          w.id === activeWeekId ? { ...w, activities: data.activities } : w,
        );

      await exportMonthlyLogbookPdf(data, currentMonthWeeks, selectedMonth);
    } finally {
      setExporting(null);
    }
  };

  // Sinkronisasi data form ke state global dan baris minggu aktif
  const handleDataChange = (newData: LogbookData) => {
    setData(newData);
    setWeeks((prev) =>
      prev.map((w) =>
        w.id === activeWeekId
          ? {
              ...w,
              activities: newData.activities,
            }
          : w,
      ),
    );
  };

  // Pilih bulan dari dropdown: langsung tampilkan week-week di bulan tersebut tanpa perlu input apa-apa!
  const handleSelectMonth = (newMonth: string) => {
    setSelectedMonth(newMonth);

    // Ambil template jam kerja dari aktivitas sebelumnya jika ada
    let inheritedJamMasuk = "08:00";
    let inheritedJamPulang = "16:00";
    const currentWeek = weeks.find((w) => w.id === activeWeekId);
    if (currentWeek) {
      const firstFilled = currentWeek.activities.find(
        (a) => a.jamMasuk && a.jamPulang,
      );
      if (firstFilled) {
        inheritedJamMasuk = firstFilled.jamMasuk;
        inheritedJamPulang = firstFilled.jamPulang;
      }
    }

    // Pastikan seluruh week di bulan baru telah dibuat dengan tanggal otomatis
    const updatedWeeks = initWeeksForMonth(
      newMonth,
      weeks,
      inheritedJamMasuk,
      inheritedJamPulang,
    );
    setWeeks(updatedWeeks);

    // Pilih minggu pertama di bulan tersebut
    const firstWeekInNewMonth =
      updatedWeeks.find((w) => w.month === newMonth) || updatedWeeks[0];

    setActiveWeekId(firstWeekInNewMonth.id);
    setData((prev) => ({
      ...prev,
      weekNumber: firstWeekInNewMonth.weekNumber,
      activities: firstWeekInNewMonth.activities,
    }));
  };

  // Pilih tab minggu
  const handleSelectWeek = (id: string) => {
    const target = weeks.find((w) => w.id === id);
    if (!target) return;
    setActiveWeekId(id);
    if (target.month) {
      setSelectedMonth(target.month);
    }
    setData((prev) => ({
      ...prev,
      weekNumber: target.weekNumber,
      activities: target.activities,
    }));
  };

  // Import baris kegiatan dari file / teks ke minggu aktif
  const handleImportActivities = (
    imported: LogbookActivity[],
    mode: "replace" | "append",
  ) => {
    const newActivities =
      mode === "replace" ? imported : [...data.activities, ...imported];

    setData((prev) => ({
      ...prev,
      activities: newActivities,
    }));
    setWeeks((prev) =>
      prev.map((w) =>
        w.id === activeWeekId ? { ...w, activities: newActivities } : w,
      ),
    );
  };

  // Reset baris kegiatan logbook pada minggu aktif ke tanggal default awal bulan
  const handleResetKegiatan = () => {
    const activeWeek = weeks.find((w) => w.id === activeWeekId);
    const [y, m] = (activeWeek?.month || selectedMonth).split("-").map(Number);
    const defaultDates = getWorkdaysForMonthWeek(
      y,
      m,
      activeWeek?.weekNumber || 1,
    );

    const resetActivities = defaultDates.map((hariTanggal) =>
      createActivity({
        hariTanggal,
        jamMasuk: "08:00",
        jamPulang: "16:00",
        kegiatan: "",
      }),
    );

    setData((prev) => ({
      ...prev,
      activities: resetActivities,
    }));
    setWeeks((prev) =>
      prev.map((w) =>
        w.id === activeWeekId ? { ...w, activities: resetActivities } : w,
      ),
    );
  };

  // Reset seluruh data termasuk profil dan seluruh minggu di localStorage
  const handleResetSemua = () => {
    clearSavedProfile();
    clearSavedWeeks();
    const currentMonthVal = getCurrentMonthValue();
    const newWeeks = initWeeksForMonth(currentMonthVal, []);
    const thisCalendarWeek = newWeeks.find((w) => isCurrentCalendarWeek(w));
    const firstWeek = thisCalendarWeek || newWeeks[0];

    setSelectedMonth(currentMonthVal);
    setWeeks(newWeeks);
    setActiveWeekId(firstWeek.id);
    setData({
      ...defaultLogbook(),
      activities: firstWeek.activities,
      weekNumber: firstWeek.weekNumber,
    });
  };

  // Label bulan aktif saat ini untuk judul tampilan
  const currentMonthLabel = useMemo(() => {
    const found = AVAILABLE_MONTHS.find((m) => m.value === selectedMonth);
    return found ? found.label : selectedMonth;
  }, [selectedMonth]);

  return (
    <div className="min-h-svh bg-muted/40 flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/logo.webp"
              alt="Logo Logbook Magang"
              className="size-8 object-contain"
            />
            <h1 className="text-base leading-tight font-bold text-foreground">
              Logbook Magang
            </h1>
          </div>
          <div className="ms-auto flex items-center gap-2.5">
            {/* Indikator Status Auto-Save */}
            <div className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] sm:flex">
              {isSaving ? (
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  Menyimpan…
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Check className="size-3" />
                  Tersimpan
                </span>
              )}
            </div>

            <code className="hidden max-w-64 truncate rounded-md bg-muted px-2 py-1 font-mono text-[11px] xl:block">
              {filename}
            </code>

            {/* Menu Dropdown Reset Data */}
            <div className="relative" ref={resetMenuRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResetMenuOpen((p) => !p)}
                className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                title="Pilihan reset data logbook"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset</span>
                <ChevronDown className="size-3 opacity-60" />
              </Button>

              {isResetMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMenuOpen(false);
                      setConfirmResetKegiatanOpen(true);
                    }}
                    className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left text-xs transition-colors hover:bg-muted"
                  >
                    <RotateCcw className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">
                        Reset Minggu Ini
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Kosongkan kegiatan minggu {data.weekNumber || 1} ({currentMonthLabel})
                      </div>
                    </div>
                  </button>

                  <div className="my-1 border-t" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMenuOpen(false);
                      setConfirmResetSemuaOpen(true);
                    }}
                    className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left text-xs text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="mt-0.5 size-3.5 shrink-0" />
                    <div>
                      <div className="font-medium">Hapus Semua Data</div>
                      <div className="text-[11px] opacity-80">
                        Hapus profil dan seluruh riwayat logbook
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Menu Dropdown Export PDF */}
            <div className="relative" ref={exportMenuRef}>
              <Button
                size="sm"
                onClick={() => setIsExportMenuOpen((p) => !p)}
                disabled={exporting !== null}
                className="gap-1.5 font-semibold shadow-xs"
              >
                <Download className="size-4" />
                <span>
                  {exporting === "week"
                    ? "Mengekspor Minggu…"
                    : exporting === "month"
                      ? "Mengekspor Bulan…"
                      : "Download PDF"}
                </span>
                <ChevronDown className="size-3.5 opacity-80" />
              </Button>

              {isExportMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportWeek();
                    }}
                    className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left text-xs transition-colors hover:bg-muted"
                  >
                    <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <div className="font-semibold text-foreground">
                        Download Minggu Ini
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Minggu {data.weekNumber || 1} ({currentMonthLabel}) • 1 Lembar
                      </div>
                    </div>
                  </button>

                  <div className="my-1 border-t" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportMonth();
                    }}
                    className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left text-xs transition-colors hover:bg-primary/10"
                  >
                    <CalendarRange className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <div className="font-semibold text-primary">
                        Download 1 Bulan Penuh
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Semua minggu di bulan {currentMonthLabel} dalam 1 PDF
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6">
        {/* Switcher Bulan 2026 & Tab Minggu Otomatis */}
        <div className="mb-6">
          <WeekSwitcher
            weeks={weeks}
            activeWeekId={activeWeekId}
            selectedMonth={selectedMonth}
            onSelectMonth={handleSelectMonth}
            onSelectWeek={handleSelectWeek}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          <section aria-label="Form input logbook" className="min-w-0">
            <LogbookForm
              data={data}
              onChange={handleDataChange}
              onOpenImport={() => setIsImportOpen(true)}
            />
          </section>

          <section
            aria-label="Pratinjau template logbook"
            className="min-w-0 overflow-x-auto"
          >
            <div className="flex justify-center pb-10">
              <LogbookPreview data={data} />
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/60 py-4 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-medium text-muted-foreground">
            rizalabrar
          </p>
        </div>
      </footer>

      {/* Modal Import Teks / File */}
      <LogbookImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportActivities}
        currentActivityCount={data.activities.length}
      />

      {/* Modal Konfirmasi: Reset Kegiatan Minggu Ini */}
      <ConfirmModal
        isOpen={confirmResetKegiatanOpen}
        onClose={() => setConfirmResetKegiatanOpen(false)}
        onConfirm={handleResetKegiatan}
        title={`Kosongkan Kegiatan Minggu ${data.weekNumber || 1}?`}
        description={`Seluruh baris kegiatan pada Minggu ${data.weekNumber || 1} (${currentMonthLabel}) akan dikosongkan kembali ke tanggal awal. Profil Anda dan minggu lain tetap aman.`}
        confirmLabel="Ya, Kosongkan Minggu Ini"
        variant="warning"
      />

      {/* Modal Konfirmasi: Hapus Semua Data */}
      <ConfirmModal
        isOpen={confirmResetSemuaOpen}
        onClose={() => setConfirmResetSemuaOpen(false)}
        onConfirm={handleResetSemua}
        title="Hapus Semua Data Termasuk Profil?"
        description="Seluruh data diri mahasiswa, mitra, pembimbing, tanda tangan, dan seluruh riwayat logbook yang tersimpan di browser akan dihapus permanen."
        confirmLabel="Ya, Hapus Permanen"
        variant="destructive"
      />
    </div>
  );
}
