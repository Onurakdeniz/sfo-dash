'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  FileText, 
  Package, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  Building2,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/page-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { RequestService } from '@/actions/talep/request-service';

// Status color mapping
const statusColors = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  clarification: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  supplier_inquiry: 'bg-purple-100 text-purple-800 border-purple-200',
  pricing: 'bg-orange-100 text-orange-800 border-orange-200',
  offer: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  negotiation: 'bg-pink-100 text-pink-800 border-pink-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Status labels
const statusLabels = {
  new: 'New',
  clarification: 'Clarification',
  supplier_inquiry: 'Supplier Inquiry',
  pricing: 'Pricing',
  offer: 'Offer',
  negotiation: 'Negotiation',
  closed: 'Closed',
};

// Priority color mapping
const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

interface Request {
  id: string;
  code?: string;
  title: string;
  description?: string;
  status: keyof typeof statusLabels;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerId: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  itemCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface KanbanColumn {
  id: keyof typeof statusLabels;
  title: string;
  requests: Request[];
}

export default function RequestListPage() {
  const { workspaceSlug, companySlug } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Sorting
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    if (!workspaceSlug || !companySlug) return;
    
    setLoading(true);
    try {
      // In a real implementation, these IDs would come from the session/context
      const workspaceId = 'current-workspace-id'; // Replace with actual workspace ID
      const companyId = 'current-company-id'; // Replace with actual company ID
      
      const result = await RequestService.getRequests({
        workspaceId,
        companyId,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        customerId: customerFilter !== 'all' ? customerFilter : undefined,
        searchTerm: searchTerm || undefined,
        sortBy,
        sortOrder,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
      
      setRequests(result);
      // In a real implementation, we'd also get total count from the API
      setTotalItems(result.length); 
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load requests. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, companySlug, statusFilter, customerFilter, searchTerm, sortBy, sortOrder, currentPage, itemsPerPage, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle status change
  const handleStatusChange = async (requestId: string, newStatus: keyof typeof statusLabels) => {
    try {
      await RequestService.updateRequestStatus({
        requestId,
        newStatus,
      });
      
      toast({
        title: 'Success',
        description: 'Request status updated successfully.',
      });
      
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update request status.',
        variant: 'destructive',
      });
    }
  };

  // Handle sorting
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Navigate to request detail
  const handleRequestClick = (requestId: string) => {
    router.push(`/${workspaceSlug}/${companySlug}/talep/${requestId}`);
  };

  // Navigate to new request form
  const handleNewRequest = () => {
    router.push(`/${workspaceSlug}/${companySlug}/talep/new`);
  };

  // Get unique customers for filter
  const uniqueCustomers = Array.from(
    new Set(requests.map(r => r.customer?.id).filter(Boolean))
  ).map(id => requests.find(r => r.customer?.id === id)?.customer).filter(Boolean);

  // Prepare Kanban columns
  const kanbanColumns: KanbanColumn[] = Object.entries(statusLabels).map(([id, title]) => ({
    id: id as keyof typeof statusLabels,
    title,
    requests: requests.filter(r => r.status === id),
  }));

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Requests (Talep)</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer requests and track their lifecycle
            </p>
          </div>
          <Button onClick={handleNewRequest} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Request
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests.filter(r => r.status === 'new').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests.filter(r => ['clarification', 'supplier_inquiry', 'pricing', 'offer', 'negotiation'].includes(r.status)).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active requests</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Urgent Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {requests.filter(r => r.priority === 'urgent').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filters</CardTitle>
              <div className="flex items-center gap-2">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'kanban')}>
                  <TabsList>
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="kanban">Kanban</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {uniqueCustomers.map((customer) => (
                    <SelectItem key={customer!.id} value={customer!.id}>
                      {customer!.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table View */}
        {viewMode === 'table' && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Request ID</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8 data-[state=open]:bg-accent"
                          onClick={() => handleSort('title')}
                        >
                          Title
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8 data-[state=open]:bg-accent"
                          onClick={() => handleSort('status')}
                        >
                          Status
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8 data-[state=open]:bg-accent"
                          onClick={() => handleSort('createdAt')}
                        >
                          Created
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className="h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-gray-500">No requests found</p>
                            <Button
                              variant="link"
                              onClick={handleNewRequest}
                              className="mt-2"
                            >
                              Create your first request
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((request) => (
                        <TableRow
                          key={request.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRequestClick(request.id)}
                        >
                          <TableCell className="font-mono text-sm">
                            {request.code || request.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {request.title}
                            {request.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {request.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {request.customer?.name || 'Unknown'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(statusColors[request.status])}
                            >
                              {statusLabels[request.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(priorityColors[request.priority])}
                            >
                              {request.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{request.itemCount || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRequestClick(request.id);
                                  }}
                                >
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/${workspaceSlug}/${companySlug}/talep/${request.id}/edit`);
                                  }}
                                >
                                  Edit Request
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {Object.entries(statusLabels).map(([value, label]) => (
                                  value !== request.status && (
                                    <DropdownMenuItem
                                      key={value}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(request.id, value as keyof typeof statusLabels);
                                      }}
                                    >
                                      Move to {label}
                                    </DropdownMenuItem>
                                  )
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startItem} to {endItem} of {totalItems} requests
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && <span className="px-2">...</span>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {kanbanColumns.map((column) => (
              <Card key={column.id} className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {column.title}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {column.requests.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {column.requests.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No requests
                    </div>
                  ) : (
                    column.requests.map((request) => (
                      <Card
                        key={request.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleRequestClick(request.id)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <p className="font-medium text-sm line-clamp-2">
                                {request.title}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'ml-2 text-xs',
                                  priorityColors[request.priority]
                                )}
                              >
                                {request.priority[0].toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate">
                                {request.customer?.name || 'Unknown'}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3 text-muted-foreground" />
                                <span>{request.itemCount || 0} items</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {format(new Date(request.createdAt), 'MMM dd')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}