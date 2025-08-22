'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FolderOpen, FileText, Download, Eye, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerFile {
  id: string;
  name: string;
  category: string | null;
  size?: number;
  createdAt: string;
  uploadedBy?: string;
  description?: string;
}

interface FileModalProps {
  customerId: string;
  files: CustomerFile[];
  onFileUpdate: (files: CustomerFile[]) => void;
}

interface FileFormData {
  file: File | null;
  category: string;
  description: string;
}

const initialFormData: FileFormData = {
  file: null,
  category: '',
  description: '',
};

export function FileModal({ customerId, files, onFileUpdate }: FileModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<CustomerFile | null>(null);
  const [formData, setFormData] = useState<FileFormData>(initialFormData);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingFile) {
      // Handle file metadata update
      try {
        const response = await fetch(
          `/api/workspaces/workspaceSlug/companies/companySlug/customers/${customerId}/files/${editingFile.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              category: formData.category,
              description: formData.description,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update file');
        }

        const result = await response.json();
        const updatedFiles = files.map(file =>
          file.id === editingFile.id ? result.file : file
        );
        onFileUpdate(updatedFiles);

        toast({
          title: 'Başarılı',
          description: 'Dosya bilgileri güncellendi',
        });

        setOpen(false);
        resetForm();
      } catch (error) {
        console.error('Error updating file:', error);
        toast({
          title: 'Hata',
          description: 'Dosya güncellenirken bir hata oluştu',
          variant: 'destructive',
        });
      }
    } else {
      // Handle new file upload
      if (!formData.file) {
        toast({
          title: 'Hata',
          description: 'Lütfen bir dosya seçin',
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('file', formData.file);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('description', formData.description);

        const response = await fetch(
          `/api/workspaces/workspaceSlug/companies/companySlug/customers/${customerId}/files`,
          {
            method: 'POST',
            body: formDataToSend,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        const result = await response.json();
        onFileUpdate([...files, result.file]);

        toast({
          title: 'Başarılı',
          description: 'Dosya yüklendi',
        });

        setOpen(false);
        resetForm();
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: 'Hata',
          description: 'Dosya yüklenirken bir hata oluştu',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleEdit = (file: CustomerFile) => {
    setEditingFile(file);
    setFormData({
      file: null,
      category: file.category || '',
      description: file.description || '',
    });
    setOpen(true);
  };

  const handleDelete = async (fileId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/workspaceSlug/companies/companySlug/customers/${customerId}/files/${fileId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      const updatedFiles = files.filter(file => file.id !== fileId);
      onFileUpdate(updatedFiles);

      toast({
        title: 'Başarılı',
        description: 'Dosya silindi',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Hata',
        description: 'Dosya silinirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const handleView = (file: CustomerFile) => {
    // This would typically open the file in a new tab or modal
    toast({
      title: 'Bilgi',
      description: 'Dosya görüntüleme özelliği yakında eklenecek',
    });
  };

  const handleDownload = async (file: CustomerFile) => {
    try {
      const response = await fetch(
        `/api/workspaces/workspaceSlug/companies/companySlug/customers/${customerId}/files/${file.id}/download`
      );

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Hata',
        description: 'Dosya indirilirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const fileCategories = [
    'Sözleşme',
    'Fatura',
    'Teklif',
    'Rapor',
    'Kimlik',
    'Yetki Belgesi',
    'Referans',
    'Diğer',
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="shopifyPrimary" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Dosya Yükle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingFile ? 'Dosya Bilgilerini Düzenle' : 'Yeni Dosya Yükle'}
          </DialogTitle>
          <DialogDescription>
            Müşteri dosyalarını yükleyin veya düzenleyin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingFile && (
            <div>
              <Label htmlFor="file">Dosya Seç *</Label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Dosya Seç
                </Button>
                {formData.file && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Seçilen dosya: {formData.file.name}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {fileCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Dosya hakkında kısa açıklama"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              İptal
            </Button>
            <Button type="submit" variant="shopifyPrimary" disabled={uploading}>
              {uploading ? 'Yükleniyor...' : editingFile ? 'Güncelle' : 'Yükle'}
            </Button>
          </div>
        </form>

        {files.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium mb-3">Mevcut Dosyalar</h4>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getFileIcon(file.name)}</span>
                        <h5 className="font-medium text-sm truncate" title={file.name}>
                          {file.name}
                        </h5>
                        {file.category && (
                          <Badge variant="outline" className="text-xs">
                            {file.category}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Boyut: {formatFileSize(file.size)}</p>
                        <p>Yüklenme: {new Date(file.createdAt).toLocaleDateString('tr-TR')}</p>
                        {file.uploadedBy && <p>Yükleyen: {file.uploadedBy}</p>}
                      </div>
                      {file.description && (
                        <p className="text-xs text-muted-foreground">{file.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(file)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(file)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
