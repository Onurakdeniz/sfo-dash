'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerNote {
  id: string;
  title: string | null;
  content: string;
  noteType: string;
  isInternal: boolean;
  priority: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
}

interface NoteModalProps {
  customerId: string;
  workspaceSlug: string;
  companySlug: string;
  notes: CustomerNote[];
  onNoteUpdate: (notes: CustomerNote[]) => void;
}

export interface NoteModalRef {
  openCreate: () => void;
  openEdit: (note: CustomerNote) => void;
}

interface NoteFormData {
  title: string;
  content: string;
  noteType: string;
  priority: string;
}

const initialFormData: NoteFormData = {
  title: '',
  content: '',
  noteType: 'general',
  priority: 'medium',
};

export const NoteModal = forwardRef<NoteModalRef, NoteModalProps>(function NoteModal(
  { customerId, workspaceSlug, companySlug, notes, onNoteUpdate },
  ref
) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CustomerNote | null>(null);
  const [formData, setFormData] = useState<NoteFormData>(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingNote(null);
  };

  useImperativeHandle(ref, () => ({
    openCreate: () => {
      resetForm();
      setOpen(true);
    },
    openEdit: (note: CustomerNote) => {
      handleEdit(note);
    }
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast({
        title: 'Hata',
        description: 'Not içeriği zorunludur',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingNote
        ? `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/notes/${editingNote.id}`
        : `/api/workspaces/${workspaceSlug}/companies/${companySlug}/customers/${customerId}/notes`;

      const response = await fetch(url, {
        method: editingNote ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      const result = await response.json();

      if (editingNote) {
        const updatedNotes = notes.map(note =>
          note.id === editingNote.id ? result.note : note
        );
        onNoteUpdate(updatedNotes);
        toast({
          title: 'Başarılı',
          description: 'Not güncellendi',
        });
      } else {
        onNoteUpdate([...notes, result.note]);
        toast({
          title: 'Başarılı',
          description: 'Not eklendi',
        });
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Hata',
        description: 'Not kaydedilirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (note: CustomerNote) => {
    setEditingNote(note);
    setFormData({
      title: note.title || '',
      content: note.content,
      noteType: note.noteType,
      priority: note.priority,
    });
    setOpen(true);
  };

  const noteTypes = [
    { value: 'general', label: 'Genel' },
    { value: 'meeting', label: 'Toplantı' },
    { value: 'reminder', label: 'Hatırlatıcı' },
    { value: 'follow-up', label: 'Takip' },
  ];

  const priorities = [
    { value: 'high', label: 'Yüksek' },
    { value: 'medium', label: 'Orta' },
    { value: 'low', label: 'Düşük' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="shopifyPrimary" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Not Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingNote ? 'Notu Düzenle' : 'Yeni Not Ekle'}
          </DialogTitle>
          <DialogDescription>
            Müşteri hakkında notlarınızı ekleyin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Başlık (Opsiyonel)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Not başlığı"
            />
          </div>

          <div>
            <Label htmlFor="content">Not İçeriği *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Notunuzu buraya yazın..."
              rows={6}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="noteType">Not Tipi</Label>
              <Select
                value={formData.noteType}
                onValueChange={(value) => setFormData({ ...formData, noteType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Öncelik</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button type="submit" variant="shopifyPrimary">
              {editingNote ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});
