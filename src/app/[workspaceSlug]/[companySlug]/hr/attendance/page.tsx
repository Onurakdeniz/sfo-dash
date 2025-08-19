"use client";

import { useEffect, useMemo, useState } from "react";
import pdfMake from "pdfmake/build/pdfmake";
import { vfs as pdfMakeVfs } from "pdfmake/build/vfs_fonts";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { PageWrapper } from "@/components/page-wrapper";
import { RoleGuard } from "@/components/layouts/role-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
 
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 
import { ChevronLeft, ChevronRight, Filter, MoreHorizontal, Plus, Edit, Download, FileSpreadsheet, StickyNote, Check, X } from "lucide-react";
import AttendanceTabs from "./attendance-tabs";

interface WorkspaceContextData {
  workspace: { id: string; name: string; slug: string } | null;
  currentCompany?: { id: string; name: string; slug: string } | null;
  user?: { id: string; role: string; isOwner: boolean; name?: string | null; email?: string | null };
}

interface EmployeeRow {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  profileManagerId?: string | null;
}

type AttendanceRow = {
  employee: EmployeeRow;
  date: string; // ISO date string (yyyy-mm-dd)
  weekdayLabel: string;
  shift: { start: string; end: string } | null;
  checkIn?: string | null;
  checkOut?: string | null;
  checkInStatus?: "late" | "early" | "ontime" | null;
  checkOutStatus?: "early" | "overtime" | "ontime" | null;
  checkInSource?: "device" | "mobile" | "manual" | "web" | null;
  checkOutSource?: "device" | "mobile" | "manual" | "web" | null;
  checkInNote?: string | null;
  checkOutNote?: string | null;
  note?: string | null;
  approval?: "pending" | "approved" | "rejected" | null;
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

function addMonthsYM(ym: string, delta: number) {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const newMonth = m - 1 + delta;
  const newDate = new Date(y, newMonth, 1);
  return `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`;
}

const WEEKDAY_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] as const;

export default function AttendancePage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  // context
  const { data: contextData } = useQuery<WorkspaceContextData>({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch context");
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug)
  });

  const workspaceId = contextData?.workspace?.id;
  const companyId = contextData?.currentCompany?.id;

  // employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery<EmployeeRow[]>({
    queryKey: ["attendance-employees", workspaceId, companyId],
    queryFn: async () => {
      if (!workspaceId || !companyId) return [];
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/employees`, { credentials: "include" });
      if (!res.ok) return [];
      const json = await res.json();
      return (json || []).map((r: any) => ({ id: r.id, name: r.name, email: r.email, image: r.image, profileManagerId: r.profile?.managerId || null }));
    },
    enabled: !!(workspaceId && companyId)
  });

  // local filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return startOfDayISO(d);
  });
  const [endDate, setEndDate] = useState<string>(() => startOfDayISO(new Date()));
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"daily" | "weekly-person">("daily");
  const [selectedDate, setSelectedDate] = useState<string>(() => startOfDayISO(new Date()));
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AttendanceRow | null>(null);
  const [editCheckIn, setEditCheckIn] = useState<string>("");
  const [editCheckOut, setEditCheckOut] = useState<string>("");
  const [editCheckInNote, setEditCheckInNote] = useState<string>("");
  const [editCheckOutNote, setEditCheckOutNote] = useState<string>("");
  const [overrides, setOverrides] = useState<Record<string, Partial<AttendanceRow>>>({});
  const [statusFilter, setStatusFilter] = useState<"all" | "late_in" | "late_out" | "anomalies">("all");
  const [visibleColumns] = useState<Record<string, boolean>>({
    employee: true,
    date: true,
    shift: true,
    checkIn: true,
    checkInStatus: true,
    checkOut: true,
    checkOutStatus: true,
    total: true,
    diff: true,
    location: true,
  });

  const companyName = contextData?.currentCompany?.name || "";
  const workspaceName = contextData?.workspace?.name || "";

  function formatDateTR(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  // Helpers: time parsing/formatting and row metrics
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

    const diffMinutes =
      expectedMinutes != null && totalMinutes != null ? totalMinutes - expectedMinutes : null;

    let derivedCheckInStatus: AttendanceRow["checkInStatus"] = null;
    let derivedCheckOutStatus: AttendanceRow["checkOutStatus"] = null;
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
      checkInStatus: derivedCheckInStatus,
      checkOutStatus: derivedCheckOutStatus,
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

  function buildFiltersSummary() {
    const empCount = selectedEmployeeIds.length > 0 ? selectedEmployeeIds.length : employees.length;
    if (viewMode === "daily") {
      return `Tarih Aralığı: ${formatDateTR(startDate)} - ${formatDateTR(endDate)}  |  Personel: ${empCount}`;
    }
    return `Hafta: ${formatDateTR(weekDays[0])} - ${formatDateTR(weekDays[6])}  |  Personel: ${empCount}`;
  }

  // sync edit inputs when opening modal
  useEffect(() => {
    if (editModalOpen && editingRow) {
      setEditCheckIn(editingRow.checkIn || "");
      setEditCheckOut(editingRow.checkOut || "");
      setEditCheckInNote(editingRow.checkInNote || "");
      setEditCheckOutNote(editingRow.checkOutNote || "");
    }
  }, [editModalOpen, editingRow]);

  function exportAttendancePDF() {
    try {
      (pdfMake as any).vfs = (pdfMakeVfs as any);
      const filtersSummary = buildFiltersSummary();
      // helper to color status cells
      const pdfStatusStyleFor = (kind: "in" | "out", row: AttendanceRow): { fillColor?: string; color?: string } => {
        if (kind === "in") {
          if (row.checkInStatus === "late") return { fillColor: "#fdecea", color: "#b71c1c" };
          if (row.checkInStatus === "early") return { fillColor: "#fff4e5", color: "#b26a00" };
          return {};
        }
        if (row.checkOutStatus === "early") return { fillColor: "#fdecea", color: "#b71c1c" };
        if (row.checkOutStatus === "overtime") return { fillColor: "#e3f2fd", color: "#1565c0" };
        return {};
      };
      const pdfAnomalyStyleForDay = (r: AttendanceRow | null | undefined): { fillColor?: string; color?: string } => {
        if (!r) return {};
        // Priority: red > amber > blue
        if (r.checkInStatus === "late" || r.checkOutStatus === "early") return { fillColor: "#fdecea", color: "#b71c1c" };
        if (r.checkInStatus === "early") return { fillColor: "#fff4e5", color: "#b26a00" };
        if (r.checkOutStatus === "overtime") return { fillColor: "#e3f2fd", color: "#1565c0" };
        return {};
      };
      const headerStack = [
        { text: companyName || "Şirket", style: "title" },
        { text: "Giriş-Çıkışlar", style: "subtitle", margin: [0, 2, 0, 0] },
        {
          columns: [
            { text: filtersSummary, style: "filters", width: "*", margin: [0, 6, 0, 0] },
            {
              width: 220,
              alignment: "right",
              stack: [
                { text: `Çalışma Alanı: ${workspaceName || "-"}`, style: "meta" },
                { text: `Tarih: ${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`, style: "meta" },
              ],
            },
          ],
        },
        { canvas: [{ type: "line", x1: 0, y1: 8, x2: 1100, y2: 8, lineWidth: 1, lineColor: "#e0e0e0" }], margin: [0, 4, 0, 0] },
      ];

      let table: any = {};
      if (viewMode === "daily") {
        const cols = ([
          { key: "employeeName", label: "Personel", visible: visibleColumns.employee },
          { key: "dateLabel", label: "Vardiya Tarihi", visible: visibleColumns.date },
          { key: "shift", label: "Vardiya", visible: visibleColumns.shift },
          { key: "checkIn", label: "Giriş", visible: visibleColumns.checkIn },
          { key: "checkInStatus", label: "Giriş Durumu", visible: visibleColumns.checkInStatus },
          { key: "checkOut", label: "Çıkış", visible: visibleColumns.checkOut },
          { key: "checkOutStatus", label: "Çıkış Durumu", visible: visibleColumns.checkOutStatus },
          { key: "total", label: "Çalışma", visible: visibleColumns.total },
          { key: "diff", label: "Fark", visible: visibleColumns.diff },
          { key: "location", label: "Konum Paylaşımı", visible: visibleColumns.location },
        ] as const).filter((c) => c.visible);

        const widths = cols.map(() => "*");
        const headerRow = cols.map((c) => ({ text: c.label, style: "tableHeader", alignment: "center" as const }));
        const bodyRows = dailyRows.map((r) => {
          const cm = computeMetrics(r);
          return cols.map((c) => {
            switch (c.key) {
              case "employeeName":
                return { text: r.employee.name || r.employee.email || "-" };
              case "dateLabel":
                return { text: `${formatDateTR(r.date)} (${r.weekdayLabel})`, alignment: "center" };
              case "shift":
                return { text: r.shift ? `${r.shift.start}-${r.shift.end}` : "-", alignment: "center" };
              case "checkIn":
                return { text: r.checkIn || "-", alignment: "center" };
              case "checkInStatus":
                return { text: getStatusLabel("checkIn", r), alignment: "center", ...pdfStatusStyleFor("in", { ...r, checkInStatus: cm.checkInStatus }) };
              case "checkOut":
                return { text: r.checkOut || "-", alignment: "center" };
              case "checkOutStatus":
                return { text: getStatusLabel("checkOut", r), alignment: "center", ...pdfStatusStyleFor("out", { ...r, checkOutStatus: cm.checkOutStatus }) };
              case "total":
                return { text: formatMinutesToHHMM(cm.totalMinutes), alignment: "center" };
              case "diff": {
                const val = cm.diffMinutes ?? null;
                const text = val != null ? (val > 0 ? "+" : val < 0 ? "-" : "") + formatMinutesToHHMM(Math.abs(val)) : "-";
                return { text, alignment: "center" };
              }
              case "location":
                return { text: r.shift ? "Var" : "-", alignment: "center" };
              default:
                return { text: "-" };
            }
          });
        });

        table = {
          headerRows: 1,
          widths,
          body: [headerRow, ...bodyRows],
        };
      } else {
        const weekHeads = ["Personel", ...weekDays.map((d) => `${WEEKDAY_TR[new Date(d).getDay()]}\n${formatDateTR(d)}`)];
        const widths = [80, ...weekDays.map(() => 60)];
        const headerRow = weekHeads.map((t) => ({ text: t, style: "tableHeader", alignment: "center" as const }));
        const bodyRows = weeklyData.map((w) => {
          const row = [w.employee.name || w.employee.email || "-"] as any[];
          for (const c of w.cells) {
            if (c && c.shift) {
              const style = pdfAnomalyStyleForDay(c);
              row.push({ text: `${c.shift.start}-${c.shift.end}\n${c.checkIn || "-"} / ${c.checkOut || "-"}`, alignment: "center", ...style });
            } else {
              row.push({ text: "-", alignment: "center" });
            }
          }
          return row;
        });
        table = {
          headerRows: 1,
          widths,
          body: [headerRow, ...bodyRows],
        };
      }

      const docDefinition: any = {
        pageSize: viewMode === "daily" ? "A4" : "A3",
        pageOrientation: "landscape",
        pageMargins: [20, 80, 20, 30],
        defaultStyle: { font: "Roboto", fontSize: 8, lineHeight: 1.15 },
        header: () => ({ margin: [20, 18, 20, 0], stack: headerStack }),
        content: [
          {
            table,
            layout: {
              fillColor: (rowIndex: number) => (rowIndex === 0 ? "#f2f2f2" : rowIndex % 2 === 0 ? "#fafafa" : null),
              hLineColor: "#d0d0d0",
              vLineColor: "#d0d0d0",
              paddingLeft: () => 4,
              paddingRight: () => 4,
              paddingTop: () => 6,
              paddingBottom: () => 6,
            },
          },
        ],
        styles: {
          title: { fontSize: 14, bold: true },
          subtitle: { fontSize: 10 },
          filters: { fontSize: 8, color: "#444" },
          meta: { fontSize: 8, color: "#444" },
          tableHeader: { bold: true },
        },
      };

      (pdfMake as any).createPdf(docDefinition).download("giris-cikislar.pdf");
    } catch (err) {
      console.error("PDF export failed", err);
      alert("PDF dışa aktarım sırasında bir hata oluştu.");
    }
  }

  async function exportAttendanceExcel() {
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
      const wsName = viewMode === "daily" ? "Günlük" : "Haftalık";
      const worksheet = workbook.addWorksheet(wsName, { views: [{ state: "frozen", ySplit: 3 }], properties: { defaultRowHeight: 16 } });

      const title = `${companyName || "Şirket"} - Giriş-Çıkışlar  |  ${buildFiltersSummary()}  |  Tarih: ${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
      worksheet.mergeCells(1, 1, 1, 12);
      worksheet.getCell(1, 1).value = title;
      worksheet.getCell(1, 1).font = { size: 12, bold: true };
      worksheet.getRow(1).height = 18;

      worksheet.mergeCells(2, 1, 2, 12);
      worksheet.getCell(2, 1).value = `Çalışma Alanı: ${workspaceName || "-"}`;
      worksheet.getCell(2, 1).font = { size: 9, color: { argb: "FF666666" } };
      worksheet.getRow(2).height = 22;

      let headers: string[] = [];
      let dataRows: string[][] = [];
      // Keep column meta for styling
      let excelDailyCols: { key: string; label: string; visible: boolean }[] = [];

      if (viewMode === "daily") {
        const cols = [
          { key: "employee", label: "Personel", visible: visibleColumns.employee },
          { key: "date", label: "Vardiya Tarihi", visible: visibleColumns.date },
          { key: "shift", label: "Vardiya", visible: visibleColumns.shift },
          { key: "checkIn", label: "Giriş", visible: visibleColumns.checkIn },
          { key: "checkInStatus", label: "Giriş Durumu", visible: visibleColumns.checkInStatus },
          { key: "checkOut", label: "Çıkış", visible: visibleColumns.checkOut },
          { key: "checkOutStatus", label: "Çıkış Durumu", visible: visibleColumns.checkOutStatus },
          { key: "total", label: "Çalışma", visible: visibleColumns.total },
          { key: "diff", label: "Fark", visible: visibleColumns.diff },
          { key: "location", label: "Konum Paylaşımı", visible: visibleColumns.location },
        ].filter((c) => c.visible);
        excelDailyCols = cols;
        headers = cols.map((c) => c.label);
        dataRows = dailyRows.map((r) =>
          cols.map((c) => {
            const cm = computeMetrics(r);
            switch (c.key) {
              case "employee":
                return r.employee.name || r.employee.email || "-";
              case "date":
                return `${formatDateTR(r.date)} (${r.weekdayLabel})`;
              case "shift":
                return r.shift ? `${r.shift.start}-${r.shift.end}` : "-";
              case "checkIn":
                return r.checkIn || "-";
              case "checkInStatus":
                return getStatusLabel("checkIn", r);
              case "checkOut":
                return r.checkOut || "-";
              case "checkOutStatus":
                return getStatusLabel("checkOut", r);
              case "total":
                return formatMinutesToHHMM(cm.totalMinutes);
              case "diff": {
                const val = cm.diffMinutes ?? null;
                return val != null ? (val > 0 ? "+" : val < 0 ? "-" : "") + formatMinutesToHHMM(Math.abs(val)) : "-";
              }
              case "location":
                return r.shift ? "Var" : "-";
              default:
                return "-";
            }
          })
        );
      } else {
        headers = ["Personel", ...weekDays.map((d) => `${WEEKDAY_TR[new Date(d).getDay()]} ${formatDateTR(d)}`)];
        dataRows = weeklyData.map((w) => {
          const row: string[] = [w.employee.name || w.employee.email || "-"];
          for (const c of w.cells) {
            if (c && c.shift) row.push(`${c.shift.start}-${c.shift.end} | ${c.checkIn || "-"} / ${c.checkOut || "-"}`);
            else row.push("-");
          }
          return row;
        });
      }

      const colWidths = headers.map((h) => Math.min(50, Math.max(12, (h.length + 2))));
      // Make the Personel (employee name) column wider for readability
      if (viewMode === "daily") {
        if (excelDailyCols.length > 0) {
          const personIdx = excelDailyCols.findIndex((c) => c.key === "employee");
          if (personIdx !== -1) colWidths[personIdx] = Math.max(colWidths[personIdx], 30);
        }
      } else {
        // Weekly view: first column is Personel
        if (colWidths.length > 0) colWidths[0] = Math.max(colWidths[0], 30);
      }
      worksheet.columns = headers.map((label, i) => ({ header: label, key: `c${i}`, width: colWidths[i] }));

      const headerRow = worksheet.getRow(3);
      headers.forEach((label, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = label;
        cell.font = { bold: true, size: 10 };
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

      // Helper to decide excel colors
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

      dataRows.forEach((vals, rIdx) => {
        const row = worksheet.getRow(4 + rIdx);
        vals.forEach((val, cIdx) => {
          const cell = row.getCell(cIdx + 1);
          cell.value = val;
          cell.font = { size: 9 } as any;
          cell.alignment = { vertical: "middle", wrapText: true } as any;
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          } as any;
          if (rIdx % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } } as any;
          }
          // Conditional coloring for anomalies
          if (viewMode === "daily" && excelDailyCols.length > 0) {
            const colMeta = excelDailyCols[cIdx];
            const cm = computeMetrics(dailyRows[rIdx]!);
            if (colMeta?.key === "checkInStatus") {
              const style = getExcelStyleFor({ kind: "in", status: cm.checkInStatus || null });
              if (style.fill) cell.fill = style.fill as any;
              if (style.fontColor) cell.font = { ...(cell.font as any), color: { argb: style.fontColor } } as any;
            }
            if (colMeta?.key === "checkOutStatus") {
              const style = getExcelStyleFor({ kind: "out", status: cm.checkOutStatus || null });
              if (style.fill) cell.fill = style.fill as any;
              if (style.fontColor) cell.font = { ...(cell.font as any), color: { argb: style.fontColor } } as any;
            }
            if (colMeta?.key === "diff") {
              const diff = cm.diffMinutes ?? null;
              if (diff != null) {
                if (diff > 0) {
                  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE3F2FD" } } as any;
                  cell.font = { ...(cell.font as any), color: { argb: "FF1565C0" } } as any;
                } else if (diff < 0) {
                  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDECEA" } } as any;
                  cell.font = { ...(cell.font as any), color: { argb: "FFB71C1C" } } as any;
                }
              }
            }
          }
          if (viewMode !== "daily" && cIdx >= 1) {
            const dayCell = weeklyData[rIdx]?.cells[cIdx - 1];
            if (dayCell) {
              const cm = computeMetrics(dayCell);
              const priorityStyle = cm.checkInStatus === "late" || cm.checkOutStatus === "early"
                ? { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDECEA" } }, fontColor: "FFB71C1C" }
                : cm.checkInStatus === "early"
                ? { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4E5" } }, fontColor: "FFB26A00" }
                : cm.checkOutStatus === "overtime"
                ? { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE3F2FD" } }, fontColor: "FF1565C0" }
                : null;
              if (priorityStyle) {
                cell.fill = priorityStyle.fill as any;
                cell.font = { ...(cell.font as any), bold: true, color: { argb: priorityStyle.fontColor } } as any;
              }
            }
          }
        });
        row.height = 24;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = viewMode === "daily" ? "giris-cikislar-gunluk.xlsx" : "giris-cikislar-haftalik.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      console.error("Excel export failed", err);
      alert("Excel dışa aktarım sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  function getWeekRangeFromISO(iso: string) {
    const d = new Date(iso);
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7; // 0->6, 1->0 ... Monday=0
    const monday = new Date(d);
    monday.setDate(d.getDate() - diffToMonday);
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      const x = new Date(monday);
      x.setDate(monday.getDate() + i);
      week.push(startOfDayISO(x));
    }
    return week;
  }


  // build date list
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

  // manager scoping
  const currentUserId = (contextData as any)?.user?.id as string | undefined;
  const currentUserRole = (contextData as any)?.user?.role as string | undefined;
  const isOwnerOrAdmin = !!(contextData as any)?.user?.isOwner || currentUserRole === "admin";
  const isManager = currentUserRole === "manager" && !isOwnerOrAdmin;
  const scopedEmployees = useMemo(() => {
    if (isManager && currentUserId) {
      return employees.filter((e) => e.profileManagerId === currentUserId);
    }
    return employees;
  }, [employees, isManager, currentUserId]);

  // demo row generator (until real PDKS integration). Uses stable pseudo-random times.
  const rows: AttendanceRow[] = useMemo(() => {
    const target = selectedEmployeeIds.length > 0 ? scopedEmployees.filter((e) => selectedEmployeeIds.includes(e.id)) : scopedEmployees;
    const result: AttendanceRow[] = [];
    for (const e of target) {
      for (let i = 0; i < dateList.length; i++) {
        const iso = dateList[i];
        const day = new Date(iso);
        const dow = day.getDay();
        // weekdays have a default shift 09:00-17:00, weekends off
        const isWorkingDay = dow !== 0 && dow !== 6;
        const shift = isWorkingDay ? { start: "09:00", end: "17:00" } : null;
        let checkIn: string | null = null;
        let checkOut: string | null = null;
        let checkInStatus: AttendanceRow["checkInStatus"] = null;
        let checkOutStatus: AttendanceRow["checkOutStatus"] = null;
        const seed = (e.id.charCodeAt(0) + i * 17 + dow * 13) % 7; // small variety
        if (shift) {
          // vary by 15 minutes
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
        const baseRow: AttendanceRow = {
          employee: e,
          date: iso,
          weekdayLabel: WEEKDAY_TR[dow],
          shift,
          checkIn,
          checkOut,
          checkInStatus,
          checkOutStatus,
          checkInSource,
          checkOutSource,
          checkInNote: seed === 2 ? "Gecikme nedeni: trafik." : null,
          checkOutNote: seed === 5 ? "Erken çıkış talebi onaylandı." : null,
          note: null,
          approval: shift ? "pending" : null,
        };
        const key = `${e.id}-${iso}`;
        const ov = overrides[key];
        result.push(ov ? { ...baseRow, ...ov } : baseRow);
      }
    }
    return result;
  }, [scopedEmployees, dateList, selectedEmployeeIds, overrides]);

  const dailyRows = useMemo(() => {
    const filtered = rows.filter(r => {
      if (!(r.date >= startDate && r.date <= endDate)) return false;
      const cm = computeMetrics(r);
      if (statusFilter === "late_in") {
        return cm.checkInStatus === "late";
      }
      if (statusFilter === "late_out") {
        return cm.checkOutStatus === "overtime";
      }
      if (statusFilter === "anomalies") {
        const anomalousIn = cm.checkInStatus === "late" || cm.checkInStatus === "early";
        const anomalousOut = cm.checkOutStatus === "early" || cm.checkOutStatus === "overtime";
        return anomalousIn || anomalousOut;
      }
      return true;
    });
    // Sort by date DESC, then by employee label ASC
    filtered.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      const aLabel = a.employee.name || a.employee.email || "";
      const bLabel = b.employee.name || b.employee.email || "";
      return aLabel.localeCompare(bLabel, "tr", { sensitivity: "base" });
    });
    return filtered;
  }, [rows, startDate, endDate, statusFilter]);

  const weekDays = useMemo(() => getWeekRangeFromISO(selectedDate), [selectedDate]);
  
  
  const weeklyData = useMemo(() => {
    const targetEmployees = selectedEmployeeIds.length > 0 
      ? scopedEmployees.filter(e => selectedEmployeeIds.includes(e.id)) 
      : scopedEmployees;
    
    return targetEmployees.map(emp => {
      const cells = weekDays.map(d => rows.find(r => r.employee.id === emp.id && r.date === d) || null);
      return { employee: emp, cells };
    });
  }, [scopedEmployees, selectedEmployeeIds, rows, weekDays]);

  // active filters calculation
  const defaultDailyEnd = useMemo(() => startOfDayISO(new Date()), []);
  const defaultDailyStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return startOfDayISO(d);
  }, []);
  const defaultWeeklySelectedDate = defaultDailyEnd;
  const isDailyRangeDefault = startDate === defaultDailyStart && endDate === defaultDailyEnd;
  const isWeeklyDateDefault = selectedDate === defaultWeeklySelectedDate;
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    // count date filters relevant to current view
    if (viewMode === "daily") {
      if (!isDailyRangeDefault) count += 1;
    } else if (viewMode === "weekly-person") {
      if (!isWeeklyDateDefault) count += 1;
    }
    // status filter
    if (statusFilter !== "all") count += 1;
    // selected employees (count values)
    count += selectedEmployeeIds.length;
    return count;
  }, [viewMode, isDailyRangeDefault, isWeeklyDateDefault, statusFilter, selectedEmployeeIds.length]);
  const areFiltersActive = activeFiltersCount > 0;

  const secondaryNav = <AttendanceTabs />;

  const actions = (
    <div className="flex items-center gap-3">
      <Button size="sm" className="font-medium shadow-sm">
        <Plus className="h-4 w-4 mr-2" />Ekle
      </Button>
    </div>
  );

  return (
    <RoleGuard requiredRoles={["owner", "admin", "manager"]} fallbackMessage="Mesai yönetimine erişmek için yönetici yetkisi gereklidir.">
      <PageWrapper
        title="Giriş-Çıkışlar"
        description="Bu sayfada seçtiğiniz tarih aralığına ait giriş-çıkış aksiyonlarını görüntüleyebilir, düzenleme yapabilirsiniz."
        actions={actions}
        secondaryNav={secondaryNav}
      >
        <div className="space-y-6">

          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg">Giriş-Çıkışlar</CardTitle>
                  <CardDescription>
                    {viewMode === "daily" ? (
                      <>Tarih aralığı: <span className="font-medium">{startDate.split("-").reverse().join(".")} - {endDate.split("-").reverse().join(".")}</span></>
                    ) : (
                      <>Hafta: <span className="font-medium">{weekDays[0]?.split("-").reverse().join(".")} - {weekDays[6]?.split("-").reverse().join(".")}</span></>
                    )}
                  </CardDescription>
                </div>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="daily">Günlük</TabsTrigger>
                    <TabsTrigger value="weekly-person">Haftalık</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant={areFiltersActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterOpen(true)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {areFiltersActive ? `Filtrele (${activeFiltersCount})` : "Filtrele"}
                </Button>

                {/* Active Filter Chips */}
                {areFiltersActive && (
                  <div className="flex flex-wrap items-center gap-1">
                    {(() => {
                      const allFilters: { type: string; label: string; value?: string }[] = [];
                      
                      // Helper function to truncate text (ultra short)
                      const truncateText = (text: string, maxLength: number = 5) => {
                        if (text.length <= maxLength) return text;
                        return text.slice(0, maxLength) + '..';
                      };
                      
                      // Collect selected employees (show max 1 employee name + summary)
                      if (selectedEmployeeIds.length === 1) {
                        const emp = employees.find((e) => e.id === selectedEmployeeIds[0]);
                        const empName = emp?.name || emp?.email || selectedEmployeeIds[0];
                        allFilters.push({ 
                          type: 'employee', 
                          label: truncateText(empName, 6),
                          value: selectedEmployeeIds[0]
                        });
                      } else if (selectedEmployeeIds.length > 1) {
                        allFilters.push({ 
                          type: 'employees', 
                          label: `${selectedEmployeeIds.length}kişi`,
                          value: 'all'
                        });
                      }
                      
                      // Add status filter (ultra short labels)
                      if (statusFilter !== "all") {
                        const statusLabel = statusFilter === "late_in" ? "Geç↑" : 
                                          statusFilter === "late_out" ? "Geç↓" : "Anormal";
                        allFilters.push({ 
                          type: 'status', 
                          label: statusLabel,
                          value: statusFilter
                        });
                      }
                      
                      // Add date filters (ultra compact format)
                      if (viewMode === "daily" && !isDailyRangeDefault) {
                        const startDay = startDate.split("-")[2]; // DD
                        const endDay = endDate.split("-")[2]; // DD
                        const month = startDate.split("-")[1]; // MM
                        allFilters.push({ 
                          type: 'dateRange', 
                          label: `${startDay}-${endDay}.${month}`,
                          value: 'dateRange' 
                        });
                      }
                      
                      if (viewMode === "weekly-person" && !isWeeklyDateDefault) {
                        const weekStartDay = weekDays[0]?.split("-")[2]; // DD
                        const weekMonth = weekDays[0]?.split("-")[1]; // MM
                        allFilters.push({ 
                          type: 'weekRange', 
                          label: `H${weekStartDay}.${weekMonth}`,
                          value: 'weekRange' 
                        });
                      }

                      // Show only first 3 filters
                      const visibleFilters = allFilters.slice(0, 3);
                      const remainingCount = allFilters.length - 3;

                      return (
                        <>
                          {visibleFilters.map((filter, index) => (
                            <Badge key={`${filter.type}-${index}`} variant="secondary" className="text-xs max-w-[50px] truncate shrink-0 pr-1.5">
                              {filter.label}
                              <button
                                type="button"
                                className="ml-1 rounded hover:bg-secondary/60 p-0.5"
                                aria-label="Kaldır"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (filter.type === 'employee' && filter.value) {
                                    setSelectedEmployeeIds((prev) => prev.filter((x) => x !== filter.value));
                                  } else if (filter.type === 'employees') {
                                    setSelectedEmployeeIds([]);
                                  } else if (filter.type === 'status') {
                                    setStatusFilter('all');
                                  } else if (filter.type === 'dateRange') {
                                    setStartDate(defaultDailyStart);
                                    setEndDate(defaultDailyEnd);
                                  } else if (filter.type === 'weekRange') {
                                    setSelectedDate(defaultWeeklySelectedDate);
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          {remainingCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +{remainingCount} daha
                            </Badge>
                          )}
                        </>
                      );
                    })()}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/10"
                      onClick={() => {
                        setSelectedEmployeeIds([]);
                        const today = startOfDayISO(new Date());
                        const weekAgo = startOfDayISO(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                        setStartDate(weekAgo);
                        setEndDate(today);
                        setSelectedDate(today);
                        setStatusFilter("all");
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                )}

                <Button variant="outline" size="sm" onClick={() => exportAttendanceExcel()}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel Dışa Aktar
                </Button>

                <Button variant="outline" size="sm" onClick={() => exportAttendancePDF()}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF Dışa Aktar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Tabs value={viewMode}>
                  <TabsContent value="daily" className="m-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary hover:bg-primary border-primary">
                            {visibleColumns.employee && (<TableHead className="text-primary-foreground font-semibold py-2 px-3 text-xs">Personel</TableHead>)}
                            {visibleColumns.date && (<TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-[10px]">Vardiya Tarihi</TableHead>)}
                            {visibleColumns.shift && (<TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Vardiya</TableHead>)}
                            {visibleColumns.checkIn && (<TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Giriş</TableHead>)}
                            {visibleColumns.checkInStatus && (<TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-[10px]">Giriş Durumu</TableHead>)}
                            {visibleColumns.checkOut && (<TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Çıkış</TableHead>)}
                            {visibleColumns.checkOutStatus && (<TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-[10px]">Çıkış Durumu</TableHead>)}
                            {visibleColumns.total && (<TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Çalışma</TableHead>)}
                            {visibleColumns.diff && (<TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Fark</TableHead>)}
                            {visibleColumns.location && (<TableHead className="text-primary-foreground font-semibold py-2 px-3 text-center text-xs">Konum Paylaşımı</TableHead>)}
                            <TableHead className="text-primary-foreground w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailyRows.map((r, idx) => (
                            <TableRow key={`${r.employee.id}-${r.date}-${idx}`} className="hover:bg-muted/40 border-b border-border/50 text-sm">
                              {visibleColumns.employee && (
                                <TableCell className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-9 w-9">
                                      <AvatarImage src={r.employee.image || undefined} alt={r.employee.name} />
                                      <AvatarFallback className="font-semibold bg-secondary text-secondary-foreground text-xs">
                                        {r.employee.name?.[0]?.toUpperCase() || r.employee.email?.[0]?.toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-xs">{r.employee.name}</div>
                                      <div className="text-xs text-muted-foreground">{r.employee.email}</div>
                                    </div>
                                  </div>
                                </TableCell>
                              )}
                              {visibleColumns.date && (
                                <TableCell className="py-2 px-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="font-medium text-[11px]">{r.date.split("-").reverse().join(".")}</span>
                                    {(r.checkInNote || r.checkOutNote) && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div className="max-w-xs space-y-1">
                                              {r.checkInNote && <p><span className="font-medium">Giriş:</span> {r.checkInNote}</p>}
                                              {r.checkOutNote && <p><span className="font-medium">Çıkış:</span> {r.checkOutNote}</p>}
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    <span className="text-[10px] text-muted-foreground">{r.weekdayLabel}</span>
                                  </div>
                                </TableCell>
                              )}
                              {visibleColumns.shift && (
                                <TableCell className="py-2 px-3 text-center">
                                  {r.shift ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="text-xs font-medium">{r.shift.start} - {r.shift.end}</span>
                                      <Edit className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              )}
                              {visibleColumns.checkIn && (
                                <TableCell className="py-2 px-3 text-center">
                                  {r.checkIn ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium">{r.checkIn}</span>
                                        <Edit className="h-3 w-3 text-muted-foreground" />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {r.checkInSource && (
                                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                            {r.checkInSource === "device" ? "Cihaz" : r.checkInSource === "mobile" ? "Mobil" : r.checkInSource === "manual" ? "Manuel" : "Web"}
                                          </Badge>
                                        )}
                                        {r.checkInNote && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <StickyNote className="h-3 w-3 text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="max-w-xs">{r.checkInNote}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
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
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium">{r.checkOut}</span>
                                        <Edit className="h-3 w-3 text-muted-foreground" />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {r.checkOutSource && (
                                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                            {r.checkOutSource === "device" ? "Cihaz" : r.checkOutSource === "mobile" ? "Mobil" : r.checkOutSource === "manual" ? "Manuel" : "Web"}
                                          </Badge>
                                        )}
                                        {r.checkOutNote && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <StickyNote className="h-3 w-3 text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="max-w-xs">{r.checkOutNote}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
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
                              <TableCell className="py-2 px-3 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7">
                                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {setEditingRow(r); setEditModalOpen(true)}}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Düzenle
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                      Geçişi Sil
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="weekly-person" className="m-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 p-4 bg-muted/20 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="font-medium shadow-sm" onClick={() => setSelectedDate(addDaysISO(weekDays[0], -7))}>
                          <ChevronLeft className="h-4 w-4" /> Önceki Hafta
                        </Button>
                        <Button variant="outline" size="sm" className="font-medium shadow-sm" onClick={() => setSelectedDate(addDaysISO(weekDays[0], 7))}>
                          Sonraki Hafta <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="shadow-sm w-auto" />
                        <div className="text-sm text-muted-foreground font-medium">
                          {weeklyData.length} personel
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary hover:bg-primary border-primary">
                            <TableHead className="text-primary-foreground font-semibold py-2 px-3 text-xs">Personel</TableHead>
                            {weekDays.map((d, i) => (
                              <TableHead key={d} className="text-primary-foreground font-semibold py-2 px-3 text-center min-w-[120px] text-[10px]">
                                {WEEKDAY_TR[new Date(d).getDay()]}
                                <div className="text-[10px] font-medium mt-1 opacity-80">{d.split("-").reverse().join(".")}</div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {weeklyData.map((personWeek) => (
                            <TableRow key={personWeek.employee.id} className="hover:bg-muted/40 border-b border-border/50 text-sm">
                              <TableCell className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                   <Avatar className="h-9 w-9">
                                    <AvatarImage src={personWeek.employee.image || undefined} alt={personWeek.employee.name} />
                                     <AvatarFallback className="font-semibold bg-secondary text-secondary-foreground text-xs">
                                      {personWeek.employee.name?.[0]?.toUpperCase() || personWeek.employee.email?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                     <div className="font-medium text-xs">{personWeek.employee.name}</div>
                                     <div className="text-xs text-muted-foreground">{personWeek.employee.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              {personWeek.cells.map((r, dayIdx) => (
                                 <TableCell key={dayIdx} className="align-top py-2 px-2">
                                  {r && r.shift ? (
                                     <div className="space-y-1 p-1.5 bg-muted/30 rounded border border-border/50">
                                      <div className="text-xs font-medium text-center">
                                        {r.shift.start}-{r.shift.end}
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-center gap-1">
                                          <span className="text-xs font-medium">{r.checkIn || "-"}</span>
                                          {r.checkIn && (
                                            computeMetrics(r).checkInStatus === "late" ? (
                                              <div className="w-2 h-2 bg-destructive rounded-full"></div>
                                            ) : computeMetrics(r).checkInStatus === "early" ? (
                                              <div className="w-2 h-2 bg-secondary rounded-full"></div>
                                            ) : (
                                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                                            )
                                          )}
                                          {r.checkInSource && (
                                            <span className="text-[10px] text-muted-foreground ml-1">{r.checkInSource === "device" ? "Cihaz" : r.checkInSource === "mobile" ? "Mobil" : r.checkInSource === "manual" ? "Manuel" : "Web"}</span>
                                          )}
                                          {r.checkInNote && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger>
                                                  <StickyNote className="h-3 w-3 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p className="max-w-xs">{r.checkInNote}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                        <div className="flex items-center justify-center gap-1">
                                          <span className="text-xs font-medium">{r.checkOut || "-"}</span>
                                          {r.checkOut && (
                                            computeMetrics(r).checkOutStatus === "early" ? (
                                              <div className="w-2 h-2 bg-destructive rounded-full"></div>
                                            ) : computeMetrics(r).checkOutStatus === "overtime" ? (
                                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                                            ) : (
                                              <div className="w-2 h-2 bg-secondary rounded-full"></div>
                                            )
                                          )}
                                          {r.checkOutSource && (
                                            <span className="text-[10px] text-muted-foreground ml-1">{r.checkOutSource === "device" ? "Cihaz" : r.checkOutSource === "mobile" ? "Mobil" : r.checkOutSource === "manual" ? "Manuel" : "Web"}</span>
                                          )}
                                          {r.checkOutNote && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger>
                                                  <StickyNote className="h-3 w-3 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p className="max-w-xs">{r.checkOutNote}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-center gap-2 pt-1 border-t border-border/40 mt-1">
                                        <span className="text-[10px] text-muted-foreground">Çalışma:</span>
                                        <span className="text-[11px] font-medium">{formatMinutesToHHMM(computeMetrics(r).totalMinutes)}</span>
                                        {(() => {
                                          const diff = computeMetrics(r).diffMinutes ?? null;
                                          if (diff == null || diff === 0) return null;
                                          const isOver = diff > 0;
                                          const label = `${isOver ? "+" : "-"}${formatMinutesToHHMM(Math.abs(diff))}`;
                                          return <span className={isOver ? "text-[10px] text-primary" : "text-[10px] text-destructive"}>{label}</span>;
                                        })()}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground text-xs p-2 text-center">-</div>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Filter Drawer moved to body */}
          <Drawer open={filterOpen} onOpenChange={setFilterOpen} direction="left">
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filtreler</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 space-y-4">
                {viewMode === "daily" ? (
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
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium">Hafta (bir gün seçin)</label>
                      <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Giriş/Çıkış Durumu</label>
                  <ToggleGroup type="single" value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as any)} className="shadow-sm !w-full" variant="outline" size="sm">
                    <ToggleGroupItem value="all">Tümü</ToggleGroupItem>
                    <ToggleGroupItem value="late_in">Geç Girişler</ToggleGroupItem>
                    <ToggleGroupItem value="late_out">Geç Çıkışlar</ToggleGroupItem>
                    <ToggleGroupItem value="anomalies">Anormal</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Personel</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-10 overflow-hidden">
                        {selectedEmployeeIds.length === 0 ? (
                          <span className="text-muted-foreground">Tümü</span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
                            {selectedEmployeeIds.slice(0, 3).map((id) => {
                              const emp = employees.find((e) => e.id === id);
                              return (
                                <Badge key={id} variant="secondary" className="text-[10px] font-medium shrink-0">
                                  <span className="truncate max-w-[120px]">{emp?.name || emp?.email || "-"}</span>
                                </Badge>
                              );
                            })}
                            {selectedEmployeeIds.length > 3 && (
                              <Badge variant="secondary" className="text-[10px] font-medium shrink-0">+{selectedEmployeeIds.length - 3}</Badge>
                            )}
                          </div>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-0 w-[360px] max-w-[calc(100vw-2rem)]">
                      <div className="flex items-center justify-between px-3 py-2 border-b">
                        <div className="text-xs text-muted-foreground">{selectedEmployeeIds.length > 0 ? `${selectedEmployeeIds.length} seçili` : "Tümü seçili"}</div>
                        {selectedEmployeeIds.length > 0 && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedEmployeeIds([])}>
                            Temizle
                          </Button>
                        )}
                      </div>
                      {selectedEmployeeIds.length > 0 && (
                        <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b">
                          {selectedEmployeeIds.map((id) => {
                            const emp = employees.find((e) => e.id === id);
                            return (
                              <Badge key={id} variant="secondary" className="text-[10px] font-medium pr-1.5">
                                <span className="truncate max-w-[140px]">{emp?.name || emp?.email || "-"}</span>
                                <button
                                  type="button"
                                  className="ml-1 rounded hover:bg-secondary/60 p-0.5"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedEmployeeIds((prev) => prev.filter((x) => x !== id));
                                  }}
                                  aria-label="Kaldır"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <Command>
                        <CommandInput placeholder="Personel ara..." />
                        <CommandList>
                          <CommandEmpty>Sonuç yok</CommandEmpty>
                          <CommandGroup>
                            {employees.map((emp) => {
                              const checked = selectedEmployeeIds.includes(emp.id);
                              return (
                                <CommandItem
                                  key={emp.id}
                                  value={emp.name || emp.email}
                                  onSelect={() => setSelectedEmployeeIds((prev) => checked ? prev.filter((x) => x !== emp.id) : [...prev, emp.id])}
                                >
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarImage src={emp.image || undefined} alt={emp.name} />
                                    <AvatarFallback>{emp.name?.[0]?.toUpperCase() || emp.email?.[0]?.toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="flex-1 truncate">{emp.name}</span>
                                  {checked && <Check className="h-4 w-4" />}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DrawerFooter>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => { 
                    setSelectedEmployeeIds([]);
                    const today = startOfDayISO(new Date());
                    const weekAgo = startOfDayISO(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                    setStartDate(weekAgo);
                    setEndDate(today);
                    setSelectedDate(today);
                    setStatusFilter("all");
                  }}>Filtreyi Sıfırla</Button>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          {/* Edit Modal */}
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Kayıt düzenle</DialogTitle>
                <DialogDescription>Giriş-çıkış kayıtlarını ve notları güncelleyebilirsiniz.</DialogDescription>
              </DialogHeader>
              {editingRow && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Giriş Saati</label>
                    <Input 
                      type="time" 
                      value={editCheckIn}
                      onChange={(e) => setEditCheckIn(e.target.value)} 
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Çıkış Saati</label>
                    <Input 
                      type="time" 
                      value={editCheckOut}
                      onChange={(e) => setEditCheckOut(e.target.value)} 
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Giriş Notu</label>
                    <Textarea 
                      placeholder="Örn. Gecikme nedeni, manuel giriş vb." 
                      rows={3} 
                      value={editCheckInNote}
                      onChange={(e) => setEditCheckInNote(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Çıkış Notu</label>
                    <Textarea 
                      placeholder="Örn. erken çıkış nedeni vb." 
                      rows={3}
                      value={editCheckOutNote}
                      onChange={(e) => setEditCheckOutNote(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>İptal</Button>
                <Button onClick={() => {
                  if (!editingRow) { setEditModalOpen(false); return; }
                  const key = `${editingRow.employee.id}-${editingRow.date}`;
                  setOverrides(prev => ({
                    ...prev,
                    [key]: {
                      ...prev[key],
                      checkIn: editCheckIn || null,
                      checkOut: editCheckOut || null,
                      checkInNote: editCheckInNote || null,
                      checkOutNote: editCheckOutNote || null,
                    }
                  }));
                  setEditModalOpen(false);
                }}>Kaydet</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageWrapper>
    </RoleGuard>
  );
}

