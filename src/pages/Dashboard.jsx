import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FilePlus, History, Users, FileText, Euro, CheckCircle2, ClipboardList, TrendingUp, Clock, AlertCircle, BarChart3, Building2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { getCompanyProfile } from '@/lib/companyProfile';
import { useDemo } from '@/lib/DemoContext';

const STATUS_LABELS = {
  rascunho:  { label: 'Rascunho',  color: 'bg-muted text-muted-foreground' },
  enviado:   { label: 'Enviado',   color: 'bg-blue-50 text-blue-700' },
  aceite:    { label: 'Aceite',    color: 'bg-emerald-50 text-emerald-700' },
  recusado:  { label: 'Recusado',  color: 'bg-red-50 text-red-700' },
  faturado:  { label: 'Faturado',  color: 'bg-amber-50 text-amber-700' },
  pago:      { label: 'Pago',      color: 'bg-green-100 text-green-800' },
};

function KpiCard({ title, value, sub, icon: Icon, color = 'bg-primary' }) {
  return (
    <Card className="border-0 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

function fmt(v) {
  return `€ ${(v || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Dashboard() {
  const [company, setCompany] = useState({ company_name: '', nif: '' });
  const { demoCounts, base44: scopedBase44, demoSessionId } = useDemo();
  
  useEffect(() => { 
    getCompanyProfile(false, scopedBase44, demoSessionId).then(setCompany); 
  }, [scopedBase44, demoSessionId]);

  const { data: allBudgets = [] } = useQuery({
    queryKey: ['budgets', demoSessionId],
    queryFn: () => scopedBase44.entities.Budget.list('-created_date', 200),
  });

  const budgets = useMemo(() => {
    return allBudgets.filter(b => String(b.demo_session_id) === String(demoSessionId));
  }, [allBudgets, demoSessionId]);

  const totalOrcamentado = budgets
    .filter(b => b.status === 'enviado')
    .reduce((s, b) => s + (b.total_amount || 0), 0);

  const accepted  = budgets.filter(b => b.status === 'aceite');
  const refused   = budgets.filter(b => b.status === 'recusado');
  const decided   = accepted.length + refused.length;
  const convRate  = decided > 0 ? Math.round((accepted.length / decided) * 100) : 0;

  const totalPorReceber = budgets
    .filter(b => b.status === 'faturado' && !b.payment_date)
    .reduce((s, b) => s + (b.total_amount || 0), 0);

  const faturacaoReal = budgets
    .filter(b => b.status === 'pago')
    .reduce((s, b) => s + (b.total_amount || 0), 0);

  const [anoFiltro, setAnoFiltro] = useState('Todos');
  const [trimestreFiltro, setTrimestreFiltro] = useState('Todos');

  const todosOsPagos = budgets.filter(b => b.status === 'pago');
  const anosSet = new Set([2025, ...todosOsPagos.map(b => new Date(b.payment_date || b.date).getFullYear())]);
  const anosDisponiveis = ['Todos', ...Array.from(anosSet).sort((a, b) => a - b).map(String)];

  const pagosFiltrados = todosOsPagos.filter(b => {
    const d = new Date(b.payment_date || b.date);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    if (anoFiltro !== 'Todos' && d.getFullYear() !== parseInt(anoFiltro)) return false;
    if (trimestreFiltro !== 'Todos' && `Q${q}` !== trimestreFiltro) return false;
    return true;
  });

  const totalFaturadoPeriodo = pagosFiltrados.reduce((s, b) => s + (b.total_amount || 0), 0);
  const ivaPeriodo = pagosFiltrados.reduce((s, b) => s + ((b.subtotal || b.total_amount || 0) * 0.23), 0);

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const base = subMonths(new Date(), 5 - i);
    const start = startOfMonth(base);
    const end   = endOfMonth(base);
    const faturado = budgets
      .filter(b => (b.status === 'faturado' || b.status === 'pago') && b.date && isWithinInterval(new Date(b.date), { start, end }))
      .reduce((s, b) => s + (b.total_amount || 0), 0);
    const pago = budgets
      .filter(b => b.status === 'pago' && b.payment_date && isWithinInterval(new Date(b.payment_date), { start, end }))
      .reduce((s, b) => s + (b.total_amount || 0), 0);
    return { mes: format(base, 'MMM', { locale: pt }), Faturado: faturado, Recebido: pago };
  });

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const base = subMonths(new Date(), 5 - i);
    const start = startOfMonth(base);
    const end   = endOfMonth(base);
    const total = pagosFiltrados
      .filter(b => {
        const d = new Date(b.payment_date || b.date);
        return isWithinInterval(d, { start, end });
      })
      .reduce((s, b) => s + (b.total_amount || 0), 0);
    return { mes: format(base, 'MMM yy', { locale: pt }), Total: total };
  });

  const quarterMap = {};
  pagosFiltrados.forEach(b => {
    const d = new Date(b.payment_date || b.date);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    const key = `${d.getFullYear()} Q${q}`;
    quarterMap[key] = (quarterMap[key] || 0) + (b.total_amount || 0);
  });
  const quarterData = Object.entries(quarterMap).map(([trimestre, Total]) => ({ trimestre, Total }));

  const ivaQuarterMap = {};
  pagosFiltrados.forEach(b => {
    const d = new Date(b.payment_date || b.date);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    const key = `${d.getFullYear()} Q${q}`;
    ivaQuarterMap[key] = (ivaQuarterMap[key] || 0) + ((b.subtotal || b.total_amount || 0) * 0.23);
  });
  const ivaQuarterData = Object.entries(ivaQuarterMap).map(([trimestre, IVA]) => ({ trimestre, IVA }));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-primary">
        <Key className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">
          <strong>Versão de Demonstração</strong> · Acesso público · Dados serão apagados ao sair.
          <span className="ml-4 inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded-full text-xs font-semibold">
            {demoCounts.orcamento}/2 Orçamentos · {demoCounts.nota_servico}/2 Notas de Serviço
          </span>
        </p>
      </div>

      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Central Financeira</h1>
        <p className="text-muted-foreground mt-1">
          {company.company_name || 'A Minha Empresa'}
          {company.nif ? ` · NIF ${company.nif}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/novo-orcamento">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group bg-gradient-to-br from-primary to-primary/80">
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <FilePlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">Ação Rápida</p>
                <h2 className="text-white text-lg font-heading font-bold">Criar Orçamento</h2>
                <p className="text-white/60 text-xs mt-0.5">Validade 15 dias · sem IVA</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/nova-nota-servico">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group bg-gradient-to-br from-accent to-accent/80">
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">Ação Rápida</p>
                <h2 className="text-white text-lg font-heading font-bold">Nota de Serviço</h2>
                <p className="text-white/60 text-xs mt-0.5">IVA 23% calculado automaticamente</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Orçamentado" value={fmt(totalOrcamentado)} sub="Orçamentos enviados" icon={FileText} color="bg-blue-500" />
        <KpiCard title="Taxa de Conversão" value={`${convRate}%`} sub={`${accepted.length} aceites · ${refused.length} recusados`} icon={TrendingUp} color="bg-emerald-500" />
        <KpiCard title="Total por Receber" value={fmt(totalPorReceber)} sub="Faturado sem pagamento" icon={Clock} color="bg-amber-500" />
        <KpiCard title="Faturação Real" value={fmt(faturacaoReal)} sub="Documentos pagos" icon={Euro} color="bg-primary" />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
            <Euro className="w-5 h-5 text-emerald-600" /> Faturação Real — Documentos Pagos
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Ano:</span>
              <div className="flex gap-1 flex-wrap">
                {anosDisponiveis.map(a => (
                  <button key={a} onClick={() => setAnoFiltro(a)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${anoFiltro === a ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-primary'}`}>{a}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="border-0 shadow-sm p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-6 h-6 text-white" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Faturado</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{fmt(totalFaturadoPeriodo)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{pagosFiltrados.length} documentos pagos</p>
            </div>
          </Card>
          <Card className="border-0 shadow-sm p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0"><BarChart3 className="w-6 h-6 text-white" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">IVA Acumulado</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{fmt(ivaPeriodo)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">IVA registado nos documentos</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm p-5">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Últimos 6 Meses (Pagos)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <Tooltip formatter={v => [`€ ${v.toFixed(2)}`, 'Total']} />
                <Line type="monotone" dataKey="Total" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="border-0 shadow-sm p-5">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Faturação por Trimestre</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={quarterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="trimestre" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <Tooltip formatter={v => [`€ ${v.toFixed(2)}`, 'Total']} />
                <Bar dataKey="Total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="border-0 shadow-sm p-5">
            <h3 className="text-sm font-semibold mb-4 text-foreground">IVA por Trimestre</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ivaQuarterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="trimestre" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <Tooltip formatter={v => [`€ ${v.toFixed(2)}`, 'IVA']} />
                <Bar dataKey="IVA" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}





