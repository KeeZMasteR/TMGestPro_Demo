import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, FileDown, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import LineItemEditor from '@/components/budget/LineItemEditor';
import { generateServiceNotePDF } from '@/lib/pdfGenerator';
import { useDemo } from '@/lib/DemoContext';

export default function NewServiceNote() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canCreateDocument, incrementCount, demoSessionId, base44 } = useDemo();

  useEffect(() => {
    if (!canCreateDocument('nota_servico')) {
      toast.error('Limite de 2 notas de serviço atingido na versão demo.');
      navigate('/document-limit-reached/nota_servico');
    }
  }, [canCreateDocument, navigate]);

  // ✅ CLIENTES (FIX: sempre array + safe unwrap)
  const { data: allClients = [] } = useQuery({
    queryKey: ['clients', demoSessionId],
    queryFn: async () => {
      try {
        const res = await base44.entities.Client.list('-created_date');

const data =
  res?.data ??
  res?.results ??
  res ??
  [];

return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('Client list error:', err);
        return [];
      }
    }
  });

  const clients = useMemo(() => {
  return (allClients || []).filter(c => {
    const demo = String(c.demo_session_id ?? '');
    const session = String(demoSessionId ?? '');

    return demo === session || (c.address ?? '').includes(session);
  });
}, [allClients, demoSessionId]);

  const [form, setForm] = useState({
    budget_number: '',
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    request_date: '',
    completion_date: '',
    completion_time: '',
    notes: '',
  });

  const [items, setItems] = useState([
    { id: 'init-1', tipo: 'Prestação de Serviços', block_type: 'servicos', nome: '', unidade: 'H', quantidade: 1, preco_unit: 0, total: 0 }
  ]);

  const selectedClient = useMemo(() => {
    return clients.find(c => String(c.id) === String(form.client_id));
  }, [clients, form.client_id]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);
  }, [items]);

  const VAT_RATE = 0.23;
  const vatAmount = +(subtotal * VAT_RATE).toFixed(2);
  const totalAmount = +(subtotal + vatAmount).toFixed(2);

  // ✅ MUTATION FIXADO (normaliza result + garante id)
  const createMutation = useMutation({
  mutationFn: async (data) => {
    try {
      const payload = {
        ...data,
        demo_session_id: String(demoSessionId), // 🔥 FORÇAR SEMPRE STRING
      };

      console.log('PAYLOAD A ENVIAR:', payload);

      const result = await base44.entities.Budget.create(payload);

      console.log('CREATE RESULT:', result);

      return result;

    } catch (err) {
      console.error('Erro completo ao criar documento:', err);
      throw err;
    }
  },

  onSuccess: (result) => {
  console.log('CREATE RESULT:', result);

  incrementCount('nota_servico'); // 🔥 ADICIONA ISTO

  const id =
    result?.id ||
    result?._id ||
    result?.data?.id ||
    result?.data?._id ||
    result?.insertedId;

  queryClient.invalidateQueries({ queryKey: ['budgets'] });

  toast.success('Documento guardado com sucesso!');

  if (id) {
    navigate(`/nota-servico/${id}`);
  } else {
    navigate('/historico');
  }
},

    onError: (err) => {
      console.error('CREATE ERROR:', err);
      toast.error(err?.message || 'Erro ao gravar documento.');
    }
  });

  const handleSave = (e) => {
    if (e) e.preventDefault();

    if (!canCreateDocument('nota_servico')) {
      toast.error('Não é possível criar mais notas de serviço nesta sessão.');
      navigate('/document-limit-reached/nota_servico');
      return;
    }

    if (!form.budget_number || !form.client_id) {
      toast.error('Preencha o número do documento e selecione um cliente.');
      return;
    }

    const doc = {
      ...form,
      items: items.filter(i => i.nome || i.preco_unit > 0),
      client_name: selectedClient?.name || '',
      subtotal: +subtotal.toFixed(2),
      vat_amount: vatAmount,
      total_amount: totalAmount,
      doc_type: 'nota_servico',
      status: 'rascunho',
      demo_session_id: String(demoSessionId),
    };

    createMutation.mutate(doc);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div>
            <h1 className="text-3xl font-heading font-bold">Nova Nota de Serviço</h1>
            <p className="text-muted-foreground mt-1">Cálculo automático de IVA (23%)</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              generateServiceNotePDF({
                ...form,
                items,
                client_name: selectedClient?.name,
                subtotal,
                vat_amount: vatAmount,
                total_amount: totalAmount
              })
            }
          >
            <FileDown className="w-4 h-4" /> PDF
          </Button>

          <Button
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleSave}
            disabled={createMutation.isPending}
          >
            <Save className="w-4 h-4" /> Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-5 border-0 shadow-sm col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número do Documento *</Label>
              <Input
                value={form.budget_number}
                onChange={e => setForm({ ...form, budget_number: e.target.value })}
              />
            </div>

            <div>
              <Label>Data de Emissão</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div>
              <Label>Data de Conclusão</Label>
              <Input
                type="date"
                value={form.completion_date}
                onChange={e => setForm({ ...form, completion_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Hora</Label>
              <Input
                type="time"
                value={form.completion_time}
                onChange={e => setForm({ ...form, completion_time: e.target.value })}
              />
            </div>
          </div>

          <LineItemEditor
  items={items.filter(i => i.block_type !== 'opcionais')}
  onChange={(newItems) => {
    // garante que nunca entram opcionais na nota de serviço
    const safeItems = newItems.filter(i => i.block_type !== 'opcionais');
    setItems(safeItems);
  }}
/>

          <Textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />
        </Card>

        <div className="space-y-6">
          <Card className="p-5 border-0 shadow-sm">
            <Label>Cliente *</Label>

            <Select
              value={form.client_id ? String(form.client_id) : ''}
              onValueChange={(v) => {
  setForm(prev => ({
    ...prev,
    client_id: String(v)
  }));
}}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecionar cliente..." />
              </SelectTrigger>

              <SelectContent>
                {clients.map(c => (
  <SelectItem key={c.id} value={String(c.id)}>
    {c.name || c.email || `Cliente ${c.id}`}
  </SelectItem>
))}
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-5 border-0 shadow-sm">
            <h3 className="font-semibold mb-4 text-accent">Resumo Financeiro</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>€ {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-accent">
                <span>IVA (23%)</span>
                <span>€ {vatAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-primary">€ {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}







