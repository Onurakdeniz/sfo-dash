"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Filter, FileSpreadsheet, X } from "lucide-react";

import EmployeeSecondaryNav from "../employee-secondary-nav";

type CheckStatus = "late" | "early" | "ontime" | "overtime" | null;

type AttendanceRow = {
  date: string; // yyyy-mm-dd
  weekdayLabel: string;
  shift: { start: string; end: string } | null;
  checkIn?: string | null;
  checkOut?: string | null;
  checkInStatus?: "late" | "early" | "ontime" | null;
  checkOutStatus?: "early" | "overtime" | "ontime" | null;
  checkInSource?: "device" | "mobile" | "manual" | "web" | null;
  checkOutSource?: "device" | "mobile" | "manual" | "web" | null;
};

function startOfDayISO(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseHHMMToMinutes(hhmm?: string | null): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatMinutesToHHMM(mins?: number | null): string {
  if (mins == null) return "-";
  const sign = mins < 0 ? "-" : "";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const WEEKDAY_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] as const;

const LATE_THRESHOLD_MIN = 5;
const EARLY_THRESHOLD_MIN = 5;
const OVERTIME_THRESHOLD_MIN = 20;

function computeMetrics(row: AttendanceRow) {
  const shiftStartMin = parseHHMMToMinutes(row.shift?.start);
  const shiftEndMin = parseHHMMToMinutes(row.shift?.end);
  const checkInMin = parseHHMMToMinutes(row.checkIn);
  const checkOutMin = parseHHMMToMinutes(row.checkOut);

  const expectedMinutes =
    shiftStartMin != null && shiftEndMin != null && shiftEndMin >= shiftStartMin
      ? shiftEndMin - shiftStartMin
      : null;

  const totalMinutes =
    checkInMin != null && checkOutMin != null && checkOutMin >= checkInMin
      ? checkOutMin - checkInMin
      : null;

  const diffMinutes = expectedMinutes != null && totalMinutes != null ? totalMinutes - expectedMinutes : null;

  let derivedCheckInStatus: CheckStatus = null;
  let derivedCheckOutStatus: CheckStatus = null;
  if (shiftStartMin != null && checkInMin != null) {
    const diffIn = checkInMin - shiftStartMin;
    derivedCheckInStatus = diffIn > LATE_THRESHOLD_MIN ? "late" : diffIn < -EARLY_THRESHOLD_MIN ? "early" : "ontime";
  }
  if (shiftEndMin != null && checkOutMin != null) {
    const diffOut = checkOutMin - shiftEndMin;
    derivedCheckOutStatus = diffOut < -EARLY_THRESHOLD_MIN ? "early" : diffOut > OVERTIME_THRESHOLD_MIN ? "overtime" : "ontime";
  }

  return {
    expectedMinutes,
    totalMinutes,
    diffMinutes,
    checkInStatus: derivedCheckInStatus as AttendanceRow["checkInStatus"],
    checkOutStatus: derivedCheckOutStatus as AttendanceRow["checkOutStatus"],
  } as const;
}

function getStatusLabel(kind: "checkIn" | "checkOut", row: AttendanceRow) {
  const cm = computeMetrics(row);
  if (kind === "checkIn") {
    if (!row.checkIn) return "-";
    return cm.checkInStatus === "late" ? "Geç Giriş" : cm.checkInStatus === "early" ? "Erken Giriş" : "Zamanında";
  }
  if (!row.checkOut) return "-";
  return cm.checkOutStatus === "early" ? "Erken Çıkış" : cm.checkOutStatus === "overtime" ? "Fazla Mesai" : "Zamanında";
}

interface WorkspaceContextData {
  workspace: { id: string; name: string; slug: string } | null;
  currentCompany?: { id: string; name: string; slug: string } | null;
}

export default function EmployeePdksPage() {
  const params = useParams();
  const employeeId = params.employeeId as string | undefined;
  const workspaceSlug = params.workspaceSlug as string | undefined;
  const companySlug = params.companySlug as string | undefined;

  // filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return startOfDayISO(d);
  });
  const [endDate, setEndDate] = useState<string>(() => startOfDayISO(new Date()));
  const [statusFilter, setStatusFilter] = useState<"all" | "late_in" | "late_out" | "anomalies">("all");

  const visibleColumns = {
    date: true,
    shift: true,
    checkIn: true,
    checkInStatus: true,
    checkOut: true,
    checkOutStatus: true,
    total: true,
    diff: true,
    location: true,
  } as const;

  // context for headers and excel export
  const { data: contextData } = useQuery<WorkspaceContextData>({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      if (!workspaceSlug || !companySlug) return { workspace: null, currentCompany: null } as WorkspaceContextData;
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) return { workspace: null, currentCompany: null } as WorkspaceContextData;
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug),
  });

  const workspaceName = contextData?.workspace?.name || "";
  const companyName = contextData?.currentCompany?.name || "";

  // fetch workspace members to resolve employee name/email for export
  const workspaceId = contextData?.workspace?.id as string | undefined;
  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as any[];
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, { credentials: "include" });
      if (!res.ok) return [] as any[];
      return res.json();
    },
    enabled: !!workspaceId,
  });
  const employeeMember = useMemo(() => {
    if (!employeeId || !members) return null as any;
    return (members as any[]).find((m: any) => m?.user?.id === employeeId) || null;
  }, [members, employeeId]);

  const employeeSeed = useMemo(() => {
    if (!employeeId) return 0;
    return Array.from(employeeId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  }, [employeeId]);

  const dateList = useMemo(() => {
    if (!startDate || !endDate) return [] as string[];
    const out: string[] = [];
    let cur = startDate;
    while (cur <= endDate) {
      out.push(cur);
      cur = addDaysISO(cur, 1);
    }
    return out;
  }, [startDate, endDate]);

  // Demo rows for a single employee (until real PDKS integration)
  const rows: AttendanceRow[] = useMemo(() => {
    const result: AttendanceRow[] = [];
    for (let i = 0; i < dateList.length; i++) {
      const iso = dateList[i]!;
      const day = new Date(iso);
      const dow = day.getDay();
      const isWorkingDay = dow !== 0 && dow !== 6;
      const shift = isWorkingDay ? { start: "09:00", end: "17:00" } : null;
      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let checkInStatus: AttendanceRow["checkInStatus"] = null;
      let checkOutStatus: AttendanceRow["checkOutStatus"] = null;
      const seed = (employeeSeed + i * 17 + dow * 13) % 7;
      if (shift) {
        const ciMin = 9 * 60 + (seed - 3) * 3; // 09:00 +/-
        const coMin = 17 * 60 + (seed - 2) * 4; // 17:00 +/-
        const pad = (n: number) => String(n).padStart(2, "0");
        const fmt = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
        checkIn = fmt(ciMin);
        checkOut = fmt(coMin);
        const diffIn = ciMin - 9 * 60;
        const diffOut = coMin - 17 * 60;
        checkInStatus = diffIn > 5 ? "late" : diffIn < -5 ? "early" : "ontime";
        checkOutStatus = diffOut < -5 ? "early" : diffOut > 20 ? "overtime" : "ontime";
      }
      const sourceMap = ["device", "mobile", "manual", "web"] as const;
      const checkInSource = shift ? sourceMap[Math.abs(seed) % sourceMap.length] : null;
      const checkOutSource = shift ? sourceMap[Math.abs(seed + 1) % sourceMap.length] : null;
      result.push({
        date: iso,
        weekdayLabel: WEEKDAY_TR[dow],
        shift,
        checkIn,
        checkOut,
        checkInStatus,
        checkOutStatus,
        checkInSource,
        checkOutSource,
      });
    }
    return result;
  }, [dateList, employeeSeed]);

  const dailyRows = useMemo(() => {
    return rows.filter((r) => {
      if (!(r.date >= startDate && r.date <= endDate)) return false;
      const cm = computeMetrics(r);
      if (statusFilter === "late_in") return cm.checkInStatus === "late";
      if (statusFilter === "late_out") return cm.checkOutStatus === "overtime";
      if (statusFilter === "anomalies") {
        const anomalousIn = cm.checkInStatus === "late" || cm.checkInStatus === "early";
        const anomalousOut = cm.checkOutStatus === "early" || cm.checkOutStatus === "overtime";
        return anomalousIn || anomalousOut;
      }
      return true;
    });
  }, [rows, startDate, endDate, statusFilter]);

  const defaultDailyEnd = useMemo(() => startOfDayISO(new Date()), []);
  const defaultDailyStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return startOfDayISO(d);
  }, []);
  const isDailyRangeDefault = startDate === defaultDailyStart && endDate === defaultDailyEnd;
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (!isDailyRangeDefault) count += 1;
    if (statusFilter !== "all") count += 1;
    return count;
  }, [isDailyRangeDefault, statusFilter]);
  const areFiltersActive = activeFiltersCount > 0;

  // Excel export (single employee daily view)
  const exportAttendanceExcel = async () => {
    try {
      let ExcelJSImport: any;
      try {
        ExcelJSImport = await import("exceljs");
      } catch (_e) {
        ExcelJSImport = await import("exceljs/dist/exceljs.min.js");
      }
      const WorkbookCtor = (ExcelJSImport as any).Workbook || (ExcelJSImport as any).default?.Workbook;
      if (!WorkbookCtor) throw new Error("ExcelJS Workbook constructor not found");

      const workbook = new WorkbookCtor();
      const worksheet = workbook.addWorksheet("Günlük", { views: [{ state: "frozen", ySplit: 3 }], properties: { defaultRowHeight: 16 } });

      const employeeLabel = employeeMember?.user?.name || employeeMember?.user?.email || employeeId || "-";
      const title = `${companyName || "Şirket"} - Giriş-Çıkışlar (Günlük)  |  Tarih Aralığı: ${startDate.split("-").reverse().join(".")} - ${endDate.split("-").reverse().join(".")}`;
      const subtitle = `Çalışma Alanı: ${workspaceName || "-"}  |  Çıktı Tarihi: ${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
      const empLine = `Personel: ${employeeLabel}`;

      worksheet.mergeCells(1, 1, 1, 12);
      worksheet.getCell(1, 1).value = title;
      worksheet.getCell(1, 1).font = { size: 12, bold: true } as any;
      worksheet.getRow(1).height = 18;

      worksheet.mergeCells(2, 1, 2, 12);
      worksheet.getCell(2, 1).value = `${subtitle}  |  ${empLine}`;
      worksheet.getCell(2, 1).font = { size: 9, color: { argb: "FF666666" } } as any;
      worksheet.getRow(2).height = 22;

      const cols = [
        { key: "date", label: "Vardiya Tarihi" },
        { key: "weekday", label: "Gün" },
        { key: "shift", label: "Vardiya" },
        { key: "checkIn", label: "Giriş" },
        { key: "checkInStatus", label: "Giriş Durumu" },
        { key: "checkOut", label: "Çıkış" },
        { key: "checkOutStatus", label: "Çıkış Durumu" },
        { key: "total", label: "Çalışma" },
        { key: "diff", label: "Fark" },
        { key: "location", label: "Konum Paylaşımı" },
      ];

      const headers = cols.map((c) => c.label);
      const colWidths = headers.map((h) => Math.min(50, Math.max(12, h.length + 2)));
      worksheet.columns = headers.map((label, i) => ({ header: label, key: `c${i}`, width: colWidths[i] }));

      const headerRow = worksheet.getRow(3);
      headers.forEach((label, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = label;
        cell.font = { bold: true, size: 10 } as any;
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true } as any;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } } as any;
        cell.border = {
          top: { style: "thin", color: { argb: "FFD0D0D0" } },
          left: { style: "thin", color: { argb: "FFD0D0D0" } },
          bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
          right: { style: "thin", color: { argb: "FFD0D0D0" } },
        } as any;
      });
      headerRow.height = 26;

      const getExcelStyleFor = (opts: { kind: "in" | "out"; status?: string | null }): { fill?: any; fontColor?: string } => {
        if (opts.kind === "in") {
          if (opts.status === "late") return { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDECEA" } }, fontColor: "FFB71C1C" };
          if (opts.status === "early") return { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4E5" } }, fontColor: "FFB26A00" };
          return {};
        }
        if (opts.status === "early") return { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDECEA" } }, fontColor: "FFB71C1C" };
        if (opts.status === "overtime") return { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE3F2FD" } }, fontColor: "FF1565C0" };
        return {};
      };

      const formatTotal = (mins?: number | null) => formatMinutesToHHMM(mins);

      dailyRows.forEach((r, rIdx) => {
        const cm = computeMetrics(r);
        const row = worksheet.getRow(4 + rIdx);
        const values: any[] = [
          r.date.split("-").reverse().join("."),
          r.weekdayLabel,
          r.shift ? `${r.shift.start}-${r.shift.end}` : "-",
          r.checkIn || "-",
          r.checkIn ? (cm.checkInStatus === "late" ? "Geç Giriş" : cm.checkInStatus === "early" ? "Erken Giriş" : "Zamanında") : "-",
          r.checkOut || "-",
          r.checkOut ? (cm.checkOutStatus === "early" ? "Erken Çıkış" : cm.checkOutStatus === "overtime" ? "Fazla Mesai" : "Zamanında") : "-",
          formatTotal(cm.totalMinutes),
          (() => {
            const diff = cm.diffMinutes ?? null;
            return diff != null ? (diff > 0 ? "+" : diff < 0 ? "-" : "") + formatMinutesToHHMM(Math.abs(diff)) : "-";
          })(),
          r.shift ? "Var" : "-",
        ];
        values.forEach((val, cIdx) => {
          const cell = row.getCell(cIdx + 1);
          cell.value = val;
          cell.font = { size: 9 } as any;
          cell.alignment = { vertical: "middle", wrapText: true, horizontal: cIdx === 1 ? "left" : "center" } as any;
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          } as any;
          if (rIdx % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } } as any;
          }
        });

        // Conditional coloring
        const inStatusCell = row.getCell(5);
        const inStyle = getExcelStyleFor({ kind: "in", status: cm.checkInStatus || null });
        if (inStyle.fill) inStatusCell.fill = inStyle.fill as any;
        if (inStyle.fontColor) inStatusCell.font = { ...(inStatusCell.font as any), color: { argb: inStyle.fontColor } } as any;

        const outStatusCell = row.getCell(7);
        const outStyle = getExcelStyleFor({ kind: "out", status: cm.checkOutStatus || null });
        if (outStyle.fill) outStatusCell.fill = outStyle.fill as any;
        if (outStyle.fontColor) outStatusCell.font = { ...(outStatusCell.font as any), color: { argb: outStyle.fontColor } } as any;

        const diffCell = row.getCell(9);
        const diff = cm.diffMinutes ?? null;
        if (diff != null) {
          if (diff > 0) {
            diffCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE3F2FD" } } as any;
            diffCell.font = { ...(diffCell.font as any), color: { argb: "FF1565C0" } } as any;
          } else if (diff < 0) {
            diffCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDECEA" } } as any;
            diffCell.font = { ...(diffCell.font as any), color: { argb: "FFB71C1C" } } as any;
          }
        }

        row.height = 22;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (employeeLabel || "personel").toString().replace(/[^\p{L}\p{N}\-_ ]+/gu, "").trim().replace(/\s+/g, "-");
      a.download = `giris-cikislar-${safeName || "personel"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      console.error("Excel export failed", err);
      alert("Excel dışa aktarım sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <PageWrapper title="PDKS" description="Personelin giriş-çıkış ve devam takibi" secondaryNav={<EmployeeSecondaryNav />}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardDescription>
                  Tarih aralığı: <span className="font-medium">{startDate.split("-").reverse().join(".")} - {endDate.split("-").reverse().join(".")}</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={areFiltersActive ? "default" : "outline"} size="sm" onClick={() => setFilterOpen(true)}>
                  <Filter className="h-4 w-4 mr-2" />
                  {areFiltersActive ? `Filtrele (${activeFiltersCount})` : "Filtrele"}
                </Button>

                <Button variant="outline" size="sm" onClick={() => exportAttendanceExcel()}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel Dışa Aktar
                </Button>

                {areFiltersActive && (
                  <div className="flex flex-wrap items-center gap-1">
                    {(() => {
                      const allFilters: { type: string; label: string; value?: string }[] = [];
                      if (!isDailyRangeDefault) {
                        const startDay = startDate.split("-")[2];
                        const endDay = endDate.split("-")[2];
                        const month = startDate.split("-")[1];
                        allFilters.push({ type: "dateRange", label: `${startDay}-${endDay}.${month}`, value: "dateRange" });
                      }
                      if (statusFilter !== "all") {
                        const statusLabel = statusFilter === "late_in" ? "Geç↑" : statusFilter === "late_out" ? "Geç↓" : "Anormal";
                        allFilters.push({ type: "status", label: statusLabel, value: statusFilter });
                      }
                      const visibleFilters = allFilters.slice(0, 3);
                      const remainingCount = allFilters.length - 3;
                      return (
                        <>
                          {visibleFilters.map((filter, index) => (
                            <Badge key={`${filter.type}-${index}`} variant="secondary" className="text-xs max-w-[60px] truncate shrink-0 pr-1.5">
                              {filter.label}
                              <button
                                type="button"
                                className="ml-1 rounded hover:bg-secondary/60 p-0.5"
                                aria-label="Kaldır"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (filter.type === "status") setStatusFilter("all");
                                  if (filter.type === "dateRange") {
                                    setStartDate(defaultDailyStart);
                                    setEndDate(defaultDailyEnd);
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          {remainingCount > 0 && (
                            <Badge variant="outline" className="text-xs">+{remainingCount} daha</Badge>
                          )}
                        </>
                      );
                    })()}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/10"
                      onClick={() => {
                        const today = startOfDayISO(new Date());
                        const weekAgo = startOfDayISO(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                        setStartDate(weekAgo);
                        setEndDate(today);
                        setStatusFilter("all");
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary border-primary">
                    {visibleColumns.date && (
                      <TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-[10px]">Vardiya Tarihi</TableHead>
                    )}
                    {visibleColumns.shift && (
                      <TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Vardiya</TableHead>
                    )}
                    {visibleColumns.checkIn && (
                      <TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Giriş</TableHead>
                    )}
                    {visibleColumns.checkInStatus && (
                      <TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-[10px]">Giriş Durumu</TableHead>
                    )}
                    {visibleColumns.checkOut && (
                      <TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Çıkış</TableHead>
                    )}
                    {visibleColumns.checkOutStatus && (
                      <TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-[10px]">Çıkış Durumu</TableHead>
                    )}
                    {visibleColumns.total && (
                      <TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Çalışma</TableHead>
                    )}
                    {visibleColumns.diff && (
                      <TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Fark</TableHead>
                    )}
                    {visibleColumns.location && (
                      <TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Konum Paylaşımı</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyRows.map((r, idx) => (
                    <TableRow key={`${r.date}-${idx}`} className="hover:bg-muted/40 border-b border-border/50 text-sm">
                      {visibleColumns.date && (
                        <TableCell className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-medium text-[11px]">{r.date.split("-").reverse().join(".")}</span>
                            <span className="text-[10px] text-muted-foreground">{r.weekdayLabel}</span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.shift && (
                        <TableCell className="py-2 px-3 text-center">
                          {r.shift ? (
                            <span className="text-xs font-medium">{r.shift.start} - {r.shift.end}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.checkIn && (
                        <TableCell className="py-2 px-3 text-center">
                          {r.checkIn ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xs font-medium">{r.checkIn}</span>
                              {r.checkInSource && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                  {r.checkInSource === "device" ? "Cihaz" : r.checkInSource === "mobile" ? "Mobil" : r.checkInSource === "manual" ? "Manuel" : "Web"}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.checkInStatus && (
                        <TableCell className="py-2 px-3 text-center">
                          {r.checkIn ? (
                            computeMetrics(r).checkInStatus === "late" ? (
                              <Badge variant="destructive" className="text-[10px]">Geç Giriş</Badge>
                            ) : computeMetrics(r).checkInStatus === "early" ? (
                              <Badge variant="secondary" className="text-[10px]">Erken Giriş</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Zamanında</Badge>
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.checkOut && (
                        <TableCell className="py-2 px-3 text-center">
                          {r.checkOut ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xs font-medium">{r.checkOut}</span>
                              {r.checkOutSource && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                  {r.checkOutSource === "device" ? "Cihaz" : r.checkOutSource === "mobile" ? "Mobil" : r.checkOutSource === "manual" ? "Manuel" : "Web"}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.checkOutStatus && (
                        <TableCell className="py-2 px-3 text-center">
                          {r.checkOut ? (
                            computeMetrics(r).checkOutStatus === "early" ? (
                              <Badge variant="destructive" className="text-[10px]">Erken Çıkış</Badge>
                            ) : computeMetrics(r).checkOutStatus === "overtime" ? (
                              <Badge className="text-[10px]">Fazla Mesai</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Zamanında</Badge>
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.total && (
                        <TableCell className="py-2 px-3 text-center">
                          <span className="text-xs font-medium">{formatMinutesToHHMM(computeMetrics(r).totalMinutes)}</span>
                        </TableCell>
                      )}
                      {visibleColumns.diff && (
                        <TableCell className="py-2 px-3 text-center">
                          {(() => {
                            const diff = computeMetrics(r).diffMinutes ?? null;
                            if (diff == null) return <span className="text-muted-foreground">-</span>;
                            const isOver = diff > 0;
                            const label = `${isOver ? "+" : diff < 0 ? "-" : ""}${formatMinutesToHHMM(Math.abs(diff))}`;
                            return (
                              <Badge variant={isOver ? "default" : "destructive"} className="text-[10px]">
                                {label}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                      )}
                      {visibleColumns.location && (
                        <TableCell className="py-2 px-3 text-center">
                          {r.shift ? (
                            <Button variant="outline" size="sm" className="text-primary hover:bg-primary/5 h-7 text-xs">
                              Görüntüle
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>

        <Drawer open={filterOpen} onOpenChange={setFilterOpen} direction="left">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filtreler</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Başlangıç Tarihi</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bitiş Tarihi</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hızlı Aralıklar</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = startOfDayISO(new Date());
                      const past = startOfDayISO(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                      setStartDate(past);
                      setEndDate(today);
                    }}
                  >
                    Son 1 Hafta
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = startOfDayISO(new Date());
                      const past = startOfDayISO(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
                      setStartDate(past);
                      setEndDate(today);
                    }}
                  >
                    Son 1 Ay
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = startOfDayISO(new Date());
                      const past = startOfDayISO(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
                      setStartDate(past);
                      setEndDate(today);
                    }}
                  >
                    Son 3 Ay
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = startOfDayISO(new Date());
                      const past = startOfDayISO(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000));
                      setStartDate(past);
                      setEndDate(today);
                    }}
                  >
                    Son 6 Ay
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Giriş/Çıkış Durumu</label>
                <ToggleGroup type="single" value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as any)} className="shadow-sm !w-full" variant="outline" size="sm">
                  <ToggleGroupItem value="all">Tümü</ToggleGroupItem>
                  <ToggleGroupItem value="late_in">Geç Girişler</ToggleGroupItem>
                  <ToggleGroupItem value="late_out">Geç Çıkışlar</ToggleGroupItem>
                  <ToggleGroupItem value="anomalies">Anormal</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <DrawerFooter>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    const today = startOfDayISO(new Date());
                    const weekAgo = startOfDayISO(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                    setStartDate(weekAgo);
                    setEndDate(today);
                    setStatusFilter("all");
                  }}
                >
                  Filtreyi Sıfırla
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </PageWrapper>
  );
}

 


