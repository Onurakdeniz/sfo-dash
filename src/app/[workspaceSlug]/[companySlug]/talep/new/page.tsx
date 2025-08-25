'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/page-wrapper';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Package, 
  Upload,
  X,
  Edit2,
  FileText,
  Building2,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequestService, CreateRequestItemInput } from '@/actions/talep/request-service';

interface RequestItem extends CreateRequestItemInput {
  tempId: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export default function NewRequestPage() {
  const { workspaceSlug, companySlug } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  
  // Form state
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<RequestItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  
  // Item dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RequestItem | null>(null);
  const [itemForm, setItemForm] = useState<Partial<RequestItem>>({
    specification: '',
    quantity: 1,
    productCode: '',
    productName: '',
    manufacturer: '',
    model: '',
    partNumber: '',
    category: '',
    targetPrice: '',
    currency: 'USD',
    notes: '',
  });

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // In a real implementation, this would fetch from the API
        // For now, using mock data
        setCustomers([
          { id: '1', name: 'Acme Corporation', email: 'contact@acme.com', phone: '+1234567890' },
          { id: '2', name: 'Global Defense Ltd', email: 'info@globaldefense.com', phone: '+9876543210' },
          { id: '3', name: 'Tech Industries', email: 'sales@techindustries.com', phone: '+1122334455' },
        ]);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load customers.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [toast]);

  // Handle item dialog
  const openItemDialog = (item?: RequestItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm(item);
    } else {
      setEditingItem(null);
      setItemForm({
        specification: '',
        quantity: 1,
        productCode: '',
        productName: '',
        manufacturer: '',
        model: '',
        partNumber: '',
        category: '',
        targetPrice: '',
        currency: 'USD',
        notes: '',
      });
    }
    setItemDialogOpen(true);
  };

  const closeItemDialog = () => {
    setItemDialogOpen(false);
    setEditingItem(null);
    setItemForm({
      specification: '',
      quantity: 1,
      productCode: '',
      productName: '',
      manufacturer: '',
      model: '',
      partNumber: '',
      category: '',
      targetPrice: '',
      currency: 'USD',
      notes: '',
    });
  };

  // Save item
  const saveItem = () => {
    if (!itemForm.specification) {
      toast({
        title: 'Error',
        description: 'Specification is required for each item.',
        variant: 'destructive',
      });
      return;
    }

    if (editingItem) {
      // Update existing item
      setItems(items.map(item => 
        item.tempId === editingItem.tempId 
          ? { ...itemForm as RequestItem, tempId: editingItem.tempId }
          : item
      ));
    } else {
      // Add new item
      const newItem: RequestItem = {
        ...itemForm as RequestItem,
        tempId: `temp-${Date.now()}`,
      };
      setItems([...items, newItem]);
    }

    closeItemDialog();
  };

  // Delete item
  const deleteItem = (tempId: string) => {
    setItems(items.filter(item => item.tempId !== tempId));
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Submit form
  const handleSubmit = async () => {
    // Validation
    if (!customerId) {
      toast({
        title: 'Error',
        description: 'Please select a customer.',
        variant: 'destructive',
      });
      return;
    }

    if (!title) {
      toast({
        title: 'Error',
        description: 'Please enter a request title.',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to the request.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, these IDs would come from the session/context
      const workspaceId = 'current-workspace-id'; // Replace with actual workspace ID
      const companyId = 'current-company-id'; // Replace with actual company ID

      const result = await RequestService.createRequest({
        customerId,
        title,
        description,
        items: items.map(({ tempId, ...item }) => item),
        workspaceId,
        companyId,
      });

      // Upload files if any
      if (files.length > 0) {
        // In a real implementation, you would upload files to blob storage
        // and then attach them to the request
        for (const file of files) {
          // await RequestService.attachFileToRequest(result.request.id, {
          //   name: file.name,
          //   blobUrl: 'uploaded-url',
          //   contentType: file.type,
          //   size: file.size,
          // });
        }
      }

      toast({
        title: 'Success',
        description: 'Request created successfully.',
      });

      router.push(`/${workspaceSlug}/${companySlug}/talep/${result.request.id}`);
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: 'Failed to create request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
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

        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Request</h1>
          <p className="text-muted-foreground mt-1">
            Create a new customer request and add items
          </p>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Request Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Information</CardTitle>
                <CardDescription>
                  Enter the basic information for this request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={customerId}
                    onValueChange={setCustomerId}
                    disabled={loadingCustomers}
                  >
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{customer.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Q3 Widget Order"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    A short, descriptive title for the request
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter additional details about the request..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Request Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Request Items</CardTitle>
                    <CardDescription>
                      Add products or services to this request
                    </CardDescription>
                  </div>
                  <Button onClick={() => openItemDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No items added yet</p>
                    <Button
                      variant="link"
                      onClick={() => openItemDialog()}
                      className="mt-2"
                    >
                      Add your first item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={item.tempId}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">Item {index + 1}</Badge>
                              {item.productCode && (
                                <span className="text-sm text-muted-foreground">
                                  {item.productCode}
                                </span>
                              )}
                            </div>
                            <p className="font-medium">
                              {item.productName || item.specification}
                            </p>
                            {item.manufacturer && (
                              <p className="text-sm text-muted-foreground">
                                Manufacturer: {item.manufacturer}
                              </p>
                            )}
                            {item.model && (
                              <p className="text-sm text-muted-foreground">
                                Model: {item.model}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openItemDialog(item)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteItem(item.tempId)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="font-medium">{item.quantity}</span>
                          </div>
                          {item.targetPrice && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Target Price:</span>
                              <span className="font-medium">
                                {item.currency} {item.targetPrice}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Files and Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
                <CardDescription>
                  Upload specifications, drawings, or other documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border-2 border-dashed rounded-lg p-4">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        Click to upload files
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        or drag and drop
                      </span>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Request'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/${workspaceSlug}/${companySlug}/talep`)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
            <DialogDescription>
              Enter the details for the request item
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-specification">Specification *</Label>
                <Textarea
                  id="item-specification"
                  placeholder="Detailed description of the product/service"
                  value={itemForm.specification}
                  onChange={(e) => setItemForm({ ...itemForm, specification: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-quantity">Quantity *</Label>
                <Input
                  id="item-quantity"
                  type="number"
                  min="1"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-product-code">Product Code</Label>
                <Input
                  id="item-product-code"
                  placeholder="e.g., WDG-001"
                  value={itemForm.productCode}
                  onChange={(e) => setItemForm({ ...itemForm, productCode: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-product-name">Product Name</Label>
                <Input
                  id="item-product-name"
                  placeholder="e.g., Advanced Widget"
                  value={itemForm.productName}
                  onChange={(e) => setItemForm({ ...itemForm, productName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-manufacturer">Manufacturer</Label>
                <Input
                  id="item-manufacturer"
                  placeholder="e.g., Acme Corp"
                  value={itemForm.manufacturer}
                  onChange={(e) => setItemForm({ ...itemForm, manufacturer: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-model">Model</Label>
                <Input
                  id="item-model"
                  placeholder="e.g., Model X-100"
                  value={itemForm.model}
                  onChange={(e) => setItemForm({ ...itemForm, model: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-part-number">Part Number</Label>
                <Input
                  id="item-part-number"
                  placeholder="e.g., PN-12345"
                  value={itemForm.partNumber}
                  onChange={(e) => setItemForm({ ...itemForm, partNumber: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <Input
                  id="item-category"
                  placeholder="e.g., Electronics"
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-target-price">Target Price</Label>
                <Input
                  id="item-target-price"
                  type="number"
                  placeholder="0.00"
                  value={itemForm.targetPrice}
                  onChange={(e) => setItemForm({ ...itemForm, targetPrice: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-currency">Currency</Label>
                <Select
                  value={itemForm.currency}
                  onValueChange={(value) => setItemForm({ ...itemForm, currency: value })}
                >
                  <SelectTrigger id="item-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="TRY">TRY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-notes">Notes</Label>
              <Textarea
                id="item-notes"
                placeholder="Additional notes or requirements..."
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeItemDialog}>
              Cancel
            </Button>
            <Button onClick={saveItem}>
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}