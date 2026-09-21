"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  RefreshCw,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  parseLogbookText,
  SAMPLE_BLOCK_TEXT,
  SAMPLE_CSV_TEXT,
  SAMPLE_PIPE_TEXT,
} from "@/lib/logbook-import";
import type { LogbookActivity } from "@/lib/logbook";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (activities: LogbookActivity[], mode: "replace" | "append") => void;
  currentActivityCount: number;
}

export function LogbookImportModal({
  isOpen,
  onClose,
  onImport,
  currentActivityCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Esc key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const parsedActivities = parseLogbookText(rawText);

  const handleFileRead = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || "";
      setRawText(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleCopySample = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(label);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleUseSample = (sample: string) => {
    setRawText(sample);
    setFileName("contoh-template.txt");
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_PIPE_TEXT], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-kegiatan-logbook.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApply = (mode: "replace" | "append") => {
    if (parsedActivities.length === 0) return;
    onImport(parsedActivities, mode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border bg-card text-card-foreground shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">
                Import Catatan Logbook
              </h2>
              <p className="text-xs text-muted-foreground">
                Drop file atau tempel teks catatan tanpa perlu OCR
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal import"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tab Selection */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("file")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-all",
                activeTab === "file"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <UploadCloud className="size-3.5" /> Unggah / Drop File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-all",
                activeTab === "paste"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ClipboardPaste className="size-3.5" /> Ketik / Paste Teks
            </button>
          </div>

          {/* Tab 1: File Drop Zone */}
          {activeTab === "file" && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/10 scale-[0.99]"
                  : "border-muted-foreground/25 bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                accept=".txt,.csv,.tsv,.json,text/plain,text/csv,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileRead(f);
                }}
              />
              <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="size-6" />
              </div>
              <p className="text-sm font-medium">
                {fileName ? (
                  <span className="text-primary font-semibold">
                    File terpilih: {fileName}
                  </span>
                ) : (
                  "Tarik & lepas file di sini, atau klik untuk memilih"
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Mendukung format <strong>.txt</strong>, <strong>.csv</strong>, <strong>.tsv</strong>, atau <strong>.json</strong>
              </p>
              {fileName && (
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3" /> Berhasil dibaca
                </span>
              )}
            </div>
          )}

          {/* Tab 2: Raw Textarea */}
          {activeTab === "paste" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="raw-input-textarea"
                  className="text-xs font-semibold text-foreground"
                >
                  Tempel teks catatan kegiatan Anda:
                </label>
                {rawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText("");
                      setFileName(null);
                    }}
                    className="text-[11px] text-muted-foreground hover:text-destructive"
                  >
                    Kosongkan
                  </button>
                )}
              </div>
              <Textarea
                id="raw-input-textarea"
                rows={6}
                placeholder="Contoh:&#10;Senin, 01/09/2026 | 08:00 | 17:00 | Analisis arsitektur sistem&#10;Selasa, 02/09/2026 | 08:00 | 16:30 | Slicing antarmuka web"
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setFileName(null);
                }}
                className="font-mono text-xs"
              />
            </div>
          )}

          {/* Quick Sample / Format Helpers */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" /> Format Catatan yang Didukung
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleUseSample(SAMPLE_PIPE_TEXT)}
                  title="Gunakan contoh teks ini untuk mencoba"
                >
                  <Sparkles className="size-3" /> Coba Contoh Teks
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleDownloadSample}
                  title="Unduh file .txt template"
                >
                  <Download className="size-3" /> Unduh .txt
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 text-[11px]">
              <div className="rounded-md border bg-background p-2">
                <div className="flex items-center justify-between font-medium text-foreground mb-1">
                  <span>Pemisah Garis Tegak (|)</span>
                  <button
                    type="button"
                    onClick={() => handleCopySample(SAMPLE_PIPE_TEXT, "pipe")}
                    className="text-muted-foreground hover:text-foreground"
                    title="Salin contoh format"
                  >
                    {copiedFormat === "pipe" ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
                <code className="block text-[10px] text-muted-foreground leading-tight">
                  Tgl | Masuk | Pulang | Kegiatan
                  <br />
                  <span className="text-foreground/80">atau: Tgl | 08:00-17:00 | Kegiatan</span>
                </code>
              </div>

              <div className="rounded-md border bg-background p-2">
                <div className="flex items-center justify-between font-medium text-foreground mb-1">
                  <span>CSV / Excel</span>
                  <button
                    type="button"
                    onClick={() => handleCopySample(SAMPLE_CSV_TEXT, "csv")}
                    className="text-muted-foreground hover:text-foreground"
                    title="Salin contoh CSV"
                  >
                    {copiedFormat === "csv" ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <FileSpreadsheet className="size-3" />
                    )}
                  </button>
                </div>
                <code className="block text-[10px] text-muted-foreground leading-tight">
                  Hari/Tanggal, Jam, Kegiatan
                  <br />
                  <span className="text-foreground/80">Otomatis skip baris header</span>
                </code>
              </div>

              <div className="rounded-md border bg-background p-2">
                <div className="flex items-center justify-between font-medium text-foreground mb-1">
                  <span>Format Blok Catatan</span>
                  <button
                    type="button"
                    onClick={() => handleCopySample(SAMPLE_BLOCK_TEXT, "block")}
                    className="text-muted-foreground hover:text-foreground"
                    title="Salin contoh blok"
                  >
                    {copiedFormat === "block" ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
                <code className="block text-[10px] text-muted-foreground leading-tight">
                  Hari/Tgl: ...
                  <br />
                  Jam: 08:00 - 17:00
                  <br />
                  Kegiatan: ...
                </code>
              </div>
            </div>
          </div>

          {/* Real-time Parsed Results Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Pratinjau Hasil Deteksi
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  parsedActivities.length > 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {parsedActivities.length} baris kegiatan terdeteksi
              </span>
            </div>

            {parsedActivities.length > 0 ? (
              <div className="max-h-56 overflow-auto rounded-lg border bg-background scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs text-muted-foreground border-b">
                    <tr>
                      <th className="p-2 w-10 text-center font-medium">No</th>
                      <th className="p-2 w-32 font-medium">Hari, Tanggal</th>
                      <th className="p-2 w-28 font-medium">Jam</th>
                      <th className="p-2 font-medium">Kegiatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedActivities.map((act, i) => (
                      <tr key={act.id} className="hover:bg-muted/30">
                        <td className="p-2 text-center text-muted-foreground text-[11px]">
                          {i + 1}
                        </td>
                        <td className="p-2 font-medium">
                          {act.hariTanggal || (
                            <span className="text-muted-foreground italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-2 text-[11px]">
                          {act.jamMasuk || act.jamPulang ? (
                            <span>
                              {act.jamMasuk || "--:--"} - {act.jamPulang || "--:--"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">-</span>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground text-[11px] max-w-xs truncate">
                          {act.kegiatan || (
                            <span className="italic">Tanpa keterangan kegiatan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 px-4 text-center">
                <AlertCircle className="size-6 text-muted-foreground/60 mb-2" />
                <p className="text-xs font-medium text-foreground">
                  Belum ada data kegiatan terdeteksi
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Unggah file atau tempelkan teks catatan Anda untuk melihat pratinjau tabel.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3.5 bg-muted/20">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Batal
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={parsedActivities.length === 0}
              onClick={() => handleApply("append")}
              title={`Tambahkan ${parsedActivities.length} baris di bawah ${currentActivityCount} baris yang ada`}
            >
              <Plus className="size-3.5" />
              Tambahkan ({parsedActivities.length})
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={parsedActivities.length === 0}
              onClick={() => handleApply("replace")}
              title={`Gantikan seluruh ${currentActivityCount} baris saat ini dengan ${parsedActivities.length} baris baru`}
            >
              <RefreshCw className="size-3.5" />
              Ganti Semua ({parsedActivities.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
