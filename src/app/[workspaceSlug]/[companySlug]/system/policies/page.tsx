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
  Plus,
  FileText,
  Edit,
  Trash2,
  Eye,
  Archive,
  CheckSquare
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";

// API integration functions
const fetchPolicies = async () => {
  try {
    const response = await fetch('/api/system/policies');
    if (!response.ok) throw new Error('Failed to fetch policies');
    return await response.json();
  } catch (error) {
    console.error('Error fetching policies:', error);
    return [];
  }
};



const policyTypes = [
  { value: "privacy", label: "Gizlilik Politikası" },
  { value: "terms", label: "Hizmet Şartları" },
  { value: "compliance", label: "Uyumluluk Politikası" },
  { value: "security", label: "Güvenlik Politikası" },
  { value: "data", label: "Veri Yönetimi Politikası" },
  { value: "other", label: "Diğer" }
];

const statusColors = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const params = useParams();
  const router = useRouter();

  // Load policies on component mount
  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setIsLoading(true);
    try {
      const policiesData = await fetchPolicies();
      setPolicies(policiesData);
    } catch (error) {
      console.error('Failed to load policies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPolicy = () => {
    router.push(`/${params.workspaceSlug}/${params.companySlug}/system/policies/new`);
  };

  const handlePolicyClick = (policyId: string) => {
    router.push(`/${params.workspaceSlug}/${params.companySlug}/system/policies/${policyId}`);
  };

  const handleAssignPolicy = (policyId) => {
    // Navigate to policy assignment page
    router.push(`system/policies/${policyId}/assign`);
  };

  return (
    <PageWrapper
      title="Sözleşme Yönetimi"
      description="Organizasyon politikalarını ve sözleşmelerini yönetin"
    >
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Politikalar</h2>
            <p className="text-muted-foreground">
              Organizasyonunuzun politikalarını oluşturun ve yönetin
            </p>
          </div>
          <Button onClick={handleAddPolicy}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Politika
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Politika</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{policies.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yayınlanan</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {policies.filter(p => p.status === 'published').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taslak</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {policies.filter(p => p.status === 'draft').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atanmış</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {policies.filter(p => p.assignedWorkspaces > 0 || p.assignedCompanies > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Policies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Politika Listesi</CardTitle>
            <CardDescription>
              Tüm organizasyon politikalarını görüntüleyin ve yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Atamalar</TableHead>
                  <TableHead>Son Güncelleme</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow 
                    key={policy.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handlePolicyClick(policy.id)}
                  >
                    <TableCell className="font-medium">{policy.title}</TableCell>
                    <TableCell>
                      {policyTypes.find(t => t.value === policy.type)?.label || policy.type}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[policy.status]}>
                        {policy.status === 'draft' && 'Taslak'}
                        {policy.status === 'published' && 'Yayınlandı'}
                        {policy.status === 'archived' && 'Arşivlendi'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {policy.assignedWorkspaces} Çalışma Alanı, {policy.assignedCompanies} Şirket
                      </span>
                    </TableCell>
                    <TableCell>{policy.updatedAt}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignPolicy(policy.id);
                        }}
                      >
                        <CheckSquare className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>


      </div>
    </PageWrapper>
  );
}