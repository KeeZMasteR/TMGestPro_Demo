import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ClipboardList, Euro, CheckCircle2, Clock, FileText,
  AlertCircle, BarChart3, Briefcase, Download
} from 'lucide-react';
import { exportPendentesPDF, exportFinanceiroPDF } from '@/lib/reportsPdfGenerator';

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(v) {
  return `€ ${(v || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy', { locale: pt }); } catch { return '—'; }
}

const STATUS_LABELS = {
  rascunho:  { label: 'Rascunho',  color: 'bg-muted text-muted-foreground' },
  enviado:   { label: 'Enviado',   color: 'bg-blue-50 text-blue-700' },
  aceite:    { label: 'Aceite',    color: 'bg-emerald-50 text-emerald-700' },
  recusado:  { label: 'Recusado',  color: 'bg-red-50 text-red-700' },
  faturado:  { label: 'Faturado',  color: 'bg-amber-50 text-amber-700' },
  pago:      { label: 'Pago',      color: 'bg-green-100 text-green-800' },
};

// ── Secção KPI ────────────────────────────────────────────────────────────────
function KpiStrip({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map(({ label, value, sub, icon: Icon, color }) => (
        <Card key={label} className="border-0 shadow-sm p-4 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide leading-tight">{label}</p>
            <p className="text-lg font-bold text-foreground mt-0.5 break-words">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Linha de documento ────────────────────────────────────────────────────────
function DocRow({ doc }) {
  const st = STATUS_LABELS[doc.status] || STATUS_LABELS.rascunho;
  const isNS = doc.doc_type === 'nota_servico';
  const firstItem = doc.items?.[0];
  const descricao = firstItem?.description || firstItem?.descricao || firstItem?.service || firstItem?.nome || '—';

  return (
    <Link
      to={`/orcamento/${doc.id}`}
      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-muted/40 transition-colors border-b border-border last:border-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isNS ? 'bg-accent/10' : 'bg-primary/5'}`}>
          {isNS ? <ClipboardList className="w-4 h-4 text-accent" /> : <FileText className="w-4 h-4 text-primary" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm">{doc.budget_number}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[220px]">
            {doc.client_name} · {descricao}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge className={`text-xs ${st.color}`}>{st.label}</Badge>
        <span className="font-semibold text-sm min-w-[75px] text-right">{fmt(doc.total_amount)}</span>
        <span className="text-xs text-muted-foreground min-w-[85px] text-right">{fmtDate(doc.date)}</span>
      </div>
    </Link>
  );
}

// ── Grupo financeiro ──────────────────────────────────────────────────────────
function FinGroup({ title, docs, totalAmount, totalIva, colorClass, icon: Icon }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <Card className="border-0 shadow-sm mb-4">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{title}</h3>
            <p className="text-xs text-muted-foreground">{docs.length} documento{docs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-foreground">{fmt(totalAmount)}</p>
          <p className="text-xs text-muted-foreground">IVA: {fmt(totalIva)}</p>
        </div>
      </button>
      {expanded && docs.length > 0 && (
        <div className="border-t border-border">
          {docs.map(d => <DocRow key={d.id} doc={d} />)}
        </div>
      )}
      {expanded && docs.length === 0 && (
        <div className="border-t border-border px-5 py-6 text-center text-sm text-muted-foreground">
          Sem documentos neste estado.
        </div>
      )}
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RELATÓRIO 1 — TRABALHOS PENDENTES ACEITES
// ════════════════════════════════════════════════════════════════════════════
function RelatorioPendentes({ budgets }) {
  const pendentes = budgets.filter(b => b.status === 'aceite');
  const totalValor = pendentes.reduce((s, b) => s + (b.total_amount || 0), 0);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={() => exportPendentesPDF(budgets)} className="gap-2">
          <Download className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>
      <KpiStrip items={[
        { label: 'Total Pendentes', value: String(pendentes.length), sub: 'documentos aceites', icon: Briefcase, color: 'bg-emerald-500' },
        { label: 'Valor Total', value: fmt(totalValor), sub: 'em carteira', icon: Euro, color: 'bg-primary' },
      ]} />

      <Card className="border-0 shadow-sm">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-base">Documentos Aceites — Trabalho por Realizar</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Excluídos: Pago, Recusado, Rascunho, Enviado</p>
        </div>
        {pendentes.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum trabalho pendente de execução.</p>
          </div>
        ) : (
          <div>
            {pendentes.map(d => <DocRow key={d.id} doc={d} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RELATÓRIO 2 — RESUMO FINANCEIRO
// ════════════════════════════════════════════════════════════════════════════
function RelatorioFinanceiro({ budgets }) {
  const docsFaturado   = budgets.filter(b => b.status === 'faturado');
  // Por receber = faturado sem payment_date
  const docsPorReceber = budgets.filter(b => b.status === 'faturado' && !b.payment_date);
  // Pago
  const docsPago       = budgets.filter(b => b.status === 'pago');

  const sum    = (list, field) => list.reduce((s, b) => s + (b[field] || 0), 0);
  // IVA sempre 23% do subtotal (cobre orçamentos sem IVA explícito e notas de serviço)
  const sumIva = (list) => list.reduce((s, b) => s + ((b.subtotal || b.total_amount || 0) * 0.23), 0);

  const totalFaturado    = sum(docsFaturado, 'total_amount');
  const ivaFaturado      = sumIva(docsFaturado);
  const totalPorReceber  = sum(docsPorReceber, 'total_amount');
  const ivaPorReceber    = sumIva(docsPorReceber);
  const totalPago        = sum(docsPago, 'total_amount');
  const ivaPago          = sumIva(docsPago);

  const totalGeral       = totalFaturado + totalPago;
  const ivaGeral         = ivaFaturado   + ivaPago;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={() => exportFinanceiroPDF(budgets)} className="gap-2">
          <Download className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>
      <KpiStrip items={[
        { label: 'Total Faturado',    value: fmt(totalFaturado),   sub: `${docsFaturado.length} doc.`,   icon: BarChart3,    color: 'bg-amber-500' },
        { label: 'Por Receber',       value: fmt(totalPorReceber), sub: `${docsPorReceber.length} doc.`, icon: Clock,        color: 'bg-red-500'   },
        { label: 'Total Recebido',    value: fmt(totalPago),       sub: `${docsPago.length} doc.`,       icon: CheckCircle2, color: 'bg-emerald-500' },
        { label: 'IVA Acumulado',     value: fmt(ivaGeral),        sub: 'total IVA (snapshot)',          icon: Euro,         color: 'bg-violet-500' },
      ]} />

      <FinGroup
        title="Faturado (emitido, por receber)"
        docs={docsFaturado}
        totalAmount={totalFaturado}
        totalIva={ivaFaturado}
        colorClass="bg-amber-500"
        icon={AlertCircle}
      />
      <FinGroup
        title="Pago (recebido)"
        docs={docsPago}
        totalAmount={totalPago}
        totalIva={ivaPago}
        colorClass="bg-emerald-500"
        icon={CheckCircle2}
      />

      {/* Total Geral */}
      <Card className="border-0 shadow-sm p-5 bg-primary/5">
        <h3 className="font-semibold text-base mb-3 text-primary">Totais Gerais</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Faturado</p>
            <p className="font-bold text-foreground mt-0.5">{fmt(totalFaturado)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Por Receber</p>
            <p className="font-bold text-red-600 mt-0.5">{fmt(totalPorReceber)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Recebido</p>
            <p className="font-bold text-emerald-600 mt-0.5">{fmt(totalPago)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">IVA Total</p>
            <p className="font-bold text-violet-600 mt-0.5">{fmt(ivaGeral)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'pendentes',   label: 'Trabalhos Pendentes',  icon: Briefcase  },
  { id: 'financeiro',  label: 'Resumo Financeiro',    icon: BarChart3  },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('pendentes');

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets-reports'],
    queryFn: () => base44.entities.Budget.list('-date', 500),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Resumos operacionais baseados em dados existentes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-3" />
          A carregar dados...
        </div>
      ) : (
        <>
          {activeTab === 'pendentes'  && <RelatorioPendentes  budgets={budgets} />}
          {activeTab === 'financeiro' && <RelatorioFinanceiro budgets={budgets} />}
        </>
      )}
    </div>
  );
}