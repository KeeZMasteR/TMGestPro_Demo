import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Building2,
  BookOpen,
  ShieldCheck,
  Bell,
  Save,
  Plus,
  Trash2,
  Lock,
  Globe,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { getCompanyProfile, saveCompanyProfile } from '@/lib/companyProfile';
import { useDemo } from '@/lib/DemoContext';

const UNIDADES = ['H', 'm2', 'm3', 'ml', 'Kg', 'Und', 'Deslocação'];
const TIPOS = ['Prestação de Serviços', 'Material', 'Outros'];

const emptyForm = () => ({
  tipo: 'Prestação de Serviços',
  categoria: '',
  subcategoria: '',
  nome: '',
  unidade: 'H',
  preco_unitario: '',
});

export default function Settings() {
  const queryClient = useQueryClient();
  const { base44, demoSessionId } = useDemo();

  const [profile, setProfile] = useState({
    company_name: '',
    nif: '999 999 999',
    address: 'Rua Exemplo, nº 123, Lisboa',
    email: 'demo@tmgestpro.pt',
    phone: '+351 210 000 000',
    website: 'www.tmgestpro.pt',
    iban: 'PT50 0000 0000 0000 0000 0000 0',
    bank_name: 'Banco de Demonstração'
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const { data: companyData } = useQuery({
    queryKey: ['company-profile', demoSessionId],
    queryFn: () => getCompanyProfile(true, base44, demoSessionId),
  });

  useEffect(() => {
    if (companyData) {
      setProfile(prev => ({ ...prev, ...companyData }));
    }
  }, [companyData]);

  // ✅ FIX: catálogo corrigido mas sem mexer na UI
  const { data: priceItems = [], isLoading: loadingCatalog } = useQuery({
    queryKey: ['price-items', demoSessionId],
    queryFn: async () => {
      const all = await base44.entities.PriceItem.list('-created_date');

      return (all || [])
        .filter(item =>
          !item.demo_session_id ||
          String(item.demo_session_id) === String(demoSessionId)
        )
        .map(item => ({
          ...item,
          id: String(item.id),
          nome: item.nome || item.name || '',
          preco_unitario: item.preco_unitario || item.price || item.preco || 0,
          unidade: item.unidade || item.unit || 'Und',
          tipo: item.tipo || item.type || 'Outros',
          categoria: item.categoria || '',
          subcategoria: item.subcategoria || '',
        }));
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.PriceItem.create({
        ...data,
        demo_session_id: String(demoSessionId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-items'] });
      setDialogOpen(false);
      toast.success('Item adicionado ao catálogo');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) =>
      base44.entities.PriceItem.update(id, {
        ...data,
        demo_session_id: String(demoSessionId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-items'] });
      setDialogOpen(false);
      toast.success('Item atualizado');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PriceItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-items'] });
      toast.success('Item removido');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      ...form,
      preco_unitario: parseFloat(form.preco_unitario) || 0,
      active: true,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (item) => {
    setForm({
      tipo: item.tipo || 'Prestação de Serviços',
      categoria: item.categoria || '',
      subcategoria: item.subcategoria || '',
      nome: item.nome || '',
      unidade: item.unidade || 'H',
      preco_unitario: String(item.preco_unitario || ''),
    });

    setEditingItem(item);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">

      {/* HEADER (ORIGINAL) */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Personalize a sua identidade visual na demonstração
          </p>
        </div>

        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 px-3 py-1">
          <Lock className="w-3 h-3" />
          Versão Demo Limitada
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">

        {/* TABS (ORIGINAL) */}
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="profile" className="gap-2">
            <Building2 className="w-4 h-4" />
            Perfil da Empresa
          </TabsTrigger>

          <TabsTrigger value="catalog" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Catálogo de Preços
          </TabsTrigger>

          <TabsTrigger value="notifications" className="gap-2 opacity-50">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>

          <TabsTrigger value="security" className="gap-2 opacity-50">
            <ShieldCheck className="w-4 h-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* ================= PROFILE ================= */}
        <TabsContent value="profile">
          <Card className="p-8 border-0 shadow-sm space-y-8">

            {/* LOGO (DEMO FIX) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Logotipo da Empresa
              </h3>

              <div className="flex items-center gap-6 p-4 bg-muted/20 rounded-xl border-2 border-dashed border-muted">
                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <img
                    src="https://media.base44.com/images/public/69e7cf65e769dab3c40900be/23c86cf05_ChatGPTImageApr25202608_44_25PM.png"
                    alt="Logo"
                    className="w-16 h-16 object-contain opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Logotipo da Aplicação (Demo)
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Na versão completa será possível adicionar o logotipo da sua empresa.
                  </p>
                </div>
              </div>
            </div>

            {/* APENAS NOME EDITÁVEL */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Identificação Fiscal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nome da Empresa / Profissional</Label>
                  <Input
                    value={profile.company_name}
                    onChange={e =>
                      setProfile({ ...profile, company_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 opacity-60">
                  <Label>NIF</Label>
                  <Input value={profile.nif} readOnly />
                </div>
              </div>
            </div>

            {/* RESTO VISÍVEL MAS BLOQUEADO */}
            <div className="space-y-4 pt-4 border-t opacity-60">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Contactos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input value={profile.email} readOnly />
                <Input value={profile.phone} readOnly />
                <Input value={profile.website} readOnly />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t opacity-60">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Localização
              </h3>

              <Input value={profile.address} readOnly />
            </div>

            <div className="space-y-4 pt-4 border-t opacity-60">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Dados Bancários
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input value={profile.bank_name} readOnly />
                <Input value={profile.iban} readOnly />
              </div>
            </div>

            {/* SAVE */}
            <div className="flex justify-end pt-6 border-t">
              <Button
                onClick={() =>
                  saveCompanyProfile(
                    { company_name: profile.company_name },
                    base44,
                    demoSessionId
                  ).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['company-profile'] });
                    toast.success('Nome guardado');
                  })
                }
              >
                <Save className="w-4 h-4" />
                Guardar Nome
              </Button>
            </div>

          </Card>
        </TabsContent>

        {/* ================= CATALOG ================= */}
        <TabsContent value="catalog">
          <Card className="p-8 border-0 shadow-sm">

            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-heading font-semibold">
                  Catálogo de Serviços
                </h3>
                <p className="text-sm text-muted-foreground">
                  O catálogo é totalmente funcional nesta demonstração.
                </p>
              </div>

              {/* BOTÃO RESTAURADO */}
              <Button
                size="sm"
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => {
                  setForm(emptyForm());
                  setEditingItem(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Novo Item
              </Button>
            </div>

            {/* LISTAGEM ORIGINAL STYLE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {loadingCatalog ? (
                <p className="col-span-full text-center py-10">A carregar...</p>

              ) : priceItems.length === 0 ? (
                <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/5">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>O seu catálogo está vazio.</p>
                </div>

              ) : (
                priceItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl group hover:bg-muted/50 transition-colors"
                  >

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm font-bold text-primary text-xs uppercase">
                        {item.unidade}
                      </div>

                      <div>
                        <p className="font-bold text-sm">{item.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.preco_unitario}€ / {item.unidade} · {item.categoria}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      <Button variant="ghost" size="icon" className="text-destructive"
                        onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                  </div>
                ))
              )}
            </div>

          </Card>
        </TabsContent>

        {/* NOTIFICAÇÕES (ORIGINAL PLACEHOLDER) */}
        <TabsContent value="notifications">
          <div className="p-16 text-center border-2 border-dashed rounded-2xl text-muted-foreground bg-muted/5">
            <Bell className="w-16 h-16 mx-auto mb-6 opacity-10" />
            <h3 className="text-xl font-heading font-bold text-foreground">
              Notificações Inteligentes
            </h3>
            <p className="max-w-sm mx-auto mt-2">
              Disponível apenas na versão completa.
            </p>
          </div>
        </TabsContent>

        {/* SEGURANÇA (ORIGINAL PLACEHOLDER) */}
        <TabsContent value="security">
          <div className="p-16 text-center border-2 border-dashed rounded-2xl text-muted-foreground bg-muted/5">
            <ShieldCheck className="w-16 h-16 mx-auto mb-6 opacity-10" />
            <h3 className="text-xl font-heading font-bold text-foreground">
              Controlo de Acessos
            </h3>
            <p className="max-w-sm mx-auto mt-2">
              Disponível apenas na versão completa.
            </p>
          </div>
        </TabsContent>

      </Tabs>

      {/* DIALOG (ORIGINAL) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Categoria"
                value={form.categoria}
                onChange={e => setForm({ ...form, categoria: e.target.value })}
              />
              <Input
                placeholder="Subcategoria"
                value={form.subcategoria}
                onChange={e => setForm({ ...form, subcategoria: e.target.value })}
              />
            </div>

            <Input
              placeholder="Nome do item"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select value={form.unidade} onValueChange={v => setForm({ ...form, unidade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIDADES.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                step="0.01"
                value={form.preco_unitario}
                onChange={e => setForm({ ...form, preco_unitario: e.target.value })}
                placeholder="Preço"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}











