"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpenText, ChevronDown, Download, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/confirm-modal";
import { LogbookForm } from "@/components/logbook-form";
import { LogbookImportModal } from "@/components/logbook-import-modal";
import { LogbookPreview } from "@/components/logbook-preview";
import {
  clearSavedProfile,
  createActivity,
  defaultLogbook,
  getSavedProfile,
  logbookFilename,
  saveProfile,
  todayISODate,
  type LogbookActivity,
} from "@/lib/logbook";
import { exportLogbookPdf } from "@/lib/logbook-pdf";

export default function Page() {
  const [data, setData] = useState(defaultLogbook);
  const [exporting, setExporting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [confirmResetKegiatanOpen, setConfirmResetKegiatanOpen] = useState(false);
  const [confirmResetSemuaOpen, setConfirmResetSemuaOpen] = useState(false);
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);
  const resetMenuRef = useRef<HTMLDivElement>(null);

  // Close reset dropdown when clicking outside
  useEffect(() => {
    if (!isResetMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resetMenuRef.current &&
        !resetMenuRef.current.contains(e.target as Node)
      ) {
        setIsResetMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isResetMenuOpen]);

  // Muat data profil tersimpan dari localStorage saat pertama kali render
  useEffect(() => {
    const saved = getSavedProfile();
    if (Object.keys(saved).length > 0) {
      setData((prev) => ({
        ...prev,
        ...saved,
        namaMahasiswa: saved.nama || prev.namaMahasiswa,
      }));
    }
    setIsLoaded(true);
  }, []);

  // Simpan data diri ke localStorage setiap kali ada perubahan
  useEffect(() => {
    if (!isLoaded) return;
    saveProfile({
      nama: data.nama,
      nim: data.nim,
      programStudi: data.programStudi,
      namaMitra: data.namaMitra,
      namaPembimbing: data.namaPembimbing,
      namaMentor: data.namaMentor,
      ttdMahasiswa: data.ttdMahasiswa,
    });
  }, [
    isLoaded,
    data.nama,
    data.nim,
    data.programStudi,
    data.namaMitra,
    data.namaPembimbing,
    data.namaMentor,
    data.ttdMahasiswa,
  ]);

  const filename = useMemo(
    () => logbookFilename(data.nama || data.namaMahasiswa),
    [data.nama, data.namaMahasiswa],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportLogbookPdf(data);
    } finally {
      setExporting(false);
    }
  };

  // Import baris kegiatan dari file / teks
  const handleImportActivities = (
    imported: LogbookActivity[],
    mode: "replace" | "append",
  ) => {
    setData((prev) => ({
      ...prev,
      activities:
        mode === "replace"
          ? imported
          : [...prev.activities, ...imported],
    }));
  };

  // Reset baris kegiatan logbook saja (data diri tetap tersimpan)
  const handleResetKegiatan = () => {
    setData((prev) => ({
      ...prev,
      activities: Array.from({ length: 5 }, () => createActivity()),
    }));
  };

  // Reset seluruh data termasuk profil di localStorage
  const handleResetSemua = () => {
    clearSavedProfile();
    setData(defaultLogbook());
  };

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <BookOpenText className="size-5 text-primary" />
            <div>
              <h1 className="text-base leading-tight font-semibold">
                Generator Logbook Magang
              </h1>
              <p className="text-xs text-muted-foreground">
                Sesuai template Polinema (docs/template-logbook.pdf) • {todayISODate()}
              </p>
            </div>
          </div>
          <div className="ms-auto flex items-center gap-2">
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
                        Reset Kegiatan
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Kosongkan kegiatan, data diri tetap aman
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
                        Hapus data diri, profil, dan kegiatan
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Aksi Utama: Export PDF */}
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="font-semibold shadow-xs"
            >
              <Download className="size-4" />
              {exporting ? "Mengekspor…" : "Export PDF"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <section aria-label="Form input logbook" className="min-w-0">
          <LogbookForm
            data={data}
            onChange={setData}
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
      </main>

      {/* Modal Import Teks / File */}
      <LogbookImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportActivities}
        currentActivityCount={data.activities.length}
      />

      {/* Modal Konfirmasi: Reset Kegiatan */}
      <ConfirmModal
        isOpen={confirmResetKegiatanOpen}
        onClose={() => setConfirmResetKegiatanOpen(false)}
        onConfirm={handleResetKegiatan}
        title="Kosongkan Tabel Kegiatan?"
        description="Seluruh baris kegiatan logbook akan dikosongkan kembali ke 5 hari awal. Data diri, mitra, dan pembimbing Anda tetap aman tersimpan."
        confirmLabel="Ya, Kosongkan Kegiatan"
        variant="warning"
      />

      {/* Modal Konfirmasi: Hapus Semua Data */}
      <ConfirmModal
        isOpen={confirmResetSemuaOpen}
        onClose={() => setConfirmResetSemuaOpen(false)}
        onConfirm={handleResetSemua}
        title="Hapus Semua Data Termasuk Profil?"
        description="Seluruh data diri mahasiswa, mitra, pembimbing, tanda tangan, dan tabel kegiatan yang tersimpan di browser akan dihapus permanen."
        confirmLabel="Ya, Hapus Permanen"
        variant="destructive"
      />
    </div>
  );
}

