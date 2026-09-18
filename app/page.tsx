"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Download, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogbookForm } from "@/components/logbook-form";
import { LogbookPreview } from "@/components/logbook-preview";
import {
  clearSavedProfile,
  createActivity,
  defaultLogbook,
  getSavedProfile,
  logbookFilename,
  saveProfile,
  todayISODate,
} from "@/lib/logbook";
import { exportLogbookPdf } from "@/lib/logbook-pdf";

export default function Page() {
  const [data, setData] = useState(defaultLogbook);
  const [exporting, setExporting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Reset baris kegiatan logbook saja (data diri tetap tersimpan)
  const handleResetKegiatan = () => {
    setData((prev) => ({
      ...prev,
      activities: Array.from({ length: 7 }, () => createActivity()),
    }));
  };

  // Reset seluruh data termasuk profil di localStorage
  const handleResetSemua = () => {
    if (confirm("Kosongkan semua data termasuk data diri yang tersimpan?")) {
      clearSavedProfile();
      setData(defaultLogbook());
    }
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
            <code className="hidden max-w-64 truncate rounded-md bg-muted px-2 py-1 font-mono text-[11px] md:block">
              {filename}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetKegiatan}
              title="Kosongkan isi tabel kegiatan saja, data diri tetap aman"
            >
              <RotateCcw className="size-4" /> Reset Kegiatan
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleResetSemua}
              title="Hapus data profil tersimpan dari browser"
            >
              <Trash2 className="size-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="size-4" />
              {exporting ? "Mengekspor…" : "Export PDF"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <section aria-label="Form input logbook" className="min-w-0">
          <LogbookForm data={data} onChange={setData} />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Data diri dan pembimbing otomatis tersimpan di Local Storage browser Anda. Isi kegiatan harian tetap segar setiap sesi dan siap diekspor ke PDF resmi.
          </p>
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
    </div>
  );
}

