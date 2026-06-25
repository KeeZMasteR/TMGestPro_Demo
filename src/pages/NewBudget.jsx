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
import { generateBudgetPDF } from '@/lib/pdfGenerator';
import { useDemo } from '@/lib/DemoContext';

export default function NewBudget() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canCreateDocument, incrementCount, demoSessionId, base44 } = useDemo();

  // 1. Verificação de limite ao entrar
  useEffect(() => {
    if (!canCreateDocument('orcamento')) {
      toast.error('Limite de 2 orçamentos atingido na versão demo.');
      navigate('/document-limit-reached/orcamento');
    }
  }, [canCreateDocument, navigate]);

  // LISTAGEM DE CLIENTES: Lógica EXACTAMENTE IGUAL a Clients.jsx
  const { data: allClients = [] } = useQuery({
    queryKey: ['clients', demoSessionId],
    queryFn: async () => {
  try {
    const res = await base44.entities.Client.list('-created_date');

    // caso venha embrulhado
    return res?.data ?? res ?? [];
  } catch (err) {
    console.error('Client list error:', err);
    return [];
  }
}
  });

  const clients = useMemo(() => {
  return allClients.filter(c => {
    return c.demo_session_id === demoSessionId || c.address?.includes(demoSessionId);
  });
}, [allClients, demoSessionId]);

  const [form, setForm] = useState({
    budget_number: '',
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    validity: '15 dias',
    notes: '',
  });
  
  const [items, setItems] = useState([
    { id: 'init-1', tipo: 'Material', block_type: 'materiais', nome: '', unidade: 'Und', quantidade: 1, preco_unit: 0, total: 0 }
  ]);

  const selectedClient = clients.find(c => String(c.id) === String(form.client_id));

  const totalAmount = useMemo(() => {
    return items.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);
  }, [items]);

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

  incrementCount('orcamento'); // 🔥 ADICIONA ISTO

  const id =
    result?.id ||
    result?._id ||
    result?.data?.id ||
    result?.data?._id ||
    result?.insertedId;

  queryClient.invalidateQueries({ queryKey: ['budgets'] });

  toast.success('Documento guardado com sucesso!');

  if (id) {
    navigate(`/orcamento/${id}`);
  } else {
    navigate('/historico');
  }
},
    onError: (err) => {
  console.error(err);

  toast.error(
    err?.message ||
    err?.response?.data?.message ||
    'Erro ao gravar documento.'
  );
}
  });

  const handleSave = (e) => {
    if (e) e.preventDefault();
    
    // 2. Verificação de limite antes de gravar
    if (!canCreateDocument('orcamento')) {
      toast.error('Não é possível criar mais orçamentos nesta sessão.');
      navigate('/document-limit-reached/orcamento');
      return;
    }

    if (!form.budget_number || !form.client_id) {
      toast.error('Preencha o número do documento e selecione um cliente.');
      return;
    }

    const doc = {
      ...form,
      items: items
  .filter(i => i.nome || i.preco_unit > 0)
  .map(i => ({
    tipo: i.tipo || '',
    nome: i.nome || '',
    unidade: i.unidade || '',
    quantidade: Number(i.quantidade) || 0,
    preco_unit: Number(i.preco_unit) || 0,
    total: Number(i.total) || 0
  })),
      client_name: selectedClient?.name || '',
      total_amount: parseFloat(totalAmount.toFixed(2)),
      doc_type: 'orcamento',
      demo_session_id: String(demoSessionId),
      status: 'rascunho'
    };

    createMutation.mutate(doc);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-3xl font-heading font-bold">Novo Orçamento</h1>
            <p className="text-muted-foreground mt-1">Propostas profissionais rápidas (Isento de IVA)</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => generateBudgetPDF({ ...form, items, client_name: selectedClient?.name, total_amount: totalAmount })}>
            <FileDown className="w-4 h-4" /> PDF
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={createMutation.isPending}>
            <Save className="w-4 h-4" /> Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-5 border-0 shadow-sm col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Número do Orçamento *</Label><Input value={form.budget_number} onChange={e => setForm({...form, budget_number: e.target.value})} placeholder="Ex: ORC-2024/001" /></div>
            <div><Label>Data de Emissão</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
            <div><Label>Validade</Label><Input value={form.validity} onChange={e => setForm({...form, validity: e.target.value})} placeholder="Ex: 15 dias" /></div>
          </div>
          <LineItemEditor items={items} onChange={setItems} />
          <div className="pt-2">
            <Label>Notas / Observações</Label>
            <Textarea 
              placeholder="Condições de pagamento, prazos, etc." 
              className="mt-1"
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
            />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 border-0 shadow-sm">
            <Label>Cliente *</Label>
            <Select value={form.client_id} onValueChange={v => setForm({...form, client_id: v})}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-5 border-0 shadow-sm">
            <h3 className="font-semibold mb-4 text-primary">Resumo do Orçamento</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>€ {totalAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>IVA (Isento)</span><span>€ 0.00</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span className="text-primary">€ {totalAmount.toFixed(2)}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}





