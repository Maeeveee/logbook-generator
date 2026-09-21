"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  List,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmModal } from "@/components/confirm-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createActivity,
  generateWorkdayDates,
  getNextDateFrom,
  parseIndonesianDate,
  resizeImageToDataURL,
  type LogbookData,
} from "@/lib/logbook";
import { cn } from "@/lib/utils";

interface Props {
  data: LogbookData;
  onChange: (data: LogbookData) => void;
  onOpenImport?: () => void;
}

export const PRODI_OPTIONS = [
  "Sarjana Terapan Teknik Informatika",
  "Sarjana Terapan Sistem Informasi Bisnis",
] as const;

export function LogbookForm({ data, onChange, onOpenImport }: Props) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"tab" | "list">("tab");
  const [confirmDeleteTtdOpen, setConfirmDeleteTtdOpen] = useState(false);
  const [confirmDeleteRowId, setConfirmDeleteRowId] = useState<string | null>(null);

  const set = (patch: Partial<LogbookData>) => onChange({ ...data, ...patch });

  const updateActivity = (
    id: string,
    patch: Partial<LogbookData["activities"][number]>,
  ) => {
    onChange({
      ...data,
      activities: data.activities.map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      ),
    });
  };

  const safeActiveIndex = Math.min(
    Math.max(0, activeTabIndex),
    Math.max(0, data.activities.length - 1),
  );

  const currentActivity = data.activities[safeActiveIndex];

  const centralJamMasuk = data.activities[0]?.jamMasuk || "08:00";
  const centralJamPulang = data.activities[0]?.jamPulang || "16:00";

  // Set default jam masuk untuk seluruh hari di minggu ini (jam terpusat)
  const handleSetAllJamMasuk = (time: string) => {
    onChange({
      ...data,
      activities: data.activities.map((act) => ({
        ...act,
        jamMasuk: time,
      })),
    });
  };

  // Set default jam pulang untuk seluruh hari di minggu ini (jam terpusat)
  const handleSetAllJamPulang = (time: string) => {
    onChange({
      ...data,
      activities: data.activities.map((act) => ({
        ...act,
        jamPulang: time,
      })),
    });
  };

  const handleAddActivity = () => {
    const newAct = createActivity();
    if (data.activities.length > 0) {
      const lastAct = data.activities[data.activities.length - 1];
      if (lastAct.hariTanggal) {
        newAct.hariTanggal = getNextDateFrom(lastAct.hariTanggal);
      }
      newAct.jamMasuk = lastAct.jamMasuk || data.activities[0]?.jamMasuk || "";
      newAct.jamPulang = lastAct.jamPulang || data.activities[0]?.jamPulang || "";
    }
    onChange({
      ...data,
      activities: [...data.activities, newAct],
    });
    setActiveTabIndex(data.activities.length);
  };

  const handleDeleteActivity = (id: string) => {
    const nextActivities = data.activities.filter((x) => x.id !== id);
    onChange({
      ...data,
      activities: nextActivities,
    });
    if (safeActiveIndex >= nextActivities.length) {
      setActiveTabIndex(Math.max(0, nextActivities.length - 1));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Identitas & Pembimbing */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Data Diri & Pembimbing
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="nama" className="text-xs font-semibold">
              Nama Mahasiswa
            </Label>
            <Input
              id="nama"
              placeholder="cth. Budi Santoso"
              value={data.nama}
              onChange={(e) =>
                set({ nama: e.target.value, namaMahasiswa: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="nim" className="text-xs font-semibold">
                NIM
              </Label>
              <Input
                id="nim"
                placeholder="cth. 2341720001"
                value={data.nim}
                onChange={(e) => set({ nim: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="prodi" className="text-xs font-semibold">
                Program Studi
              </Label>
              <div className="relative">
                <select
                  id="prodi"
                  value={data.programStudi}
                  onChange={(e) => set({ programStudi: e.target.value })}
                  className="h-9 w-full min-w-0 cursor-pointer appearance-none rounded-4xl border border-input bg-input/30 px-3 py-1 pr-8 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled className="bg-popover text-muted-foreground">
                    Pilih Program Studi
                  </option>
                  {PRODI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-popover text-foreground">
                      {opt}
                    </option>
                  ))}
                  {data.programStudi &&
                    !PRODI_OPTIONS.includes(
                      data.programStudi as (typeof PRODI_OPTIONS)[number],
                    ) && (
                      <option
                        value={data.programStudi}
                        className="bg-popover text-foreground"
                      >
                        {data.programStudi}
                      </option>
                    )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mitra" className="text-xs font-semibold">
              Mitra Industri
            </Label>
            <Input
              id="mitra"
              placeholder="cth. PT Solusi Digital Teknologi"
              value={data.namaMitra}
              onChange={(e) => set({ namaMitra: e.target.value })}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="dosen" className="text-xs font-semibold">
                Dosen Pembimbing
              </Label>
              <Input
                id="dosen"
                placeholder="cth. Dr. Eng. Ahmad, S.T., M.T."
                value={data.namaPembimbing}
                onChange={(e) => set({ namaPembimbing: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mentor" className="text-xs font-semibold">
                Mentor Lapangan
              </Label>
              <Input
                id="mentor"
                placeholder="cth. Rina Permata, S.Kom."
                value={data.namaMentor}
                onChange={(e) => set({ namaMentor: e.target.value })}
              />
            </div>
          </div>

          {/* Upload Tanda Tangan */}
          <div className="mt-1 border-t pt-3">
            <Label className="text-xs font-semibold">
              Tanda Tangan (TTD)
            </Label>

            {data.ttdMahasiswa ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-20 w-44 items-center justify-center rounded-md border bg-muted/40 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.ttdMahasiswa}
                    alt="Pratinjau TTD"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="upload-ttd"
                    className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium shadow-xs hover:bg-muted"
                  >
                    Ganti Gambar
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmDeleteTtdOpen(true)}
                  >
                    <Trash2 className="mr-1 size-3.5" /> Hapus TTD
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="upload-ttd"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-4 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
                >
                  <Upload className="mb-1 size-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">
                    Klik untuk unggah gambar tanda tangan
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    PNG atau JPG (latar transparan disarankan)
                  </span>
                </label>
              </div>
            )}
            <input
              id="upload-ttd"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const dataUrl = await resizeImageToDataURL(file);
                  set({ ttdMahasiswa: dataUrl });
                  e.target.value = "";
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabel Kegiatan Harian (Mode Tab Ringkas & Mode List) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                Kegiatan Minggu {data.weekNumber || 1}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {onOpenImport && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={onOpenImport}
                  className="h-7 gap-1 border-primary/30 text-xs font-medium text-primary hover:bg-primary/10"
                  title="Import file .txt, CSV, atau teks catatan"
                >
                  <Sparkles className="size-3" /> Import
                </Button>
              )}
              <div className="flex items-center rounded-md border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("tab")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors",
                    viewMode === "tab"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Layers className="size-3.5" /> Tab Fokus
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors",
                    viewMode === "list"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <List className="size-3.5" /> Tampilkan Semua
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {/* Jam Kerja Default Mingguan */}
          <div className="rounded-lg border bg-muted/25 p-2.5 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock className="size-3.5 text-primary" />
                <span>Jam Kerja Default</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Otomatis untuk semua hari
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label
                  htmlFor="central-jam-masuk"
                  className="text-[11px] text-muted-foreground"
                >
                  Jam Masuk
                </Label>
                <Input
                  id="central-jam-masuk"
                  type="time"
                  className="h-8 bg-background text-xs"
                  value={centralJamMasuk}
                  onChange={(e) => handleSetAllJamMasuk(e.target.value)}
                />
              </div>

              <div className="grid gap-1">
                <Label
                  htmlFor="central-jam-pulang"
                  className="text-[11px] text-muted-foreground"
                >
                  Jam Pulang
                </Label>
                <Input
                  id="central-jam-pulang"
                  type="time"
                  className="h-8 bg-background text-xs"
                  value={centralJamPulang}
                  onChange={(e) => handleSetAllJamPulang(e.target.value)}
                />
              </div>
            </div>
          </div>

          {viewMode === "tab" ? (
            /* Mode 1: Tab Baris Ringkas */
            <div className="flex flex-col gap-3">
              {/* Daftar Tab Hari (Senin, Selasa, dll.) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {data.activities.map((act, idx) => {
                  const isFilled = Boolean(
                    act.kegiatan && act.kegiatan.trim() !== "",
                  );
                  const isActive = idx === safeActiveIndex;
                  const dayName = act.hariTanggal
                    ? act.hariTanggal.split(",")[0]
                    : `Hari ${idx + 1}`;

                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActiveTabIndex(idx)}
                      className={cn(
                        "relative flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-xs font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                      )}
                    >
                      {dayName}
                      {isFilled && !isActive && (
                        <span className="ml-1.5 size-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="h-8 w-8 shrink-0 border-dashed"
                  title="Tambah hari kegiatan (opsional)"
                  onClick={handleAddActivity}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>

              {/* Form Hari yang Sedang Aktif: Hanya Jam & Kegiatan */}
              {currentActivity && (
                <div className="rounded-lg border bg-card/60 p-3.5 shadow-2xs">
                  <div className="mb-3 flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-foreground">
                      {currentActivity.hariTanggal ||
                        `Hari ke-${safeActiveIndex + 1}`}
                    </span>
                    {data.activities.length > 5 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                        onClick={() => setConfirmDeleteRowId(currentActivity.id)}
                      >
                        <Trash2 className="mr-1 size-3.5" /> Hapus Hari
                      </Button>
                    )}
                  </div>

                  {/* Input Jam Masuk & Jam Pulang untuk hari ini saja */}
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-[11px] font-medium text-foreground">
                        Jam Masuk
                      </Label>
                      <Input
                        type="time"
                        className="h-8 bg-background text-xs font-medium"
                        value={currentActivity.jamMasuk || "08:00"}
                        onChange={(e) =>
                          updateActivity(currentActivity.id, {
                            jamMasuk: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px] font-medium text-foreground">
                        Jam Pulang
                      </Label>
                      <Input
                        type="time"
                        className="h-8 bg-background text-xs font-medium"
                        value={currentActivity.jamPulang || "16:00"}
                        onChange={(e) =>
                          updateActivity(currentActivity.id, {
                            jamPulang: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Input Kegiatan untuk hari ini */}
                  <div className="grid gap-1">
                    <Label className="text-[11px] font-medium text-foreground">
                      Kegiatan
                    </Label>
                    <Textarea
                      placeholder="Deskripsikan kegiatan magang pada hari ini..."
                      rows={4}
                      className="text-xs resize-none"
                      value={currentActivity.kegiatan}
                      onChange={(e) =>
                        updateActivity(currentActivity.id, {
                          kegiatan: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Navigasi Sebelumnya / Berikutnya */}
                  <div className="mt-3.5 flex items-center justify-between border-t pt-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={safeActiveIndex === 0}
                      onClick={() =>
                        setActiveTabIndex((p) => Math.max(0, p - 1))
                      }
                    >
                      <ChevronLeft className="mr-1 size-3.5" /> Hari Sebelumnya
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                      {safeActiveIndex + 1} / {data.activities.length}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={safeActiveIndex >= data.activities.length - 1}
                      onClick={() =>
                        setActiveTabIndex((p) =>
                          Math.min(data.activities.length - 1, p + 1),
                        )
                      }
                    >
                      Hari Berikutnya <ChevronRight className="ml-1 size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Tampilkan Semua */
            <div className="flex flex-col gap-3">
              <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
                {data.activities.map((a, i) => (
                  <div
                    key={a.id}
                    className="rounded-lg border bg-card/60 p-3.5 transition-colors hover:border-primary/40"
                  >
                    <div className="mb-2.5 flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold text-foreground">
                        {a.hariTanggal || `Hari ke-${i + 1}`}
                      </span>
                      {data.activities.length > 5 && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Hapus hari ${i + 1}`}
                          onClick={() => setConfirmDeleteRowId(a.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive/80 hover:text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="mb-2.5 grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label className="text-[11px] font-medium text-foreground">
                          Jam Masuk
                        </Label>
                        <Input
                          type="time"
                          className="h-8 bg-background text-xs font-medium"
                          value={a.jamMasuk || "08:00"}
                          onChange={(e) =>
                            updateActivity(a.id, { jamMasuk: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[11px] font-medium text-foreground">
                          Jam Pulang
                        </Label>
                        <Input
                          type="time"
                          className="h-8 bg-background text-xs font-medium"
                          value={a.jamPulang || "16:00"}
                          onChange={(e) =>
                            updateActivity(a.id, { jamPulang: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px] font-medium text-foreground">
                        Kegiatan
                      </Label>
                      <Textarea
                        placeholder="Deskripsikan kegiatan magang pada hari ini..."
                        rows={2}
                        className="text-xs resize-none"
                        value={a.kegiatan}
                        onChange={(e) =>
                          updateActivity(a.id, { kegiatan: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="mt-1 border-dashed text-xs"
                onClick={handleAddActivity}
              >
                <Plus className="size-4" /> Tambah hari kegiatan (opsional)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Konfirmasi: Hapus TTD */}
      <ConfirmModal
        isOpen={confirmDeleteTtdOpen}
        onClose={() => setConfirmDeleteTtdOpen(false)}
        onConfirm={() => set({ ttdMahasiswa: "" })}
        title="Hapus Tanda Tangan?"
        description="Gambar tanda tangan mahasiswa yang tersimpan akan dihapus dari dokumen ini."
        confirmLabel="Ya, Hapus TTD"
        variant="destructive"
      />

      {/* Modal Konfirmasi: Hapus Baris Kegiatan */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteRowId)}
        onClose={() => setConfirmDeleteRowId(null)}
        onConfirm={() => {
          if (confirmDeleteRowId) {
            handleDeleteActivity(confirmDeleteRowId);
            setConfirmDeleteRowId(null);
          }
        }}
        title="Hapus Baris Kegiatan?"
        description="Baris kegiatan beserta tanggal, jam, dan deskripsi kegiatan ini akan dihapus dari logbook."
        confirmLabel="Ya, Hapus Baris"
        variant="destructive"
      />
    </div>
  );
}
