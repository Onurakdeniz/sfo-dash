"use client";

import { useMemo, useState } from "react";
import pdfMake from "pdfmake/build/pdfmake";
import { vfs as pdfMakeVfs } from "pdfmake/build/vfs_fonts";
// Use dynamic import for exceljs to avoid any bundler/runtime issues in the browser
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { PageWrapper } from "@/components/page-wrapper";
import { RoleGuard } from "@/components/layouts/role-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Filter, Columns, Download, CheckSquare, CalendarDays, FileSpreadsheet, X } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerTrigger } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface WorkspaceContextData {
  workspace: { id: string; name: string; slug: string } | null;
  currentCompany?: { id: string; name: string } | null;
}

type EmployeeRow = {
    id: string;
    name: string;
    email: string;
  image?: string | null;
  role: string;
  profile: {
    position?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    departmentId?: string | null;
    managerId?: string | null;
  } | null;
  department: { id: string; name: string } | null;
};

function formatTenure(start?: string | null, end?: string | null) {
  if (!start) return "-";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  if (Number.isNaN(startDate.getTime())) return "-";

  let years = endDate.getFullYear() - startDate.getFullYear();
  let months = endDate.getMonth() - startDate.getMonth();
  let days = endDate.getDate() - startDate.getDate();

  if (days < 0) {
    const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
    days += prevMonth.getDate();
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yıl`);
  if (months > 0) parts.push(`${months} ay`);
  if (days > 0 || parts.length === 0) parts.push(`${days} gün`);
  return parts.join(", ");
}

function EmployeesListContent() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const companySlug = params.companySlug as string;

  const [pageSize, setPageSize] = useState(10);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<EmployeeRow[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const [startFrom, setStartFrom] = useState<string>("");
  const [startTo, setStartTo] = useState<string>("");
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    position: true,
    company: true,
    department: true,
    tenure: true,
    status: true,
    manager: false,
  });

  // Department filter search
  const [departmentQuery, setDepartmentQuery] = useState("");

  const { data: contextData, isLoading: contextLoading } = useQuery<WorkspaceContextData>({
    queryKey: ["workspace-context", workspaceSlug, companySlug],
    queryFn: async () => {
      const res = await fetch(`/api/workspace-context/${workspaceSlug}/${companySlug}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workspace context");
      return res.json();
    },
    enabled: !!(workspaceSlug && companySlug)
  });

  const workspaceId = contextData?.workspace?.id as string | undefined;
  const companyId = contextData?.currentCompany?.id as string | undefined;

  const { data: employees = [], isLoading: employeesLoading, refetch: refetchEmployees } = useQuery<EmployeeRow[]>({
    queryKey: ["company-employees", workspaceId, companyId],
    queryFn: async () => {
      if (!workspaceId || !companyId) return [] as EmployeeRow[];
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/employees`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
    enabled: !!(workspaceId && companyId)
  });

  // Workspace members to resolve manager names
  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as any[];
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!workspaceId,
  });
  const managerNameById = useMemo(() => {
    const map = new Map<string, string>();
    (members as any[]).forEach((m) => map.set(m.userId, m.user?.name || m.userId));
    return map;
  }, [members]);

  // Assign to company modal state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState<string>("");
  const [assignPosition, setAssignPosition] = useState<string>("");
  const [assignDepartmentId, setAssignDepartmentId] = useState<string>("");
  const [assignStartDate, setAssignStartDate] = useState<string>("");
  const [assignSaving, setAssignSaving] = useState(false);

  // Users that can be assigned to this company (workspace members without a profile here)
  const assignableUsers = useMemo(() => {
    const existingIds = new Set((employees || []).map((e) => e.id));
    return (members as any[])
      .filter((m) => m.user && !existingIds.has(m.user.id))
      .map((m) => ({ id: m.user.id as string, name: (m.user.name as string) || m.user.email, email: m.user.email as string }));
  }, [members, employees]);

  async function handleAssignSubmit() {
    if (!workspaceId || !companyId || !assignUserId) return;
    try {
      setAssignSaving(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/employees/${assignUserId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: assignPosition || null,
          departmentId: assignDepartmentId || null,
          startDate: assignStartDate || null,
        }),
      });
      if (!res.ok) throw new Error("Assign failed");
      // Refresh list and close
      await refetchEmployees();
      setAssignOpen(false);
      setAssignUserId("");
      setAssignPosition("");
      setAssignDepartmentId("");
      setAssignStartDate("");
    } catch (err) {
      console.error("Assign to company failed", err);
      alert("Atama başarısız. Lütfen tekrar deneyin.");
    } finally {
      setAssignSaving(false);
    }
  }

  // Departments for filter options
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["company-departments", workspaceId, companyId],
    queryFn: async () => {
      if (!workspaceId || !companyId) return [] as any[];
      const res = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/departments`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!(workspaceId && companyId)
  });

  // Active filters calculation (exclude start date fields from count as requested)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedDepartments.length > 0) count += selectedDepartments.length;
    if (selectedRole !== "all") count += 1;
    if (status !== "all") count += 1;
    if (firstName.trim()) count += 1;
    if (lastName.trim()) count += 1;
    if (email.trim()) count += 1;
    if (employeeNo.trim()) count += 1;
    return count;
  }, [selectedDepartments.length, selectedRole, status, firstName, lastName, email, employeeNo]);
  const areFiltersActive = activeFiltersCount > 0;

  const isLoading = contextLoading || employeesLoading;

  const companyName = contextData?.currentCompany?.name || "";

  // Stats (computed from full employee list)
  const totalEmployees = employees.length;
  const activeEmployees = useMemo(() => {
    return employees.filter((row) => !row.profile?.endDate || new Date(row.profile.endDate) > new Date()).length;
  }, [employees]);
  // İzinli (on leave) data is not yet modeled – expose as 0 for now
  const onLeaveEmployees = 0;

  // Apply filters in-memory
  const data = useMemo(() => {
    const text = search.trim().toLowerCase();
    return employees.filter((row) => {
      if (text) {
        const hay = `${row.name || ""} ${row.email || ""} ${row.profile?.position || ""}`.toLowerCase();
        if (!hay.includes(text)) return false;
      }
      if (firstName && !String(row.name || "").toLowerCase().includes(firstName.toLowerCase())) return false;
      if (lastName && !String(row.name || "").toLowerCase().includes(lastName.toLowerCase())) return false;
      if (email && !String(row.email || "").toLowerCase().includes(email.toLowerCase())) return false;
      if (selectedDepartments.length > 0) {
        if (!row.department || !selectedDepartments.includes(row.department.id)) return false;
      }
      if (selectedRole !== "all" && row.role !== selectedRole) return false;
      if (status !== "all") {
        const isActive = !row.profile?.endDate || new Date(row.profile.endDate) > new Date();
        if (status === "active" && !isActive) return false;
        if (status === "inactive" && isActive) return false;
      }
      if (startFrom) {
        const sd = row.profile?.startDate ? new Date(row.profile.startDate) : null;
        if (!sd || sd < new Date(startFrom)) return false;
      }
      if (startTo) {
        const sd = row.profile?.startDate ? new Date(row.profile.startDate) : null;
        if (!sd || sd > new Date(startTo)) return false;
      }
      return true;
    });
  }, [employees, search, selectedDepartments, selectedRole, status, startFrom, startTo]);

  // Export CSV of current filtered rows
  function exportCSV() {
    const cols = [
      ["name", "Personel"],
      ["position", "Unvan"],
      ["company", "Şirket"],
      ["department", "Departman"],
      ["manager", "Yönetici"],
      ["tenure", "Çalışma Süresi"],
      ["status", "Durum"],
    ] as const;

    const header = cols.filter(([key]) => visibleColumns[key]).map(([, label]) => label);
    const rows = data.map((r) => {
      const values: Record<string, string> = {
        name: r.name,
        position: r.profile?.position || "-",
        company: companyName,
        department: r.department?.name || "-",
        manager: r.profile?.managerId ? (managerNameById.get(r.profile.managerId as any) || r.profile.managerId || "-") : "-",
        tenure: formatTenure(r.profile?.startDate as any, r.profile?.endDate as any),
        status: !r.profile?.endDate || new Date(r.profile.endDate) > new Date() ? "Aktif" : "Pasif",
      };
      return cols.filter(([key]) => visibleColumns[key]).map(([key]) => values[key]);
    });
    const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personeller.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export PDF for given rows (falls back to current filtered rows) with company header and clean layout (pdfmake to support Turkish chars)
  function exportPDF(rows?: EmployeeRow[]) {
    const sourceRows = rows && rows.length > 0 ? rows : data;
    (pdfMake as any).vfs = (pdfMakeVfs as any);

    // Helpers
    const formatDate = (iso?: string | null) => {
      if (!iso) return "-";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const deptNames = (departments || [])
      .filter((d: any) => selectedDepartments.includes(d.id))
      .map((d: any) => d.name);
    const filtersSummary = [
      `Departman: ${deptNames.length > 0 ? deptNames.join(", ") : "Tümü"}`,
      `Rol: ${selectedRole === "all" ? "Tümü" : selectedRole}`,
      `Durum: ${status === "all" ? "Tümü" : status === "active" ? "Aktif" : "Pasif"}`,
    ].filter(Boolean).join("  |  ");

    // Include all details and fit into A3 landscape by tightening widths and font size
    const pdfColumns: { label: string; get: (r: EmployeeRow) => string; width?: number }[] = [
      { label: "Ad", get: (r) => (r.name || "-").split(" ")[0] || "-", width: 50 },
      { label: "Soyad", get: (r) => { const parts = (r.name || "-").trim().split(/\s+/); return parts.length > 1 ? parts.slice(1).join(" ") : "-"; }, width: 70 },
      { label: "E-Posta Adresi", get: (r) => r.email || "-", width: 120 },
      { label: "Telefon Numarası", get: (_r) => "-", width: 80 },
      { label: "Yönetici", get: (r) => r.profile?.managerId ? (managerNameById.get(r.profile.managerId as any) || (r.profile.managerId as any)) : "-", width: 85 },
      { label: "Durum", get: (r) => (!r.profile?.endDate || new Date(r.profile.endDate) > new Date()) ? "Aktif" : "Pasif", width: 55 },
      { label: "Departman", get: (r) => r.department?.name || "-", width: 80 },
      { label: "Şirket", get: (_r) => companyName || "-", width: 75 },
      { label: "İşe Başlangıç", get: (r) => formatDate(r.profile?.startDate as any), width: 75 },
      { label: "Sicil No", get: (_r) => "-", width: 60 },
    ];

    const widths = pdfColumns.map((c) => c.width || '*');
    const headerRow = pdfColumns.map((c) => ({ text: c.label, style: 'tableHeader', alignment: 'center' as const }));
    const bodyRows = sourceRows.map((r) => pdfColumns.map((c) => ({ text: c.get(r) || '-', alignment: 'left' as const })));

    const docDefinition: any = {
      pageSize: 'A3',
      pageOrientation: 'landscape',
      pageMargins: [20, 80, 20, 30],
      defaultStyle: { font: 'Roboto', fontSize: 6.6, lineHeight: 1.15 },
      header: (currentPage: number, pageCount: number) => ({
        margin: [20, 18, 20, 0],
        stack: [
          { text: companyName || 'Şirket', style: 'title' },
          { text: 'Personel Listesi', style: 'subtitle', margin: [0, 2, 0, 0] },
          {
            columns: [
              { text: filtersSummary, style: 'filters', width: '*', margin: [0, 6, 0, 0] },
              {
                width: 220,
                alignment: 'right',
                stack: [
                  { text: `Çalışma Alanı: ${contextData?.workspace?.name || '-'}`, style: 'meta' },
                  { text: `Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`, style: 'meta' },
                  { text: `Kayıt Sayısı: ${sourceRows.length}`, style: 'meta' },
                ]
              }
            ]
          },
          { canvas: [ { type: 'line', x1: 0, y1: 8, x2: 1100, y2: 8, lineWidth: 1, lineColor: '#e0e0e0' } ], margin: [0, 4, 0, 0] },
        ],
      }),
      footer: (currentPage: number, pageCount: number) => ({
        margin: [20, 0, 20, 10],
        columns: [
          { text: '', width: '*' },
          { text: `Sayfa ${currentPage} / ${pageCount}`, alignment: 'right', style: 'meta' }
        ]
      }),
      content: [
        {
          table: {
            headerRows: 1,
            widths,
            body: [headerRow, ...bodyRows],
          },
          layout: {
            fillColor: (rowIndex: number, _node: any, _columnIndex: number) => rowIndex === 0 ? '#f2f2f2' : (rowIndex % 2 === 0 ? '#fafafa' : null),
            hLineColor: '#d0d0d0',
            vLineColor: '#d0d0d0',
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 7, // slightly compact but readable
            paddingBottom: () => 7,
          }
        }
      ],
      styles: {
        title: { fontSize: 14, bold: true },
        subtitle: { fontSize: 10 },
        filters: { fontSize: 8, color: '#444' },
        meta: { fontSize: 8, color: '#444' },
        tableHeader: { bold: true }
      }
    };

    (pdfMake as any).createPdf(docDefinition).download(rows && rows.length > 0 ? 'secilen-personeller.pdf' : 'personeller.pdf');
  }

  // Export Excel with styling (smaller fonts, header fill, borders, zebra stripes, merged title/filters, frozen header)
  async function exportExcel(rows?: EmployeeRow[]) {
    try {
      let ExcelJSImport: any;
      try {
        ExcelJSImport = await import("exceljs");
      } catch (_e) {
        ExcelJSImport = await import("exceljs/dist/exceljs.min.js");
      }
      const WorkbookCtor = (ExcelJSImport as any).Workbook || (ExcelJSImport as any).default?.Workbook;
      if (!WorkbookCtor) {
        throw new Error("ExcelJS Workbook constructor not found");
      }
    const sourceRows = rows && rows.length > 0 ? rows : data;

    const formatDate = (iso?: string | null) => {
      if (!iso) return "-";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const deptNames = (departments || [])
      .filter((d: any) => selectedDepartments.includes(d.id))
      .map((d: any) => d.name);
    const filtersSummary = [
      `Departman: ${deptNames.length > 0 ? deptNames.join(", ") : "Tümü"}`,
      `Rol: ${selectedRole === "all" ? "Tümü" : selectedRole}`,
      `Durum: ${status === "all" ? "Tümü" : status === "active" ? "Aktif" : "Pasif"}`,
    ].filter(Boolean).join("  |  ");

    const columns: { label: string; get: (r: EmployeeRow) => string }[] = [
      { label: "Ad", get: (r) => (r.name || "-").split(" ")[0] || "-" },
      { label: "Soyad", get: (r) => { const parts = (r.name || "-").trim().split(/\s+/); return parts.length > 1 ? parts.slice(1).join(" ") : "-"; } },
      { label: "E-Posta Adresi", get: (r) => r.email || "-" },
      { label: "Telefon Numarası", get: (_r) => "-" },
      { label: "Yönetici", get: (r) => r.profile?.managerId ? (managerNameById.get(r.profile.managerId as any) || (r.profile.managerId as any)) : "-" },
      { label: "Durum", get: (r) => (!r.profile?.endDate || new Date(r.profile.endDate) > new Date()) ? "Aktif" : "Pasif" },
      { label: "Departman", get: (r) => r.department?.name || "-" },
      { label: "Şirket", get: (_r) => companyName || "-" },
      { label: "İşe Başlangıç", get: (r) => formatDate(r.profile?.startDate as any) },
      { label: "Sicil No", get: (_r) => "-" },
    ];

    const workbook = new WorkbookCtor();
    const worksheet = workbook.addWorksheet("Personeller", {
      views: [{ state: "frozen", ySplit: 3 }],
      properties: { defaultRowHeight: 16 },
    });

    // Column widths (autosize-ish)
    const headerLabels = columns.map((c) => c.label);
    const dataRows = sourceRows.map((r) => columns.map((c) => c.get(r)));
    const allRows = [headerLabels, ...dataRows];
    const colWidths = headerLabels.map((_, colIdx) => {
      const maxLen = Math.max(
        ...allRows.map((row) => String(row[colIdx] ?? "").length),
        12
      );
      return Math.min(50, Math.max(12, maxLen + 2));
    });
    worksheet.columns = headerLabels.map((label, i) => ({ header: label, key: `c${i}`, width: colWidths[i] }));

    // Title and filter rows (merged)
    const title = `${companyName || "Şirket"} - Personel Listesi  |  Kayıt Sayısı: ${sourceRows.length}  |  Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    worksheet.mergeCells(1, 1, 1, headerLabels.length);
    worksheet.getCell(1, 1).value = title;
    worksheet.getCell(1, 1).font = { size: 12, bold: true };
    worksheet.getCell(1, 1).alignment = { vertical: "middle" };
    worksheet.getRow(1).height = 18;

    worksheet.mergeCells(2, 1, 2, headerLabels.length);
    worksheet.getCell(2, 1).value = filtersSummary;
    worksheet.getCell(2, 1).font = { size: 9, color: { argb: "FF666666" } };
    worksheet.getCell(2, 1).alignment = { wrapText: true };
    worksheet.getRow(2).height = 18;

    // Header row (row 3)
    const headerRow = worksheet.getRow(3);
    headerLabels.forEach((label, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = label;
      cell.font = { bold: true, size: 10 };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD0D0D0" } },
        left: { style: "thin", color: { argb: "FFD0D0D0" } },
        bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
        right: { style: "thin", color: { argb: "FFD0D0D0" } },
      };
    });
    headerRow.height = 20;

    // Data rows start at row 4
    dataRows.forEach((rowValues, rowIdx) => {
      const row = worksheet.getRow(4 + rowIdx);
      rowValues.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { size: 9 };
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0E0E0" } },
          left: { style: "thin", color: { argb: "FFE0E0E0" } },
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          right: { style: "thin", color: { argb: "FFE0E0E0" } },
        };
        // Zebra stripes
        if (rowIdx % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
        }
      });
      row.height = 18;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = rows && rows.length > 0 ? "secilen-personeller.xlsx" : "personeller.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      console.error("Excel export failed", err);
      alert("Excel dışa aktarım sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  async function handleBulkDelete() {
    if (selectedRows.length === 0) return;
    const ok = window.confirm("Seçilen personelleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.");
    if (!ok) return;

    if (!workspaceId) return;

    await Promise.allSettled(
      selectedRows.map(async (row) => {
        const res = await fetch(`/api/workspaces/${workspaceId}/members?userId=${encodeURIComponent(row.id)}` as any, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Silinemedi");
      })
    );

    setSelectedRows([]);
    await refetchEmployees();
  }

  return (
    <PageWrapper title="Personeller" description="Bu sayfada yeni çalışanlar ekleyebilir, çalışan bilgilerini güncelleyebilir ve tüm detaylara ulaşabilirsiniz.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <CardTitle className="text-xs sm:text-sm">Toplam Personel</CardTitle>
                </div>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-16" /> : totalEmployees}</div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CheckSquare className="h-4 w-4" />
                  <CardTitle className="text-xs sm:text-sm">Aktif Personel</CardTitle>
                </div>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-16" /> : activeEmployees}</div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <CardTitle className="text-xs sm:text-sm">İzinli Personel</CardTitle>
                </div>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-16" /> : onLeaveEmployees}</div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <Drawer open={filterOpen} onOpenChange={setFilterOpen} direction="left">
                <DrawerTrigger asChild>
                  <Button variant={areFiltersActive ? "default" : "outline"} size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {areFiltersActive ? `Filtrele (${activeFiltersCount})` : "Filtrele"}
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Filtreler</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ad</Label>
                        <Input placeholder="Ad" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Soyad</Label>
                        <Input placeholder="Soyad" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>E-Posta Adresi</Label>
                        <Input placeholder="ornek@firma.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Sicil No</Label>
                        <Input placeholder="Sicil No" value={employeeNo} onChange={(e) => setEmployeeNo(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Departman</Label>
                      <div className="space-y-2">
                        <Input
                          placeholder="Departman ara..."
                          value={departmentQuery}
                          onChange={(e) => setDepartmentQuery(e.target.value)}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-auto p-1 rounded-md border">
                          {(departments as any[])
                            .filter((d: any) => d.name.toLowerCase().includes(departmentQuery.toLowerCase()))
                            .map((d: any) => (
                              <label key={d.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={selectedDepartments.includes(d.id)}
                                  onCheckedChange={(c) =>
                                    setSelectedDepartments((prev) => (c ? [...prev, d.id] : prev.filter((x) => x !== d.id)))
                                  }
                                />
                                {d.name}
                              </label>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="space-y-2 flex-1">
                        <Label>Rol</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tümü" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            <SelectItem value="owner">Sahip</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Üye</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label>Durum</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tümü" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Pasif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DrawerFooter>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => { setSearch(""); setFirstName(""); setLastName(""); setEmail(""); setEmployeeNo(""); setSelectedDepartments([]); setSelectedRole("all"); setStatus("all"); setStartFrom(""); setStartTo(""); }}>Filtreyi Sıfırla</Button>
                    </div>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              {/* Active Filter Chips */}
              {areFiltersActive && (
                <div className="flex flex-wrap items-center gap-1">
                  {(() => {
                    const allFilters: { type: string; label: string; value?: string }[] = [];
                    
                    // Helper function to truncate text (much shorter)
                    const truncateText = (text: string, maxLength: number = 6) => {
                      if (text.length <= maxLength) return text;
                      return text.slice(0, maxLength) + '..';
                    };
                    
                    // Collect all active filters (ultra-compact labels)
                    selectedDepartments.forEach((deptId) => {
                      const dept = departments.find((d: any) => d.id === deptId);
                      const deptName = dept?.name || deptId;
                      allFilters.push({ type: 'department', label: truncateText(deptName, 8), value: deptId });
                    });
                    
                    if (selectedRole !== "all") {
                      const roleLabel = selectedRole === "owner" ? "Sahip" : selectedRole === "admin" ? "Admin" : "Üye";
                      allFilters.push({ type: 'role', label: roleLabel, value: selectedRole });
                    }
                    
                    if (status !== "all") {
                      allFilters.push({ type: 'status', label: status === "active" ? "Aktif" : "Pasif", value: status });
                    }
                    
                    if (firstName.trim()) {
                      allFilters.push({ type: 'firstName', label: truncateText(firstName, 6) });
                    }
                    
                    if (lastName.trim()) {
                      allFilters.push({ type: 'lastName', label: truncateText(lastName, 6) });
                    }
                    
                    if (email.trim()) {
                      allFilters.push({ type: 'email', label: truncateText(email, 6) });
                    }
                    
                    if (employeeNo.trim()) {
                      allFilters.push({ type: 'employeeNo', label: truncateText(employeeNo, 6) });
                    }

                    // Show only first 3 filters
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
                                if (filter.type === 'department' && filter.value) {
                                  setSelectedDepartments((prev) => prev.filter((x) => x !== filter.value));
                                } else if (filter.type === 'role') {
                                  setSelectedRole('all');
                                } else if (filter.type === 'status') {
                                  setStatus('all');
                                } else if (filter.type === 'firstName') {
                                  setFirstName('');
                                } else if (filter.type === 'lastName') {
                                  setLastName('');
                                } else if (filter.type === 'email') {
                                  setEmail('');
                                } else if (filter.type === 'employeeNo') {
                                  setEmployeeNo('');
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
                      setSearch("");
                      setFirstName("");
                      setLastName("");
                      setEmail("");
                      setEmployeeNo("");
                      setSelectedDepartments([]);
                      setSelectedRole("all");
                      setStatus("all");
                      setStartFrom("");
                      setStartTo("");
                    }}
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              )}

              <Button variant="outline" size="sm" onClick={() => setSelectMode((v) => !v)}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Seç
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Toplu İşlemler</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem disabled={selectedRows.length === 0} onClick={handleBulkDelete}>Seçilenleri Sil</DropdownMenuItem>
                  <DropdownMenuItem disabled={selectedRows.length === 0} onClick={() => exportPDF(selectedRows)}>Seçilenleri PDF olarak aktar</DropdownMenuItem>
                  <DropdownMenuItem disabled={selectedRows.length === 0} onClick={() => exportExcel(selectedRows)}>Seçilenleri Excel olarak aktar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" onClick={() => router.push(`/${workspaceSlug}/${companySlug}/users`)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ekle
                </Button>

                <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)} disabled={!workspaceId || !companyId}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Şirkete Ata
                </Button>

                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger size="sm" className="min-w-[140px]">
                    <SelectValue placeholder="Satır Sayısı" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Satır Sayısı: 10</SelectItem>
                    <SelectItem value="25">Satır Sayısı: 25</SelectItem>
                    <SelectItem value="50">Satır Sayısı: 50</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Columns className="h-4 w-4 mr-2" />
                      Sütun Seç
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[220px]">
                    {[
                      { key: "name", label: "Personel" },
                      { key: "position", label: "Unvan" },
                      { key: "company", label: "Şirket" },
                      { key: "department", label: "Departman" },
                      { key: "manager", label: "Yönetici" },
                      { key: "tenure", label: "Çalışma Süresi" },
                      { key: "status", label: "Durum" },
                    ].map((c) => (
                      <DropdownMenuCheckboxItem
                        key={c.key}
                        checked={!!visibleColumns[c.key]}
                        onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, [c.key]: !!checked }))}
                      >
                        {c.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" onClick={() => exportExcel()}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel Dışa Aktar
                </Button>

                <Button variant="outline" size="sm" onClick={() => exportPDF()}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF Dışa Aktar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Şirkete Personel Ata</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="space-y-1">
                    <Label>Kullanıcı</Label>
                    <Select value={assignUserId} onValueChange={setAssignUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder={assignableUsers.length > 0 ? "Kullanıcı seçin" : "Atanabilir kullanıcı yok"} />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Pozisyon</Label>
                    <Input placeholder="Örn: Satış Uzmanı" value={assignPosition} onChange={(e) => setAssignPosition(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Departman</Label>
                    <Select value={assignDepartmentId} onValueChange={setAssignDepartmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Departman seçin (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {(departments as any[]).map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>İşe Başlangıç</Label>
                    <Input type="date" value={assignStartDate} onChange={(e) => setAssignStartDate(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setAssignOpen(false)}>İptal</Button>
                  <Button onClick={handleAssignSubmit} disabled={!assignUserId || assignSaving}>
                    {assignSaving ? "Kaydediliyor..." : "Ata"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <DataTable<EmployeeRow>
                data={data}
                columns={[
                  visibleColumns.name && {
                    key: "name",
                    header: "Personel",
                    sortable: true,
                    render: (_v: unknown, row: EmployeeRow) => (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={row.image || undefined} alt={row.name} />
                          <AvatarFallback>{row.name?.[0]?.toUpperCase() || row.email?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-xs">{row.name}</div>
                          <div className="text-xs text-muted-foreground">{row.email}</div>
                        </div>
                      </div>
                    ),
                  },
                  visibleColumns.position && {
                    key: "profile.position",
                    header: "Unvan",
                    render: (_v: unknown, row: EmployeeRow) => row.profile?.position || "-",
                  },
                  visibleColumns.company && {
                    key: "company",
                    header: "Şirket",
                    render: () => companyName,
                  },
                  visibleColumns.department && {
                    key: "department",
                    header: "Departman",
                    render: (_v: unknown, row: EmployeeRow) => row.department?.name || "-",
                  },
                  visibleColumns.manager && {
                    key: "profile.managerId",
                    header: "Yönetici",
                    render: (_v: unknown, row: EmployeeRow) => (row.profile?.managerId ? (managerNameById.get(row.profile.managerId as any) || row.profile.managerId) : "-"),
                  },
                  
                  visibleColumns.tenure && {
                    key: "profile.startDate",
                    header: "Çalışma Süresi",
                    render: (_v: unknown, row: EmployeeRow) => formatTenure(row.profile?.startDate as any, row.profile?.endDate as any),
                  },
                  visibleColumns.status && {
                    key: "status",
                    header: "Durum",
                    render: (_v: unknown, row: EmployeeRow) => {
                      const isActive = !row.profile?.endDate || new Date(row.profile.endDate) > new Date();
                      return <Badge variant={isActive ? "secondary" : "outline"} className="text-xs">{isActive ? "Aktif" : "Pasif"}</Badge>;
                    },
                  },
                ].filter(Boolean) as any}
                searchable={false}
                selectable={selectMode}
                pagination
                pageSize={pageSize}
                onRowClick={selectMode ? undefined : (row) => router.push(`/${workspaceSlug}/${companySlug}/hr/employees/${row.id}`)}
                onSelectionChange={setSelectedRows}
                className="text-sm [&_th]:text-xs"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

export default function EmployeesListPage() {
  return (
    <RoleGuard requiredRoles={["owner", "admin", "member"]} fallbackMessage="Personel yönetimine erişmek için yetki gereklidir.">
      <EmployeesListContent />
    </RoleGuard>
  );
}


