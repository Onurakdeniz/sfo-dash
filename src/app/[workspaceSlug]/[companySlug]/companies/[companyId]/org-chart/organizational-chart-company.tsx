'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Network } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  slug?: string;
  fullName?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface Department {
  id: string;
  companyId: string;
  code?: string;
  name: string;
  description?: string;
  responsibilityArea?: string;
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  parentDepartmentId?: string;
}

// Unit type used for inline expansion under departments
interface Unit {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  staffCount?: number | null;
  leadId?: string | null;
  leadName?: string | null;
  leadEmail?: string | null;
}

async function fetchDepartmentsByIds(workspaceId: string, companyId: string) {
  const response = await fetch(`/api/workspaces/${workspaceId}/companies/${companyId}/departments`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch departments');
  }
  return response.json();
}

// Custom node components aligned with theme
const CompanyNode = ({ data }: { data: any }) => (
  <Card className="w-[360px] bg-card text-foreground border shadow-sm overflow-hidden select-none">
    <div className="bg-primary text-primary-foreground text-sm font-semibold text-center px-4 py-2">
      Şirket
    </div>
    <CardContent className="text-center py-4">
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent">
          <Building2 className="w-5 h-5 text-foreground" />
        </div>
        <h3 className="font-semibold text-lg leading-tight">{data.name}</h3>
      </div>
      {data.fullName && data.fullName !== data.name && (
        <p className="text-xs text-muted-foreground mt-2">{data.fullName}</p>
      )}
    </CardContent>
    <Handle type="source" position={Position.Bottom} />
  </Card>
);

const DepartmentNode = ({ data }: { data: any }) => (
  <Card className="w-[240px] bg-card text-foreground border shadow-sm overflow-hidden cursor-pointer select-none">
    <div className="bg-primary text-primary-foreground text-xs font-semibold text-center px-3 py-2">
      Departman
    </div>
    <CardContent className="text-center pt-3">
      <h4 className="font-medium text-sm leading-tight">{data.name}</h4>
      {data.code && (
        <p className="text-[10px] text-muted-foreground mt-1">Kod: {data.code}</p>
      )}
      {data.managerName ? (
        <div className="flex items-center justify-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-[10px]">
              {data.managerName.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-xs font-medium leading-tight">{data.managerName}</p>
            {data.managerEmail && (
              <p className="text-[10px] text-muted-foreground leading-tight">{data.managerEmail}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-muted-foreground">
          <Network className="w-4 h-4 mx-auto mb-1" />
          <p>Yönetici Atanmamış</p>
        </div>
      )}
      {/* No description on card per requirements */}
    </CardContent>
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
  </Card>
);

const UnitNode = ({ data }: { data: any }) => (
  <Card className="w-[200px] bg-card text-foreground border shadow-sm overflow-hidden select-none">
    <div className="bg-secondary text-secondary-foreground text-[10px] font-semibold text-center px-3 py-2">
      Birim
    </div>
    <CardContent className="text-center pt-2 pb-3">
      <h5 className="font-medium text-xs leading-tight truncate" title={data.name}>{data.name}</h5>
      <div className="mt-2 flex items-center justify-center gap-2">
        <Badge variant="secondary" className="text-[10px]">{data.code || '—'}</Badge>
        {data.leadName ? (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="w-5 h-5">
              <AvatarFallback className="text-[9px]">
                {data.leadName.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="text-[10px] text-left truncate max-w-[110px]">
              <div className="font-medium truncate">{data.leadName}</div>
              {data.leadEmail && <div className="text-muted-foreground truncate">{data.leadEmail}</div>}
            </div>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">Sorumlu yok</span>
        )}
      </div>
    </CardContent>
    <Handle type="target" position={Position.Top} />
  </Card>
);

const nodeTypes: NodeTypes = {
  company: CompanyNode,
  department: DepartmentNode,
  unit: UnitNode,
};

interface OrganizationalChartCompanyProps {
  company: Company;
  workspace: Workspace;
}

export function OrganizationalChartCompany({ company, workspace }: OrganizationalChartCompanyProps) {
  const params = useParams();
  const companyId = (params.companyId as string) || company.id;
  const [expandedDepartmentIds, setExpandedDepartmentIds] = useState<Set<string>>(new Set());
  const [unitsByDepartment, setUnitsByDepartment] = useState<Record<string, Unit[]>>({});

  const {
    data: departments,
    isLoading: departmentsLoading,
    error: departmentsError,
  } = useQuery<Department[]>({
    queryKey: ['departments', workspace.id, companyId],
    queryFn: () => fetchDepartmentsByIds(workspace.id, companyId),
    enabled: !!workspace?.id && !!companyId,
  });

  // Auto-expand all departments and prefetch units so birimler always show under their departments
  useEffect(() => {
    if (!departments || !workspace?.id || !companyId) return;

    // Expand all departments by default
    setExpandedDepartmentIds(new Set(departments.map((d) => d.id)));

    // Prefetch units for all departments that are not loaded yet
    const departmentIdsToFetch = departments
      .map((d) => d.id)
      .filter((deptId) => !unitsByDepartment[deptId]);

    if (departmentIdsToFetch.length === 0) return;

    (async () => {
      try {
        const results = await Promise.all(
          departmentIdsToFetch.map(async (deptId) => {
            try {
              const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${deptId}/units`, { credentials: 'include' });
              if (!res.ok) return [deptId, [] as Unit[]] as const;
              const data = (await res.json()) as Unit[];
              return [deptId, data] as const;
            } catch {
              return [deptId, [] as Unit[]] as const;
            }
          })
        );

        setUnitsByDepartment((prev) => {
          const next = { ...prev };
          results.forEach(([deptId, units]) => {
            next[deptId] = units;
          });
          return next;
        });
      } catch {
        // ignore prefetch errors; UI will still render departments
      }
    })();
  }, [departments, workspace?.id, companyId]);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const departmentPositionById: Record<string, { x: number; y: number }> = {};

    if (!departments) return { nodes, edges };

    // Company node
    nodes.push({
      id: 'company',
      type: 'company',
      position: { x: 0, y: 0 },
      data: {
        ...company,
        workspace,
      },
    });

    // Separate main departments (no parent) from sub-departments
    const mainDepartments = departments.filter((dept) => !dept.parentDepartmentId);
    const subDepartments = departments.filter((dept) => dept.parentDepartmentId);

    // Main department nodes
    // Increase horizontal spacing between top-level departments for better readability
    const departmentSpacing = 320;
    const startX = -((mainDepartments.length - 1) * departmentSpacing) / 2;

    mainDepartments.forEach((dept, index) => {
      const hasSubDepts = subDepartments.some((sub) => sub.parentDepartmentId === dept.id);
      const x = startX + index * departmentSpacing;
      const y = 280;

      departmentPositionById[dept.id] = { x, y };

      nodes.push({
        id: dept.id,
        type: 'department',
        position: { x, y },
        data: {
          ...dept,
          hasSubDepartments: hasSubDepts,
        },
      });

      // Edge from company to main department
      edges.push({
        id: `company-${dept.id}`,
        source: 'company',
        target: dept.id,
        type: 'default',
        style: { stroke: 'var(--primary)', strokeWidth: 2 },
      });
    });

    // Sub-department nodes
    subDepartments.forEach((dept) => {
      const parentIndex = mainDepartments.findIndex((main) => main.id === dept.parentDepartmentId);
      if (parentIndex === -1) return;

      // Find other sub-departments with same parent for positioning
      const siblingsWithSame = subDepartments.filter((sub) => sub.parentDepartmentId === dept.parentDepartmentId);
      const siblingIndex = siblingsWithSame.findIndex((sub) => sub.id === dept.id);
      // Increase spacing between sibling sub-departments as well
      const siblingSpacing = 260;
      const siblingStartX = -((siblingsWithSame.length - 1) * siblingSpacing) / 2;

      const x = startX + parentIndex * departmentSpacing + siblingStartX + siblingIndex * siblingSpacing;
      const y = 480;

      departmentPositionById[dept.id] = { x, y };

      nodes.push({
        id: dept.id,
        type: 'department',
        position: { x, y },
        data: {
          ...dept,
          hasSubDepartments: false,
        },
      });

      // Edge from parent department to sub-department
      edges.push({
        id: `${dept.parentDepartmentId}-${dept.id}`,
        source: dept.parentDepartmentId!,
        target: dept.id,
        type: 'default',
        style: { stroke: 'var(--primary)', strokeWidth: 2 },
      });
    });

    // Inline unit expansions for expanded departments
    // Keep units visually within the horizontal column of their parent department
    // and wrap to multiple rows when necessary to avoid spilling under neighbor departments.
    const unitMinHorizontalSpacing = 170; // minimal spacing between unit nodes
    const unitRowVerticalSpacing = 130; // vertical distance between unit rows
    const unitVerticalGapFromDepartment = 220; // base distance from department to first row of units

    // The available column width for a department roughly equals the spacing between top-level departments.
    const departmentColumnWidth = 320; // must be in sync with departmentSpacing above

    expandedDepartmentIds.forEach((deptId) => {
      const parentPos = departmentPositionById[deptId];
      if (!parentPos) return;

      const units = unitsByDepartment[deptId] || [];
      if (units.length === 0) return;

      // Compute how many units can fit in one row within the department column width
      const maxUnitsPerRow = Math.max(1, Math.floor(departmentColumnWidth / unitMinHorizontalSpacing));
      const numRows = Math.ceil(units.length / maxUnitsPerRow);

      for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
        const startIndex = rowIndex * maxUnitsPerRow;
        const endIndex = Math.min(startIndex + maxUnitsPerRow, units.length);
        const unitsInRow = units.slice(startIndex, endIndex);

        // Dynamic spacing to center the row under the parent department
        const spacingForThisRow = Math.min(
          unitMinHorizontalSpacing,
          unitsInRow.length > 1 ? Math.floor(departmentColumnWidth / (unitsInRow.length - 1)) : unitMinHorizontalSpacing
        );
        const rowWidth = spacingForThisRow * (unitsInRow.length - 1);
        const rowStartX = parentPos.x - rowWidth / 2;
        const rowY = parentPos.y + unitVerticalGapFromDepartment + rowIndex * unitRowVerticalSpacing;

        unitsInRow.forEach((u, idxInRow) => {
          const unitNodeId = `unit-${deptId}-${u.id}`;
          nodes.push({
            id: unitNodeId,
            type: 'unit',
            position: { x: rowStartX + idxInRow * spacingForThisRow, y: rowY },
            data: u,
          });

          edges.push({
            id: `edge-${deptId}-${u.id}`,
            source: deptId,
            target: unitNodeId,
            type: 'default',
            style: { stroke: 'var(--primary)', strokeWidth: 2 },
          });
        });
      }
    });

    return { nodes, edges };
  }, [company, workspace, departments, expandedDepartmentIds, unitsByDepartment]);

  if (departmentsLoading) {
    return (
      <div className="w-full h-[70vh] min-h-[420px] bg-gradient-to-br from-muted/30 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="w-16 h-16 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (departmentsError) {
    return (
      <div className="w-full h-[70vh] min-h-[420px] bg-gradient-to-br from-muted/30 to-background flex items-center justify-center">
        <div className="text-center py-12">
          <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Organizasyon Şeması Yüklenemedi</h3>
          <p className="text-gray-600">Departman bilgileri alınırken bir hata oluştu.</p>
        </div>
      </div>
    );
  }

  if (!departments || departments.length === 0) {
    return (
      <div className="w-full h-[70vh] min-h-[420px] bg-gradient-to-br from-muted/30 to-background flex items-center justify-center">
        <div className="text-center py-12">
          <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz Departman Bulunmuyor</h3>
          <p className="text-gray-600 mb-4">{company.name} için henüz departman tanımlanmamış.</p>
          <Card className="w-80 bg-primary text-primary-foreground border-none shadow-lg mx-auto">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building2 className="w-6 h-6" />
                <CardTitle className="text-lg font-bold">Şirket Organizasyon Şeması</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-4">
                <Badge variant="secondary" className="text-primary font-bold">
                  Şirket
                </Badge>
              </div>
              <div className="bg-primary/90 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-xl">{company.name}</h3>
                {company.fullName && company.fullName !== company.name && (
                  <p className="text-sm opacity-90 mt-1">{company.fullName}</p>
                )}
                <Badge variant="outline" className="text-primary-foreground border-primary-foreground mt-2">Ana Şirket</Badge>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground/20">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{workspace?.name || 'Çalışma Alanı'}</p>
                  <p className="text-xs opacity-90">{company.name} Organizasyonu</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[72vh] min-h-[520px] bg-background rounded-lg border border-border/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        fitViewOptions={{ padding: 0.22 }}
        onInit={(instance) => {
          instance.fitView({ padding: 0.22 });
          instance.zoomTo(0.7);
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={async (_, node) => {
          if (node.type === 'department') {
            const deptId = String(node.id);
            setExpandedDepartmentIds((prev) => {
              const next = new Set(prev);
              if (next.has(deptId)) {
                next.delete(deptId);
              } else {
                next.add(deptId);
              }
              return next;
            });

            // If expanding and units not loaded yet, fetch and cache
            const isAlreadyLoaded = !!unitsByDepartment[deptId];
            const isExpanding = !expandedDepartmentIds.has(deptId);
            if (isExpanding && !isAlreadyLoaded) {
              try {
                const res = await fetch(`/api/workspaces/${workspace.id}/companies/${companyId}/departments/${deptId}/units`, { credentials: 'include' });
                if (res.ok) {
                  const data = (await res.json()) as Unit[];
                  setUnitsByDepartment((prev) => ({ ...prev, [deptId]: data }));
                } else {
                  setUnitsByDepartment((prev) => ({ ...prev, [deptId]: [] }));
                }
              } catch {
                setUnitsByDepartment((prev) => ({ ...prev, [deptId]: [] }));
              }
            }
          }
        }}
      >
        <Background color="var(--border)" gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
