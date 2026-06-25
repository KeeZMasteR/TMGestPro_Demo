import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useDemo } from '@/lib/DemoContext';

const emptyClient = {
  name: '',
  address: '',
  postal_code: '',
  city: '',
  contact_person: '',
  phone: '',
  email: '',
  nif: ''
};

// 🔥 REMOVE [ID:...] APENAS PARA VISUAL (NÃO ALTERA DADOS)
const cleanAddress = (address = '') =>
  address.replace(/\s*\[ID:.*?\]\s*/g, '').trim();

export default function Clients() {
  const { base44, demoSessionId } = useDemo();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(emptyClient);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // =========================
  // LOAD CLIENTS
  // =========================
  const { data: allClients = [], isLoading } = useQuery({
    queryKey: ['clients', demoSessionId],
    queryFn: () => base44.entities.Client.list(),
  });

  // =========================
  // FILTER (DEMO SAFE)
  // =========================
  const filtered = useMemo(() => {
    return allClients.filter(c => {
      const isMine =
        c.demo_session_id === demoSessionId ||
        c.address?.includes(`[ID:${demoSessionId}]`);

      const matchesSearch =
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase());

      return isMine && matchesSearch;
    });
  }, [allClients, demoSessionId, search]);

  // =========================
  // CREATE
  // =========================
  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Client.create({
        ...data,
        demo_session_id: demoSessionId,
        address: `${data.address || ''} [ID:${demoSessionId}]`
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', demoSessionId] });
      closeDialog();
      toast.success('Cliente criado!');
    },
  });

  // =========================
  // UPDATE
  // =========================
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) =>
      base44.entities.Client.update(id, {
        ...data,
        demo_session_id: demoSessionId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', demoSessionId] });
      closeDialog();
      toast.success('Atualizado!');
    },
  });

  // =========================
  // DELETE
  // =========================
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', demoSessionId] });
      toast.success('Eliminado!');
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    setForm(emptyClient);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestão de Clientes</p>
        </div>

        <Button
          onClick={() => {
            setForm(emptyClient);
            setEditingClient(null);
            setDialogOpen(true);
          }}
          className="bg-accent"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* LIST */}
      {isLoading ? (
        <p>A carregar...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {filtered.map(client => (
            <Card key={client.id} className="p-5">

              <div className="flex justify-between items-start">
                <p className="font-bold">{client.name}</p>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setForm({ ...client });
                      setEditingClient(client);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(client.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* DISPLAY LIMPO (SEM ID) */}
              <div className="text-sm text-muted-foreground mt-2">
                {client.phone && <p>{client.phone}</p>}
                {client.email && <p>{client.email}</p>}
                {client.nif && <p>NIF: {client.nif}</p>}
                {client.address && <p>{cleanAddress(client.address)}</p>}
                {client.city && <p>{client.city}</p>}
                {client.postal_code && <p>{client.postal_code}</p>}
                {client.contact_person && <p>Contato: {client.contact_person}</p>}
              </div>

            </Card>
          ))}

          {filtered.length === 0 && (
            <p className="col-span-full text-center py-10 border-2 border-dashed rounded-lg">
              Nenhum cliente nesta sessão.
            </p>
          )}

        </div>
      )}

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar' : 'Novo'} Cliente
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* 🔒 BLOQUEADO (NÃO EDITÁVEL) */}
            <div>
              <Label>NIF</Label>
              <Input value={form.nif} disabled />
            </div>

            {/* 🔒 BLOQUEADO */}
            <div>
              <Label>Morada</Label>
              <Input value={cleanAddress(form.address)} disabled />
            </div>

            {/* 🔒 BLOQUEADO */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cidade</Label>
                <Input value={form.city} disabled />
              </div>

              <div>
                <Label>Código Postal</Label>
                <Input value={form.postal_code} disabled />
              </div>
            </div>

            {/* opcional editável continua */}
            <div>
              <Label>Pessoa de Contacto</Label>
              <Input
                value={form.contact_person}
                onChange={e => setForm({ ...form, contact_person: e.target.value })}
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="submit">Guardar</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}





