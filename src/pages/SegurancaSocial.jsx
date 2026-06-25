import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { ShieldCheck, Euro, AlertTriangle, Info } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, isWithinInterval, format } from 'date-fns';
import { pt } from 'date-fns/locale';

const TAXA_RELEVANTE = 0.70;
const TAXA_SS = 0.214;
const ISENCAO_FIM = new Date('2025-08-01');

function fmt(v) {
  return `€ ${(v || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isIsento(periodoRef) {
  // periodoRef = data de referência do período selecionado
  return periodoRef < ISENCAO_FIM;
}

function calcular(faturacao, periodoRef) {
  const relevante = faturacao * TAXA_RELEVANTE;
  const isento = isIsento(periodoRef);
  const ss = isento ? 0 : relevante * TAXA_SS;
  return { faturacao, relevante, ss, isento };
}

// ── Filtro de docs por intervalo ─────────────────────────────────────────────
function somarPeriodo(budgets, start, end) {
  return budgets
    .filter(b => b.status === 'pago')
    .filter(b => {
      const d = b.payment_date ? new Date(b.payment_date) : (b.date ? new Date(b.date) : null);
      return d && isWithinInterval(d, { start, end });
    })
    .reduce((s, b) => s + (b.total_amount || 0), 0);
}

const QUARTERS = [
  { id: 'Q1', label: 'Q1 · Jan–Mar', months: [0, 1, 2] },
  { id: 'Q2', label: 'Q2 · Abr–Jun', months: [3, 4, 5] },
  { id: 'Q3', label: 'Q3 · Jul–Set', months: [6, 7, 8] },
  { id: 'Q4', label: 'Q4 · Out–Dez', months: [9, 10, 11] },
];

const MESES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  label: format(new Date(2025, i, 1), 'MMMM', { locale: pt }),
}));

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon }) {
  return (
    <Card className="border-0 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

// ── Resultado SS ─────────────────────────────────────────────────────────────
function ResultadoSS({ resultado, periodoLabel }) {
  const { faturacao, relevante, ss, isento } = resultado;

  return (
    <Card className="border-0 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">{periodoLabel}</h3>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isento ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {isento ? '⚠️ ISENTO (simulação)' : '✓ ATIVO'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Faturação Total" value={fmt(faturacao)} sub="documentos pagos" icon={Euro} color="bg-primary" />
        <KpiCard label="Rendimento Relevante" value={fmt(relevante)} sub="70% da faturação" icon={Euro} color="bg-violet-500" />
        <KpiCard
          label="Segurança Social"
          value={isento ? '— €0,00' : fmt(ss)}
          sub={isento ? 'Isento até Ago 2025' : '21,4% do relevante'}
          icon={ShieldCheck}
          color={isento ? 'bg-amber-400' : 'bg-emerald-500'}
        />
      </div>

      {isento && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Período de Isenção Ativo</p>
            <p className="text-xs mt-0.5">A contribuição para a Segurança Social só é devida a partir de Agosto de 2025. O valor mostrado é apenas uma simulação informativa.</p>
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Faturação</span>
          <span className="font-medium">{fmt(faturacao)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">× 70% → Rendimento Relevante</span>
          <span className="font-medium">{fmt(relevante)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 mt-1">
          <span className="text-muted-foreground">× 21,4% → Segurança Social</span>
          <span className={`font-bold ${isento ? 'text-amber-600' : 'text-emerald-600'}`}>{isento ? '€ 0,00 (isento)' : fmt(ss)}</span>
        </div>
      </div>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
const ANOS = ['2025', '2026', '2027'];
const VISTAS = [
  { id: 'mensal', label: 'Mensal' },
  { id: 'trimestral', label: 'Trimestral' },
  { id: 'anual', label: 'Anual' },
];

export default function SegurancaSocial() {
  const [ano, setAno] = useState('2025');
  const [vista, setVista] = useState('trimestral');
  const [trimestre, setTrimestre] = useState('Q1');
  const [mes, setMes] = useState(0);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets-ss'],
    queryFn: () => base44.entities.Budget.list('-date', 500),
  });

  const resultado = useMemo(() => {
    const anoNum = parseInt(ano);

    if (vista === 'anual') {
      const start = startOfYear(new Date(anoNum, 0, 1));
      const end = endOfYear(new Date(anoNum, 0, 1));
      const fat = somarPeriodo(budgets, start, end);
      // referência = Julho do ano (meio do ano, conservador)
      const ref = new Date(anoNum, 6, 1);
      return { resultado: calcular(fat, ref), label: `Ano ${ano}` };
    }

    if (vista === 'trimestral') {
      const q = QUARTERS.find(q => q.id === trimestre);
      const start = new Date(anoNum, q.months[0], 1);
      const end = endOfMonth(new Date(anoNum, q.months[2], 1));
      const fat = somarPeriodo(budgets, start, end);
      // referência = primeiro dia do trimestre
      return { resultado: calcular(fat, start), label: `${trimestre} ${ano}` };
    }

    // mensal
    const start = startOfMonth(new Date(anoNum, mes, 1));
    const end = endOfMonth(new Date(anoNum, mes, 1));
    const fat = somarPeriodo(budgets, start, end);
    return { resultado: calcular(fat, start), label: `${MESES[mes].label} ${ano}` };
  }, [budgets, ano, vista, trimestre, mes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Segurança Social</h1>
        <p className="text-muted-foreground mt-1">Simulador de contribuições · Empresário em Nome Individual</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>Este módulo é apenas de leitura e simulação. Não altera nem escreve qualquer dado financeiro.</p>
      </div>

      {/* Demo footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-primary font-medium bg-primary/5 border border-primary/20 rounded-lg p-3">
        <ShieldCheck className="w-4 h-4" />
        <span>Acesso no plano pago</span>
      </div>

      {/* Controlos */}
      <Card className="border-0 shadow-sm p-5 space-y-4">
        {/* Vista */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium w-16">Vista:</span>
          <div className="flex gap-1">
            {VISTAS.map(v => (
              <button key={v.id} onClick={() => setVista(v.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${vista === v.id ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/50'}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ano */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium w-16">Ano:</span>
          <div className="flex gap-1">
            {ANOS.map(a => (
              <button key={a} onClick={() => setAno(a)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${ano === a ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/50'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Trimestre (apenas se vista = trimestral) */}
        {vista === 'trimestral' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium w-16">Trimestre:</span>
            <div className="flex gap-1 flex-wrap">
              {QUARTERS.map(q => (
                <button key={q.id} onClick={() => setTrimestre(q.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${trimestre === q.id ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-muted-foreground border-border hover:border-emerald-400'}`}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mês (apenas se vista = mensal) */}
        {vista === 'mensal' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium w-16">Mês:</span>
            <div className="flex gap-1 flex-wrap">
              {MESES.map(m => (
                <button key={m.id} onClick={() => setMes(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${mes === m.id ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-muted-foreground border-border hover:border-violet-400'}`}>
                  {m.label.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Resultado */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-3" />
          A carregar dados…
        </div>
      ) : (
        <ResultadoSS resultado={resultado.resultado} periodoLabel={resultado.label} />
      )}
    </div>
  );
}