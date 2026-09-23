"use client";

import { CalendarDays } from "lucide-react";
import {
  AVAILABLE_MONTHS,
  getWeekDateRangeSummary,
  isCurrentCalendarWeek,
  type LogbookWeek,
} from "@/lib/logbook";
import { cn } from "@/lib/utils";

interface WeekSwitcherProps {
  weeks: LogbookWeek[];
  activeWeekId: string;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onSelectWeek: (id: string) => void;
}

export function WeekSwitcher({
  weeks,
  activeWeekId,
  selectedMonth,
  onSelectMonth,
  onSelectWeek,
}: WeekSwitcherProps) {
  // Ambil hanya minggu-minggu yang sesuai dengan bulan yang sedang dipilih
  const currentMonthWeeks = weeks
    .filter((w) => w.month === selectedMonth)
    .sort((a, b) => a.weekNumber - b.weekNumber);

  return (
    <div className="rounded-xl border bg-card p-3.5 shadow-2xs">
      {/* Header: Label, Indikator Minggu Ini & Dropdown Pilihan Bulan */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Logbook Mingguan
            </span>
          </div>
        </div>

        {/* Dropdown Bulan */}
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
            className="h-8.5 cursor-pointer rounded-lg border border-input bg-background px-3 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:border-primary focus:border-primary focus:outline-none"
          >
            {AVAILABLE_MONTHS.map((mo) => (
              <option key={mo.value} value={mo.value}>
                {mo.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Week Tabs: Otomatis muncul seluruh minggu untuk bulan terpilih */}
      <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-0.5 scrollbar-thin">
        {currentMonthWeeks.map((week) => {
          const isActive = week.id === activeWeekId;
          const isCurrent = isCurrentCalendarWeek(week);
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
                "group relative flex shrink-0 items-center gap-2.5 rounded-lg border px-3.5 py-2 text-left transition-all",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                  : isCurrent
                    ? "border-primary/50 bg-primary/5 text-foreground hover:bg-primary/10 shadow-2xs"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs font-semibold leading-tight">
                  <span>Minggu {week.weekNumber}</span>

                  {/* Highlight Badge Minggu Ini */}
                  {isCurrent && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9.5px] font-bold tracking-tight uppercase leading-none",
                        isActive
                          ? "bg-white text-primary"
                          : "bg-primary text-primary-foreground",
                      )}
                      title="Minggu ini berdasarkan tanggal kalender saat ini"
                    >
                      Minggu Ini
                    </span>
                  )}

                  {filledCount > 0 && !isCurrent && (
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
                      "mt-0.5 text-[10.5px] leading-tight",
                      isActive
                        ? "text-primary-foreground/90 font-normal"
                        : isCurrent
                          ? "text-primary font-medium"
                          : "text-muted-foreground font-normal",
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
