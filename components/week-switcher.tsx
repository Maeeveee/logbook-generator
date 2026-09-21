"use client";

import { CalendarDays, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AVAILABLE_MONTHS,
  getWeekDateRangeSummary,
  type LogbookWeek,
} from "@/lib/logbook";
import { cn } from "@/lib/utils";

interface WeekSwitcherProps {
  weeks: LogbookWeek[];
  activeWeekId: string;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onSelectWeek: (id: string) => void;
  onDownloadMonth?: () => void;
  isDownloadingMonth?: boolean;
}

export function WeekSwitcher({
  weeks,
  activeWeekId,
  selectedMonth,
  onSelectMonth,
  onSelectWeek,
  onDownloadMonth,
  isDownloadingMonth,
}: WeekSwitcherProps) {
  // Ambil hanya minggu-minggu yang sesuai dengan bulan yang sedang dipilih
  const currentMonthWeeks = weeks
    .filter((w) => w.month === selectedMonth)
    .sort((a, b) => a.weekNumber - b.weekNumber);

  return (
    <div className="rounded-xl border bg-card p-3.5 shadow-2xs">
      {/* Header: Label & Dropdown Pilihan Bulan */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Logbook Mingguan
          </span>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            • {currentMonthWeeks.length} minggu tersedia
          </span>
        </div>

        {/* Dropdown Bulan 2026 & Tombol Cepat Download 1 Bulan */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label
              htmlFor="month-select-dropdown"
              className="text-xs font-medium text-muted-foreground"
            >
              Pilih Bulan:
            </label>
            <select
              id="month-select-dropdown"
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="h-8.5 cursor-pointer rounded-lg border border-primary/40 bg-background px-3 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:border-primary focus:border-primary focus:outline-none"
            >
              {AVAILABLE_MONTHS.map((mo) => (
                <option key={mo.value} value={mo.value}>
                  {mo.label}
                </option>
              ))}
            </select>
          </div>

          {onDownloadMonth && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDownloadMonth}
              disabled={isDownloadingMonth}
              className="h-8.5 gap-1.5 border-primary/40 text-xs font-semibold text-primary hover:bg-primary/10"
              title="Download seluruh minggu di bulan ini ke dalam 1 file PDF gabungan"
            >
              <Download className="size-3.5" />
              <span>
                {isDownloadingMonth
                  ? "Mengekspor Bulan…"
                  : "Download PDF 1 Bulan"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Week Tabs: Otomatis muncul seluruh minggu untuk bulan terpilih */}
      <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-0.5 scrollbar-thin">
        {currentMonthWeeks.map((week) => {
          const isActive = week.id === activeWeekId;
          const filledCount = week.activities.filter(
            (a) => a.kegiatan && a.kegiatan.trim() !== "",
          ).length;
          const rangeSummary = getWeekDateRangeSummary(week.activities);

          return (
            <button
              key={week.id}
              type="button"
              onClick={() => onSelectWeek(week.id)}
              className={cn(
                "group flex shrink-0 items-center gap-2.5 rounded-lg border px-3.5 py-2 text-left transition-all",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs font-semibold leading-tight">
                  <span>Minggu {week.weekNumber}</span>
                  {filledCount > 0 && (
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        isActive ? "bg-white" : "bg-emerald-500",
                      )}
                      title={`${filledCount} hari kegiatan telah diisi`}
                    />
                  )}
                </div>
                {rangeSummary ? (
                  <span
                    className={cn(
                      "mt-0.5 text-[10.5px] font-normal leading-tight",
                      isActive
                        ? "text-primary-foreground/85"
                        : "text-muted-foreground",
                    )}
                  >
                    {rangeSummary}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
