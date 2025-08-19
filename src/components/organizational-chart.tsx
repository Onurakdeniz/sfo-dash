'use client';

import React, { useMemo } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Company data structure matching the screenshot
const companyData = {
  company: {
    name: 'MOBOFIS',
    logo: '/next.svg', // Using placeholder, replace with actual logo
    manager: {
      name: 'Ayla Demir',
      email: 'ayla@mobofis.com.tr',
      role: 'Yönetici',
    },
  },
  departments: [
    {
      id: 'yonetim',
      name: 'Yönetim',
      manager: {
        name: 'Ayşe Demir',
        email: 'ayse@mobofis.com.tr',
      },
    },
    {
      id: 'insan-kaynaklari',
      name: 'İnsan Kaynakları',
      manager: {
        name: 'Mehmet Yılmaz',
        email: 'mehmet.yilmaz@mobofis.com.tr',
      },
    },
    {
      id: 'muhasebe-finans',
      name: 'Muhasebe ve Finans',
      manager: {
        name: 'Merve Tunç',
        email: 'merve.tunc@mobofis.com.tr',
      },
    },
    {
      id: 'bilgi-teknolojileri',
      name: 'Bilgi Teknolojileri (IT)',
      manager: {
        name: 'Murat Tunç',
        email: 'murat.tunc@mobofis.com.tr',
      },
    },
    {
      id: 'satis-pazarlama',
      name: 'Satış ve Pazarlama',
      manager: {
        name: 'Şafin Aslan',
        email: 'safin.aslan@mobofis.com.tr',
      },
    },
  ],
};

// Custom node components
const CompanyNode = ({ data }: { data: any }) => (
  <Card className="w-80 bg-blue-600 text-white border-none shadow-lg">
    <CardHeader className="text-center pb-4">
      <CardTitle className="text-lg font-bold">Şirket Organizasyon Şeması</CardTitle>
    </CardHeader>
    <CardContent className="text-center">
      <div className="mb-4">
        <img src={data.logo} alt="Company Logo" className="w-12 h-12 mx-auto mb-2 filter invert" />
        <Badge variant="secondary" className="text-blue-600 font-bold">
          Şirket
        </Badge>
      </div>
      <div className="bg-blue-700 rounded-lg p-3 mb-4">
        <h3 className="font-bold text-lg">{data.name}</h3>
        <Badge variant="outline" className="text-white border-white mt-1">
          {data.manager.role}
        </Badge>
      </div>
      <div className="flex items-center justify-center space-x-2">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="text-blue-600 text-xs">
            {data.manager.name.split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="text-left">
          <p className="text-sm font-medium">{data.manager.name}</p>
          <p className="text-xs opacity-90">{data.manager.email}</p>
        </div>
      </div>
    </CardContent>
    <Handle type="source" position={Position.Bottom} />
  </Card>
);

const DepartmentNode = ({ data }: { data: any }) => (
  <Card className="w-60 bg-blue-600 text-white border-none shadow-lg">
    <CardHeader className="text-center pb-2">
      <Badge variant="secondary" className="text-blue-600 text-xs">
        Departman
      </Badge>
    </CardHeader>
    <CardContent className="text-center">
      <div className="bg-blue-700 rounded-lg p-3 mb-3">
        <h4 className="font-bold text-sm">{data.name}</h4>
        <Badge variant="outline" className="text-white border-white text-xs mt-1">
          {data.manager.role || 'Yönetici'}
        </Badge>
      </div>
      <div className="flex items-center justify-center space-x-2">
        <Avatar className="w-6 h-6">
          <AvatarFallback className="text-blue-600 text-xs">
            {data.manager.name.split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="text-left">
          <p className="text-xs font-medium">{data.manager.name}</p>
          <p className="text-xs opacity-90">{data.manager.email}</p>
        </div>
      </div>
    </CardContent>
    <Handle type="target" position={Position.Top} />
  </Card>
);

const nodeTypes: NodeTypes = {
  company: CompanyNode,
  department: DepartmentNode,
};

export function OrganizationalChart() {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Company node
    nodes.push({
      id: 'company',
      type: 'company',
      position: { x: 0, y: 0 },
      data: companyData.company,
    });

    // Department nodes
    const departmentSpacing = 280;
    const startX = -(companyData.departments.length - 1) * departmentSpacing / 2;

    companyData.departments.forEach((dept, index) => {
      const nodeId = dept.id;
      
      nodes.push({
        id: nodeId,
        type: 'department',
        position: { 
          x: startX + index * departmentSpacing, 
          y: 200 
        },
        data: {
          ...dept,
          manager: {
            ...dept.manager,
            role: 'Departman Müdürü',
          },
        },
      });

      // Edge from company to department
      edges.push({
        id: `company-${nodeId}`,
        source: 'company',
        target: nodeId,
        type: 'default',
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      });
    });

    return { nodes, edges };
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
