"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  List,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createActivity,
  resizeImageToDataURL,
  type LogbookData,
} from "@/lib/logbook";
import { cn } from "@/lib/utils";

interface Props {
  data: LogbookData;
  onChange: (data: LogbookData) => void;
}

export function LogbookForm({ data, onChange }: Props) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"tab" | "list">("tab");

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

  const handleAddActivity = () => {
    const newAct = createActivity();
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
      {/* Identitas & Pembimbing (Disimpan otomatis di LocalStorage) */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Data Diri & Pembimbing
            </CardTitle>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              Tersimpan di browser
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Data ini otomatis tersimpan di Local Storage dan dipakai pada identitas serta lembar tanda tangan.
          </p>
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
              <Input
                id="prodi"
                placeholder="cth. D4 Teknik Informatika"
                value={data.programStudi}
                onChange={(e) => set({ programStudi: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mitra" className="text-xs font-semibold">
              Nama Mitra Industri
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
                Pembimbing Lapangan / Mentor
              </Label>
              <Input
                id="mentor"
                placeholder="cth. Rina Permata, S.Kom."
                value={data.namaMentor}
                onChange={(e) => set({ namaMentor: e.target.value })}
              />
            </div>
          </div>

          {/* Upload Tanda Tangan Mahasiswa */}
          <div className="mt-1 border-t pt-3">
            <Label className="text-xs font-semibold">
              Tanda Tangan Mahasiswa (Gambar)
            </Label>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Unggah gambar tanda tangan (format PNG/JPG, disarankan transparan). Otomatis tersimpan dan ditempel pada dokumen.
            </p>

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
                    onClick={() => set({ ttdMahasiswa: "" })}
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
                Kegiatan Harian
              </CardTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {data.activities.length} baris
              </span>
            </div>
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
        </CardHeader>
        <CardContent>
          {viewMode === "tab" ? (
            /* Mode 1: Tab Baris Ringkas (Tinggi tetap ~220px, hemat tempat) */
            <div className="flex flex-col gap-3">
              {/* Daftar Tab Nomor Baris */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {data.activities.map((act, idx) => {
                  const isFilled = Boolean(
                    act.hariTanggal || act.jamMasuk || act.kegiatan,
                  );
                  const isActive = idx === safeActiveIndex;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActiveTabIndex(idx)}
                      className={cn(
                        "relative flex h-8 shrink-0 items-center justify-center rounded-md px-2.5 text-xs font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                      )}
                    >
                      Baris {idx + 1}
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
                  title="Tambah baris kegiatan"
                  onClick={handleAddActivity}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>

              {/* Form Baris yang Sedang Aktif */}
              {currentActivity && (
                <div className="rounded-lg border bg-card/60 p-3.5 shadow-2xs">
                  <div className="mb-3 flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-semibold text-foreground">
                      Mengisi Baris ke-{safeActiveIndex + 1} dari{" "}
                      {data.activities.length}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                      disabled={data.activities.length <= 1}
                      onClick={() => handleDeleteActivity(currentActivity.id)}
                    >
                      <Trash2 className="mr-1 size-3.5" /> Hapus Baris Ini
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="grid gap-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Hari, Tanggal
                      </Label>
                      <Input
                        placeholder="Senin, 01/09/2026"
                        value={currentActivity.hariTanggal}
                        onChange={(e) =>
                          updateActivity(currentActivity.id, {
                            hariTanggal: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Jam Masuk
                      </Label>
                      <Input
                        type="time"
                        value={currentActivity.jamMasuk}
                        onChange={(e) =>
                          updateActivity(currentActivity.id, {
                            jamMasuk: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Jam Pulang
                      </Label>
                      <Input
                        type="time"
                        value={currentActivity.jamPulang}
                        onChange={(e) =>
                          updateActivity(currentActivity.id, {
                            jamPulang: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-2.5 grid gap-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Kegiatan
                    </Label>
                    <Textarea
                      placeholder="Deskripsikan kegiatan magang pada baris ini..."
                      rows={3}
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
                      <ChevronLeft className="mr-1 size-3.5" /> Baris Sebelumnya
                    </Button>
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
                      Baris Berikutnya <ChevronRight className="ml-1 size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Tampilkan Semua (dengan scroll container agar tidak molor panjang) */
            <div className="flex flex-col gap-3">
              <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
                {data.activities.map((a, i) => (
                  <div
                    key={a.id}
                    className="rounded-lg border bg-card/60 p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                        Baris {i + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus baris ${i + 1}`}
                        disabled={data.activities.length <= 1}
                        onClick={() => handleDeleteActivity(a.id)}
                      >
                        <Trash2 className="size-3.5 text-destructive/80 hover:text-destructive" />
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="grid gap-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Hari, Tanggal
                        </Label>
                        <Input
                          placeholder="Senin, 01/09/2026"
                          value={a.hariTanggal}
                          onChange={(e) =>
                            updateActivity(a.id, {
                              hariTanggal: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Jam Masuk
                        </Label>
                        <Input
                          type="time"
                          value={a.jamMasuk}
                          onChange={(e) =>
                            updateActivity(a.id, {
                              jamMasuk: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Jam Pulang
                        </Label>
                        <Input
                          type="time"
                          value={a.jamPulang}
                          onChange={(e) =>
                            updateActivity(a.id, {
                              jamPulang: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-2 grid gap-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Kegiatan
                      </Label>
                      <Textarea
                        placeholder="Deskripsikan kegiatan magang..."
                        rows={2}
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
                className="mt-1 border-dashed"
                onClick={handleAddActivity}
              >
                <Plus className="size-4" /> Tambah baris kegiatan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
