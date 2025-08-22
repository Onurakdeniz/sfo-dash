"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Filter, Building2, User, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type EntityType = "customer" | "supplier" | "both";
type BusinessEntity = {
  id: string;
  name: string;
  fullName: string | null;
  entityType: EntityType;
  status: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  customerCode: string | null;
  supplierCode: string | null;
  taxNumber: string | null;
  creditLimit: string | null;
  createdAt: string;
};

export default function BusinessEntitiesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });

  const workspaceId = params.workspaceSlug as string;
  const companyId = params.companySlug as string;

  // Get entity type from URL if present
  const urlEntityType = searchParams.get("type") as EntityType | null;

  useEffect(() => {
    if (urlEntityType && ["customer", "supplier", "both"].includes(urlEntityType)) {
      setEntityTypeFilter(urlEntityType);
    }
  }, [urlEntityType]);

  useEffect(() => {
    fetchEntities();
  }, [entityTypeFilter, statusFilter, sortBy, sortOrder, pagination.page]);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (entityTypeFilter !== "all") {
        queryParams.append("entityType", entityTypeFilter);
      }
      
      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }
      
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const response = await fetch(
        `/api/workspaces/${workspaceId}/companies/${companyId}/business-entities?${queryParams}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch business entities");
      }

      const data = await response.json();
      setEntities(data.entities);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching entities:", error);
      toast({
        title: "Error",
        description: "Failed to load business entities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntities();
  };

  const getEntityTypeBadge = (type: EntityType) => {
    switch (type) {
      case "customer":
        return <Badge variant="default">Customer</Badge>;
      case "supplier":
        return <Badge variant="secondary">Supplier</Badge>;
      case "both":
        return <Badge variant="outline">Customer & Supplier</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "blocked":
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(parseFloat(amount));
  };

  const pageTitle = () => {
    switch (entityTypeFilter) {
      case "customer":
        return "Customers";
      case "supplier":
        return "Suppliers";
      case "both":
        return "Customers & Suppliers";
      default:
        return "Business Entities";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle()}</h1>
          <p className="text-muted-foreground">
            Manage your business relationships
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${workspaceId}/${companyId}/business-entities/new`)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, phone, tax number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select
              value={entityTypeFilter}
              onValueChange={(value) => setEntityTypeFilter(value as EntityType | "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="customer">Customers Only</SelectItem>
                <SelectItem value="supplier">Suppliers Only</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="updatedAt">Updated Date</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" variant="secondary">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : entities.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No business entities found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Start by adding your first {entityTypeFilter !== "all" ? entityTypeFilter : "business entity"}.
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push(`/${workspaceId}/${companyId}/business-entities/new`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entities.map((entity) => (
                  <TableRow
                    key={entity.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/${workspaceId}/${companyId}/business-entities/${entity.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          {entity.entityType === "customer" ? (
                            <User className="h-5 w-5" />
                          ) : entity.entityType === "supplier" ? (
                            <Package className="h-5 w-5" />
                          ) : (
                            <Building2 className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{entity.name}</div>
                          {entity.taxNumber && (
                            <div className="text-sm text-muted-foreground">
                              Tax: {entity.taxNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getEntityTypeBadge(entity.entityType)}</TableCell>
                    <TableCell>
                      {entity.entityType === "customer" || entity.entityType === "both" ? (
                        <div className="text-sm">
                          <span className="text-muted-foreground">C:</span> {entity.customerCode || "-"}
                        </div>
                      ) : null}
                      {entity.entityType === "supplier" || entity.entityType === "both" ? (
                        <div className="text-sm">
                          <span className="text-muted-foreground">S:</span> {entity.supplierCode || "-"}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {entity.email && <div>{entity.email}</div>}
                        {entity.phone && <div className="text-muted-foreground">{entity.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {entity.city || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(entity.creditLimit)}</TableCell>
                    <TableCell>{getStatusBadge(entity.status)}</TableCell>
                    <TableCell className="text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
            {pagination.totalCount} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}