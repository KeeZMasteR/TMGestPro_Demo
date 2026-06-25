import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { History, Search, Filter, FileText, ClipboardList, ArrowRight, Euro } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useDemo } from '@/lib/DemoContext';

const STATUS_LABELS = {
  rascunho:  { label: 'Rascunho',  color: 'bg-muted text-muted-foreground' },
  enviado:   { label: 'Enviado',   color: 'bg-blue-50 text-blue-700' },
  aceite:    { label: 'Aceite',    color: 'bg-emerald-50 text-emerald-700' },
  recusado:  { label: 'Recusado',  color: 'bg-red-50 text-red-700' },
  faturado:  { label: 'Faturado',  color: 'bg-amber-50 text-amber-700' },
  pago:      { label: 'Pago',      color: 'bg-green-100 text-green-800' },
};

export default function BudgetHistory() {
  const { base44: scopedBase44, demoSessionId } = useDemo();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const { data: allBudgets = [], isLoading } = useQuery({
  queryKey: ['budgets', demoSessionId],
  queryFn: async () => {
  const res = await scopedBase44.entities.Budget.list('-created_date', 500);

  console.log('RAW RESPONSE:', res);

  const data = Array.isArray(res)
    ? res
    : (res?.data ?? res?.results ?? []);

  console.log('ALL BUDGETS RAW:', data);
  console.log('DEMO SESSION ID:', demoSessionId);

  const fixed = data.filter(b => {
    console.log('CHECK ITEM:', b.id, b.demo_session_id);
    return String(b.demo_session_id ?? '') === String(demoSessionId ?? '');
  });

  console.log('FILTERED RESULT:', fixed);

  return fixed;
},
});

  const budgets = allBudgets;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Histórico</h1>
          <p className="text-muted-foreground mt-1">Todos os documentos criados na sessão atual</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pesquisar por número ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os estados</SelectItem>
              {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          [1,2,3].map(i => <Card key={i} className="h-24 animate-pulse bg-muted/20 border-0" />)
        ) : budgets.length === 0 ? (
          <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhum documento encontrado.</p>
          </div>
        ) : (
          budgets.map(budget => {
            const status = STATUS_LABELS[budget.status] || STATUS_LABELS.rascunho;
            const isNote = budget.doc_type === 'nota_servico';
            return (
              <Link key={budget.id} to={isNote ? `/nota-servico/${budget.id}` : `/orcamento/${budget.id}`}>
                <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isNote ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                        {isNote ? <ClipboardList className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{budget.budget_number}</span>
                          <Badge className={`${status.color} border-0`}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{budget.client_name} · {budget.date ? format(new Date(budget.date), 'dd MMM yyyy', { locale: pt }) : 'Sem data'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total</p>
                        <p className="text-lg font-bold text-foreground">€ {budget.total_amount?.toFixed(2)}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}





