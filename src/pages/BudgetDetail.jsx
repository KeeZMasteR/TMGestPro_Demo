import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  ArrowLeft, FileDown, Save, Pencil, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { generateBudgetPDF, generateServiceNotePDF } from '@/lib/pdfGenerator';
import { useDemo } from '@/lib/DemoContext';
import LineItemEditor from '@/components/budget/LineItemEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const STATUS = {
  rascunho: 'bg-muted text-muted-foreground',
  enviado: 'bg-blue-50 text-blue-700',
  aceite: 'bg-emerald-50 text-emerald-700',
  recusado: 'bg-red-50 text-red-700',
  faturado: 'bg-amber-50 text-amber-700',
  pago: 'bg-green-100 text-green-800',
};

const LABELS = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aceite: 'Aceite',
  recusado: 'Recusado',
  faturado: 'Faturado',
  pago: 'Pago',
};

const EMPTY_FORM = {
  budget_number: '',
  client_id: '',
  date: '',
  status: 'rascunho',
  notes: '',
  client_name: '',
  client_address: '',
  client_nif: '',
};

export default function BudgetDetail() {
  const { id } = useParams();
  const { base44 } = useDemo();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);

  // =========================
  // LOAD DOCUMENT (DEMO SAFE)
  // =========================
  const { data: budget, isLoading } = useQuery({
    queryKey: ['budget', id],
    queryFn: async () => {
      const res = await base44.entities.Budget.list();
      const data = Array.isArray(res) ? res : (res?.data ?? []);

      return data.find(b =>
        String(b.id) === String(id) || String(b._id) === String(id)
      ) || null;
    },
    enabled: !!id,
  });

  // =========================
  // LOAD CLIENTS
  // =========================
  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.entities.Client.list();
        const data = Array.isArray(res) ? res : (res?.data ?? []);
        setClients(data);
      } catch {
        setClients([]);
      }
    };
    load();
  }, [base44]);

  // =========================
  // INIT FORM
  // =========================
  useEffect(() => {
    if (!budget) return;

    setForm({
      budget_number: budget.budget_number || '',
      client_id: budget.client_id || '',
      date: budget.date || '',
      status: budget.status || 'rascunho',
      notes: budget.notes || '',
      client_name: budget.client_name || '',
      client_address: budget.client_address || '',
      client_nif: budget.client_nif || '',
    });

    setItems(Array.isArray(budget.items) ? budget.items : []);
  }, [budget]);

  // =========================
  // SAFE CALCULATION
  // =========================
  const regularItems = useMemo(
    () => items.filter(i => i.block_type !== 'opcionais'),
    [items]
  );

  const optItems = useMemo(
    () => items.filter(i => i.block_type === 'opcionais'),
    [items]
  );

  const subtotal = useMemo(() => {
    return regularItems.reduce((acc, item) => {
      const price = item.is_night ? (item.preco_unit || 0) * 1.25 : (item.preco_unit || 0);
      return acc + (item.quantidade || 0) * price;
    }, 0);
  }, [regularItems]);

  const totalAmount = budget?.doc_type === 'nota_servico'
    ? subtotal * 1.23
    : subtotal;

  // =========================
  // MUTATION
  // =========================
  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setEditing(false);
      toast.success('Guardado com sucesso');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Budget.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      navigate('/historico');
      toast.success('Eliminado');
    }
  });

  // =========================
  // LOADING SAFE
  // =========================
  if (isLoading) {
    return <div className="p-10 text-center">A carregar...</div>;
  }

  if (!budget) {
    return <div className="p-10 text-center">Documento não encontrado</div>;
  }

  const isNote = budget.doc_type === 'nota_servico';

  // =========================
  // SAVE
  // =========================
  const handleSave = () => {
    const selectedClient = clients.find(
      c => String(c.id) === String(form.client_id)
    );

    updateMutation.mutate({
      ...form,
      items,
      client_name: selectedClient?.name || form.client_name,
      subtotal,
      total_amount: Number(totalAmount.toFixed(2)),
    });
  };

  // =========================
  // UI (ORIGINAL LAYOUT)
  // =========================
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">

          <Button variant="ghost" size="icon" onClick={() => navigate('/historico')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div>
            <h1 className="text-3xl font-heading font-bold">
              {form.budget_number}
            </h1>

            <p className="text-muted-foreground">
              {form.client_name} · {isNote ? 'Nota de Serviço' : 'Orçamento'}
            </p>
          </div>

          <Badge className={STATUS[form.status || 'rascunho']}>
            {LABELS[form.status || 'rascunho']}
          </Badge>
        </div>

        <div className="flex gap-3">

          <Button
            variant="outline"
            onClick={() =>
              isNote
                ? generateServiceNotePDF(budget)
                : generateBudgetPDF(budget)
            }
          >
            <FileDown className="w-4 h-4 mr-2" /> PDF
          </Button>

          {!editing ? (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" /> Editar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Guardar
              </Button>
            </>
          )}

          <Button
            variant="destructive"
            onClick={() => confirm('Eliminar?') && deleteMutation.mutate()}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-6">

        {/* LEFT */}
        <Card className="col-span-2 p-6 border-0 shadow-sm">

          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">

                <div>
                  <Label>Número</Label>
                  <Input
                    value={form.budget_number}
                    onChange={e => setForm({ ...form, budget_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>

              <LineItemEditor items={items} onChange={setItems} />

              <Textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </>
          ) : (
            <>
              <h3 className="font-heading font-semibold mb-4">
                Dados do Cliente
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">

                <div>
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-bold">{form.client_name}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">NIF</p>
                  <p className="font-bold">{form.client_nif || '---'}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-muted-foreground">Morada</p>
                  <p>{form.client_address}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {regularItems.map((item, i) => {
                    const unit = item.is_night
                      ? (item.preco_unit || 0) * 1.25
                      : (item.preco_unit || 0);

                    return (
                      <TableRow key={i}>
                        <TableCell>{item.tipo}</TableCell>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell className="text-center">
                          {item.quantidade}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          € {(item.quantidade * unit).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">
                      TOTAL
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      € {totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {optItems.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Opcionais</h4>

                  {optItems.map((o, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{o.nome}</span>
                      <span>€ {(o.quantidade * o.preco_unit).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>

        {/* RIGHT */}
        <div className="space-y-6">

          <Card className="p-6 border-0 shadow-sm bg-primary/5 border-l-4 border-primary">
  <h3 className="font-heading font-semibold mb-4 text-primary">
    Resumo Financeiro
  </h3>

  <div className="space-y-2 text-sm">

    <div className="flex justify-between font-medium">
      <span>Subtotal</span>
      <span>€ {subtotal.toFixed(2)}</span>
    </div>

    {isNote && (
      <div className="flex justify-between text-amber-700 font-bold">
        <span>IVA (23%)</span>
        <span>€ {(subtotal * 0.23).toFixed(2)}</span>
      </div>
    )}

    <div className="pt-3 border-t border-primary/20">
      <p className="text-3xl font-heading font-bold text-primary">
        € {totalAmount.toFixed(2)}
      </p>
    </div>

  </div>
</Card>

          <Card className="p-6">
            <Label>Estado</Label>

            <Select
              value={form.status || 'rascunho'}
              onValueChange={(v) =>
                setForm({ ...form, status: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {Object.entries(LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

        </div>
      </div>
    </div>
  );
}
