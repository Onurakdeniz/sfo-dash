'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Edit2,
  FileText,
  MoreVertical,
  Package,
  Plus,
  Trash2,
  Upload,
  MessageSquare,
  Activity,
  Download,
  Eye,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

// Priority colors
const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

// Mock data for demonstration
const mockRequest = {
  id: '1',
  code: 'REQ-2024-001',
  title: 'Q3 Widget Order',
  description: 'Quarterly order for advanced widgets and components',
  status: 'clarification' as keyof typeof statusLabels,
  priority: 'high' as keyof typeof priorityColors,
  customerId: '1',
  customer: {
    id: '1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1234567890',
  },
  items: [
    {
      id: '1',
      specification: 'Advanced Widget Model X-100',
      quantity: 100,
      productCode: 'WDG-X100',
      productName: 'Widget X-100',
      manufacturer: 'WidgetCorp',
      model: 'X-100',
      targetPrice: '1500',
      currency: 'USD',
      revision: 1,
      notes: 'Urgent delivery required',
    },
    {
      id: '2',
      specification: 'Standard Component Set',
      quantity: 50,
      productCode: 'CMP-STD',
      productName: 'Component Set',
      manufacturer: 'ComponentCo',
      model: 'STD-2024',
      targetPrice: '750',
      currency: 'USD',
      revision: 2,
      notes: 'Updated specifications in revision 2',
    },
  ],
  files: [
    {
      id: '1',
      name: 'Technical Specifications.pdf',
      size: 2048000,
      createdAt: new Date('2024-01-15'),
      isVisibleToEntity: true,
    },
    {
      id: '2',
      name: 'Purchase Order.pdf',
      size: 1024000,
      createdAt: new Date('2024-01-16'),
      isVisibleToEntity: false,
    },
  ],
  notes: [
    {
      id: '1',
      title: 'Initial Requirements',
      content: 'Customer requires delivery by end of Q3. Special packaging requested.',
      noteType: 'internal',
      isVisibleToEntity: false,
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      title: 'Customer Clarification',
      content: 'Customer confirmed the specifications and approved the revised quantity.',
      noteType: 'customer',
      isVisibleToEntity: true,
      createdAt: new Date('2024-01-16'),
    },
  ],
  activities: [
    {
      id: '1',
      description: 'Request created',
      createdAt: new Date('2024-01-15 10:00'),
    },
    {
      id: '2',
      description: 'Status changed from "new" to "clarification"',
      createdAt: new Date('2024-01-15 14:00'),
    },
    {
      id: '3',
      description: 'Item revised: Component Set (Revision 2)',
      createdAt: new Date('2024-01-16 09:00'),
    },
  ],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-16'),
};

export function TalepDetailTabs() {
  const { workspaceSlug, companySlug, talepId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [request, setRequest] = useState(mockRequest);
  const [activeTab, setActiveTab] = useState('details');
  
  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<keyof typeof statusLabels>(request.status);
  const [statusNotes, setStatusNotes] = useState('');
  
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('internal');
  const [noteVisibleToCustomer, setNoteVisibleToCustomer] = useState(false);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Handle status change
  const handleStatusChange = () => {
    setRequest({ ...request, status: newStatus });
    toast({
      title: 'Success',
      description: 'Request status updated successfully.',
    });
    setStatusDialogOpen(false);
    setStatusNotes('');
  };

  // Handle add note
  const handleAddNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: noteTitle,
      content: noteContent,
      noteType,
      isVisibleToEntity: noteVisibleToCustomer,
      createdAt: new Date(),
    };
    
    setRequest({
      ...request,
      notes: [...request.notes, newNote],
    });
    
    toast({
      title: 'Success',
      description: 'Note added successfully.',
    });
    
    setNoteDialogOpen(false);
    setNoteTitle('');
    setNoteContent('');
    setNoteType('internal');
    setNoteVisibleToCustomer(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
      </div>

      {/* Request Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{request.title}</h1>
                <Badge
                  variant="outline"
                  className={cn(statusColors[request.status])}
                >
                  {statusLabels[request.status]}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(priorityColors[request.priority])}
                >
                  {request.priority}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Request ID: {request.code}
              </p>
              {request.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {request.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNewStatus(request.status);
                  setStatusDialogOpen(true);
                }}
              >
                Change Status
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Request
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Request
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{request.customer.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(request.createdAt, 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {format(request.updatedAt, 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="items">
            Items ({request.items.length})
          </TabsTrigger>
          <TabsTrigger value="files">
            Files ({request.files.length})
          </TabsTrigger>
          <TabsTrigger value="notes">
            Notes ({request.notes.length})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <p className="mt-1">{request.title}</p>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={cn(statusColors[request.status])}
                    >
                      {statusLabels[request.status]}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>Priority</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={cn(priorityColors[request.priority])}
                    >
                      {request.priority}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>Customer</Label>
                  <p className="mt-1">{request.customer.name}</p>
                </div>
              </div>
              
              {request.description && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-sm">{request.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                Recent activities and status changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(activity.createdAt, 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Request Items</CardTitle>
                  <CardDescription>
                    Products and services in this request
                  </CardDescription>
                </div>
                <Button onClick={() => setItemDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.items.map((item, index) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Item {index + 1}</Badge>
                            {item.revision > 1 && (
                              <Badge variant="secondary">
                                Revision {item.revision}
                              </Badge>
                            )}
                            {item.productCode && (
                              <span className="text-sm text-muted-foreground">
                                {item.productCode}
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-medium mb-1">
                            {item.productName || item.specification}
                          </h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Quantity</p>
                              <p className="font-medium">{item.quantity}</p>
                            </div>
                            
                            {item.manufacturer && (
                              <div>
                                <p className="text-xs text-muted-foreground">Manufacturer</p>
                                <p className="font-medium">{item.manufacturer}</p>
                              </div>
                            )}
                            
                            {item.model && (
                              <div>
                                <p className="text-xs text-muted-foreground">Model</p>
                                <p className="font-medium">{item.model}</p>
                              </div>
                            )}
                            
                            {item.targetPrice && (
                              <div>
                                <p className="text-xs text-muted-foreground">Target Price</p>
                                <p className="font-medium">
                                  {item.currency} {item.targetPrice}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-3">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setItemDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Files & Documents</CardTitle>
                  <CardDescription>
                    Attached specifications, drawings, and other documents
                  </CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {request.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>{format(file.createdAt, 'MMM dd, yyyy')}</span>
                          {file.isVisibleToEntity && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Customer Visible
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notes & Comments</CardTitle>
                  <CardDescription>
                    Internal notes and customer communications
                  </CardDescription>
                </div>
                <Button onClick={() => setNoteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {note.title && (
                            <h4 className="font-medium">{note.title}</h4>
                          )}
                          <Badge variant="outline">
                            {note.noteType}
                          </Badge>
                          {note.isVisibleToEntity && (
                            <Badge variant="outline" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Customer Visible
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      
                      <p className="text-sm mb-2">{note.content}</p>
                      
                      <p className="text-xs text-muted-foreground">
                        {format(note.createdAt, 'MMM dd, yyyy HH:mm')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Request Status</DialogTitle>
            <DialogDescription>
              Update the status of this request and add optional notes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as keyof typeof statusLabels)}
              >
                <SelectTrigger id="new-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-notes">Notes (Optional)</Label>
              <Textarea
                id="status-notes"
                placeholder="Add notes about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note or comment to this request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title (Optional)</Label>
              <Input
                id="note-title"
                placeholder="Note title..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note-content">Content *</Label>
              <Textarea
                id="note-content"
                placeholder="Enter your note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note-type">Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger id="note-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="customer">Customer Communication</SelectItem>
                  <SelectItem value="resolution">Resolution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="note-visible"
                checked={noteVisibleToCustomer}
                onChange={(e) => setNoteVisibleToCustomer(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="note-visible" className="text-sm font-normal">
                Make visible to customer
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!noteContent}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}