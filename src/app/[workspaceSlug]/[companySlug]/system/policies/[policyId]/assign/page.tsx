"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Building,
  Briefcase,
  CheckSquare,
  X
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";

// API integration functions
const fetchPolicyAssignments = async (policyId: string) => {
  try {
    const response = await fetch(`/api/system/policies/${policyId}/assignments`);
    if (!response.ok) throw new Error('Failed to fetch policy assignments');
    return await response.json();
  } catch (error) {
    console.error('Error fetching policy assignments:', error);
    return null;
  }
};

const updatePolicyAssignments = async (policyId: string, workspaceIds: string[], companyIds: string[]) => {
  try {
    const response = await fetch(`/api/system/policies/${policyId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceIds, companyIds })
    });
    if (!response.ok) throw new Error('Failed to update policy assignments');
    return await response.json();
  } catch (error) {
    console.error('Error updating policy assignments:', error);
    throw error;
  }
};

export default function PolicyAssignPage() {
  const [policy, setPolicy] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const params = useParams();
  const router = useRouter();
  const policyId = params.policyId as string;

  // Load policy assignments on component mount
  useEffect(() => {
    loadPolicyAssignments();
  }, [policyId]);

  const loadPolicyAssignments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPolicyAssignments(policyId);
      if (data) {
        setPolicy(data.policy);
        setWorkspaces(data.workspaces);
        setCompanies(data.companies);
        
        // Set initial selections based on current assignments
        setSelectedWorkspaces(data.workspaces.filter(w => w.isAssigned).map(w => w.id));
        setSelectedCompanies(data.companies.filter(c => c.isAssigned).map(c => c.id));
      }
    } catch (error) {
      console.error('Failed to load policy assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceToggle = (workspaceId: string) => {
    setSelectedWorkspaces(prev => 
      prev.includes(workspaceId)
        ? prev.filter(id => id !== workspaceId)
        : [...prev, workspaceId]
    );
  };

  const handleCompanyToggle = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSaveAssignments = async () => {
    try {
      await updatePolicyAssignments(policyId, selectedWorkspaces, selectedCompanies);
      // Navigate back to policies list
      router.push("../");
    } catch (error) {
      console.error('Failed to save policy assignments:', error);
      // You could add a toast notification here
    }
  };

  if (isLoading) {
    return (
      <PageWrapper
        title="Politika Atama"
        description="Yükleniyor..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </PageWrapper>
    );
  }

  if (!policy) {
    return (
      <PageWrapper
        title="Politika Atama"
        description="Politika bulunamadı"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Politika bulunamadı</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Politika Atama"
      description={`"${policy.title}" politikasını çalışma alanları ve şirketlere atayın`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Politika Atama</h2>
              <p className="text-muted-foreground">
                {policy.title} - Çalışma alanları ve şirketlere atama
              </p>
            </div>
          </div>
          <Button onClick={handleSaveAssignments}>
            <CheckSquare className="w-4 h-4 mr-2" />
            Atamaları Kaydet
          </Button>
        </div>

        {/* Policy Info */}
        <Card>
          <CardHeader>
            <CardTitle>Politika Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="font-semibold">{policy.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Tür: {policy.type} • Durum: {policy.status}
                </p>
              </div>
              <Badge variant={policy.status === 'published' ? 'default' : 'secondary'}>
                {policy.status === 'published' ? 'Yayınlandı' : 'Taslak'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Çalışma Alanı Atamaları
            </CardTitle>
            <CardDescription>
              Bu politikanın hangi çalışma alanlarında aktif olacağını seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Seç</TableHead>
                  <TableHead>Çalışma Alanı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Atanma Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspaces.map((workspace) => (
                  <TableRow key={workspace.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedWorkspaces.includes(workspace.id)}
                        onCheckedChange={() => handleWorkspaceToggle(workspace.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{workspace.name}</TableCell>
                    <TableCell>
                      {selectedWorkspaces.includes(workspace.id) ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Atanmış
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Atanmamış</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {workspace.assignedAt || (selectedWorkspaces.includes(workspace.id) ? 'Yeni' : '-')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Company Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Şirket Atamaları
            </CardTitle>
            <CardDescription>
              Bu politikanın hangi şirketlerde aktif olacağını seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Seç</TableHead>
                  <TableHead>Şirket</TableHead>
                  <TableHead>Çalışma Alanı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Atanma Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={() => handleCompanyToggle(company.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {company.workspaceName}
                    </TableCell>
                    <TableCell>
                      {selectedCompanies.includes(company.id) ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Atanmış
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Atanmamış</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.assignedAt || (selectedCompanies.includes(company.id) ? 'Yeni' : '-')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Atama Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Seçili Çalışma Alanları</p>
                <p className="text-2xl font-bold text-blue-600">
                  {selectedWorkspaces.length} / {workspaces.length}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Seçili Şirketler</p>
                <p className="text-2xl font-bold text-green-600">
                  {selectedCompanies.length} / {companies.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}