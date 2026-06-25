import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Shield, Plus, Trash2, UserCheck, Mail } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABELS = { admin: 'Administrador', user: 'Utilizador' };
const ROLE_COLORS = { admin: 'bg-purple-100 text-purple-800', user: 'bg-blue-100 text-blue-800' };

export default function AllowedEmailsSection() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'user', notes: '' });

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['allowed-emails'],
    queryFn: () => base44.entities.AllowedEmail.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AllowedEmail.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-emails'] });
      setDialogOpen(false);
      setForm({ email: '', name: '', role: 'user', notes: '' });
      toast.success('Email autorizado adicionado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AllowedEmail.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-emails'] });
      toast.success('Email removido da lista');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailLower = form.email.trim().toLowerCase();
    if (!emailLower) return;
    // Verificar duplicado
    if (emails.some(e => e.email.toLowerCase() === emailLower)) {
      toast.error('Este email já está na lista');
      return;
    }
    createMutation.mutate({ ...form, email: emailLower });
  };

  return (
    <Card className="p-6 border-0 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-heading font-semibold">Controlo de Acesso</h2>
            <p className="text-xs text-muted-foreground">
              Apenas emails nesta lista podem criar conta e aceder à app.
            </p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Adicionar Email
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">A carregar...</div>
      ) : emails.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="font-medium">Nenhum email autorizado</p>
          <p className="text-xs mt-1">Adiciona emails para controlar quem pode aceder.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-semibold">Email</th>
                <th className="text-left px-3 py-2.5 font-semibold">Nome</th>
                <th className="text-center px-3 py-2.5 font-semibold w-32">Papel</th>
                <th className="text-right px-3 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {emails.map(item => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono text-xs">{item.email}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{item.name || '—'}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[item.role] || ROLE_COLORS.user}`}>
                      {ROLE_LABELS[item.role] || item.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" /> Autorizar Email
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input
                className="mt-1 font-mono"
                type="email"
                placeholder="exemplo@gmail.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Nome (opcional)</Label>
              <Input
                className="mt-1"
                placeholder="Nome do utilizador"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Papel</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilizador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="gap-2">
                <UserCheck className="w-4 h-4" /> Autorizar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}