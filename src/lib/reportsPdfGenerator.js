/**
 * Reports PDF Generator
 * Gera versões imprimíveis dos relatórios operacionais.
 * REGRA DE OURO: apenas representa dados existentes — nunca cria nem recalcula.
 */
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { getCompanyProfile } from './companyProfile';

// ── Paleta minimalista ────────────────────────────────────────────────────────
const BLACK   = [20,  20,  20];
const GRAY    = [100, 100, 100];
const LGRAY   = [180, 180, 180];
const WHITE   = [255, 255, 255];
const BLUE    = [30,  80,  180];
const BLIGHT  = [220, 232, 250];
const AMBER   = [180, 100,  20];
const AMBERLT = [255, 243, 205];
const GREEN   = [20,  130,  70];
const GREENLT = [209, 250, 229];
const RED     = [180,  30,  30];
const REDLT   = [255, 220, 220];
const VIOLET  = [110,  60, 180];

// ── Layout ────────────────────────────────────────────────────────────────────
const PAGE_W  = 210;
const PAGE_H  = 297;
const ML      = 14;
const MR      = PAGE_W - ML;
const CW      = MR - ML;
const FOOTER  = PAGE_H - 14;
const MAX_Y   = FOOTER - 10;

// ── Utilitários ───────────────────────────────────────────────────────────────
function fmtEur(v) {
  return `€ ${(v || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: pt }); } catch { return '—'; }
}
function today() {
  return format(new Date(), 'dd/MM/yyyy', { locale: pt });
}

// ── Cabeçalho de página ───────────────────────────────────────────────────────
function drawPageHeader(doc, title, pageNum, company) {
  // Barra azul topo
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, PAGE_W, 16, 'F');

  const companyLabel = [company.company_name, company.nif ? `NIF ${company.nif}` : null]
    .filter(Boolean).join(' · ');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(companyLabel || 'A Minha Empresa', ML, 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Pág. ${pageNum}`, MR, 10.5, { align: 'right' });

  // Título do relatório
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...BLACK);
  doc.text(title, ML, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`Gerado em ${today()}`, ML, 36);

  // Linha separadora
  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.4);
  doc.line(ML, 39, MR, 39);

  return 44; // y após cabeçalho
}

// ── Rodapé ────────────────────────────────────────────────────────────────────
function drawFooter(doc, pageNum) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...LGRAY);
  doc.text('Relatório gerado automaticamente · Dados baseados em documentos existentes', ML, FOOTER);
  doc.text(`${pageNum}`, MR, FOOTER, { align: 'right' });
}

// ── Cabeçalho de tabela genérico ──────────────────────────────────────────────
function drawTableHeader(doc, y, cols) {
  doc.setFillColor(...BLUE);
  doc.rect(ML, y, CW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  cols.forEach(col => {
    const tx = col.align === 'right'  ? col.x + col.w - 1
             : col.align === 'center' ? col.x + col.w / 2
             : col.x + 1;
    doc.text(col.label, tx, y + 4.8, { align: col.align || 'left' });
  });
  return y + 7;
}

// ── Linha de dados ────────────────────────────────────────────────────────────
function drawDataRow(doc, y, cols, values, bg, rowH = 7) {
  if (bg) {
    doc.setFillColor(...bg);
    doc.rect(ML, y, CW, rowH, 'F');
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLACK);

  cols.forEach((col, i) => {
    const val = String(values[i] ?? '');
    const tx  = col.align === 'right'  ? col.x + col.w - 1
              : col.align === 'center' ? col.x + col.w / 2
              : col.x + 1;
    const lines = doc.splitTextToSize(val, col.w - 2);
    doc.text(lines[0], tx, y + 4.8, { align: col.align || 'left' });
  });

  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.15);
  doc.line(ML, y + rowH, MR, y + rowH);

  return y + rowH;
}

// ── Verificar espaço / nova página ────────────────────────────────────────────
function ensureSpace(doc, y, needed, title, pageRef, company) {
  if (y + needed > MAX_Y) {
    drawFooter(doc, pageRef.num);
    doc.addPage();
    pageRef.num++;
    y = drawPageHeader(doc, title, pageRef.num, company);
  }
  return y;
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORTAR — TRABALHOS PENDENTES ACEITES
// ════════════════════════════════════════════════════════════════════════════
export async function exportPendentesPDF(budgets) {
  const company  = await getCompanyProfile();
  const pendentes = budgets.filter(b => b.status === 'aceite');

  const doc    = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const title  = 'Trabalhos Pendentes Aceites';
  const pageRef = { num: 1 };

  let y = drawPageHeader(doc, title, pageRef.num, company);

  // Resumo rápido
  const totalValor = pendentes.reduce((s, b) => s + (b.total_amount || 0), 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...BLUE);
  doc.text(`Total de trabalhos aceites: ${pendentes.length}   ·   Valor total em carteira: ${fmtEur(totalValor)}`, ML, y);
  y += 8;

  if (pendentes.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('Nenhum trabalho pendente de execução.', ML, y + 10);
    drawFooter(doc, pageRef.num);
    doc.save('Relatorio_Pendentes.pdf');
    return;
  }

  // Colunas
  const COLS = [
    { label: 'Nº DOCUMENTO', x: ML,      w: 30, align: 'left'  },
    { label: 'CLIENTE',       x: ML+30,   w: 40, align: 'left'  },
    { label: 'DATA',          x: ML+70,   w: 22, align: 'left'  },
    { label: 'TIPO',          x: ML+92,   w: 22, align: 'left'  },
    { label: 'DESCRIÇÃO',     x: ML+114,  w: 42, align: 'left'  },
    { label: 'VALOR',         x: ML+156,  w: 26, align: 'right' },
  ];

  y = drawTableHeader(doc, y, COLS);

  let rowParity = 0;
  pendentes.forEach(b => {
    y = ensureSpace(doc, y, 8, title, pageRef, company);
    if (y === 44) {
      y = drawTableHeader(doc, y, COLS);
    }

    const isNS    = b.doc_type === 'nota_servico';
    const tipo    = isNS ? 'Nota Serviço' : 'Orçamento';
    const firstIt = b.items?.[0];
    const desc    = firstIt?.description || firstIt?.descricao || firstIt?.service || firstIt?.nome || '—';
    const bg      = rowParity % 2 === 0 ? null : [245, 247, 252];
    rowParity++;

    y = drawDataRow(doc, y, COLS, [
      b.budget_number || '—',
      b.client_name   || '—',
      fmtDate(b.date),
      tipo,
      desc,
      fmtEur(b.total_amount),
    ], bg);
  });

  // Total final
  y += 4;
  y = ensureSpace(doc, y, 12, title, pageRef, company);
  doc.setFillColor(...BLIGHT);
  doc.rect(ML, y, CW, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BLUE);
  doc.text('TOTAL EM CARTEIRA:', ML + 2, y + 6);
  doc.text(fmtEur(totalValor), MR - 1, y + 6, { align: 'right' });

  drawFooter(doc, pageRef.num);
  doc.save('Relatorio_Pendentes.pdf');
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORTAR — RESUMO FINANCEIRO
// ════════════════════════════════════════════════════════════════════════════
export async function exportFinanceiroPDF(budgets) {
  const company        = await getCompanyProfile();
  const docsFaturado   = budgets.filter(b => b.status === 'faturado');
  const docsPorReceber = budgets.filter(b => b.status === 'faturado' && !b.payment_date);
  const docsPago       = budgets.filter(b => b.status === 'pago');

  const sum = (list, field) => list.reduce((s, b) => s + (b[field] || 0), 0);

  const totalFaturado   = sum(docsFaturado,   'total_amount');
  const ivaFaturado     = sum(docsFaturado,   'vat_amount');
  const totalPorReceber = sum(docsPorReceber, 'total_amount');
  const ivaPorReceber   = sum(docsPorReceber, 'vat_amount');
  const totalPago       = sum(docsPago,       'total_amount');
  const ivaPago         = sum(docsPago,       'vat_amount');
  const ivaGeral        = ivaFaturado + ivaPago;

  const doc     = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const title   = 'Resumo Financeiro';
  const pageRef = { num: 1 };

  let y = drawPageHeader(doc, title, pageRef.num, company);

  // Colunas
  const COLS = [
    { label: 'CLIENTE',      x: ML,     w: 44, align: 'left'  },
    { label: 'Nº DOC',       x: ML+44,  w: 28, align: 'left'  },
    { label: 'DATA',         x: ML+72,  w: 22, align: 'left'  },
    { label: 'VALOR BASE',   x: ML+94,  w: 28, align: 'right' },
    { label: 'IVA',          x: ML+122, w: 24, align: 'right' },
    { label: 'VALOR TOTAL',  x: ML+146, w: 36, align: 'right' },
  ];

  // ── Função auxiliar para renderizar uma secção ───────────────────────────
  function renderSection(sectionDocs, sectionTitle, bgHeader, bgRow, totalAmt, totalIva) {
    // Título da secção
    y = ensureSpace(doc, y, 14, title, pageRef, company);
    doc.setFillColor(...bgHeader);
    doc.rect(ML, y, CW, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text(sectionTitle, ML + 2, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`${sectionDocs.length} documento${sectionDocs.length !== 1 ? 's' : ''}`, MR - 1, y + 5.5, { align: 'right' });
    y += 8;

    if (sectionDocs.length === 0) {
      y = ensureSpace(doc, y, 10, title, pageRef, company);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text('Sem documentos neste estado.', ML + 4, y + 6);
      y += 10;
      return;
    }

    // Cabeçalho tabela
    y = ensureSpace(doc, y, 8, title, pageRef, company);
    y = drawTableHeader(doc, y, COLS);

    let parity = 0;
    sectionDocs.forEach(b => {
      y = ensureSpace(doc, y, 8, title, pageRef, company);
      const bg = parity % 2 === 0 ? null : [248, 250, 253];
      parity++;

      const subtotal = (b.total_amount || 0) - (b.vat_amount || 0);
      y = drawDataRow(doc, y, COLS, [
        b.client_name   || '—',
        b.budget_number || '—',
        fmtDate(b.date),
        fmtEur(subtotal < 0 ? b.total_amount : subtotal),
        fmtEur(b.vat_amount),
        fmtEur(b.total_amount),
      ], bg);
    });

    // Subtotal da secção
    y += 2;
    y = ensureSpace(doc, y, 10, title, pageRef, company);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    doc.text(`Subtotal ${sectionTitle}:`, ML + 2, y + 5);
    doc.text(fmtEur(totalAmt), MR - 1, y + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(`IVA: ${fmtEur(totalIva)}`, MR - 30, y + 5, { align: 'right' });
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.3);
    doc.line(ML, y + 8, MR, y + 8);
    y += 12;
  }

  // ── Secções ───────────────────────────────────────────────────────────────
  renderSection(docsFaturado,   'Faturado (emitido, por receber)', AMBERLT, null, totalFaturado,   ivaFaturado);
  renderSection(docsPorReceber, 'Por Receber',                     REDLT,   null, totalPorReceber, ivaPorReceber);
  renderSection(docsPago,       'Pago (recebido)',                 GREENLT, null, totalPago,       ivaPago);

  // ── Totais Gerais ─────────────────────────────────────────────────────────
  y = ensureSpace(doc, y, 36, title, pageRef, company);
  doc.setFillColor(...BLIGHT);
  doc.rect(ML, y, CW, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLUE);
  doc.text('TOTAIS GERAIS', ML + 3, y + 7);

  const totaisRows = [
    { label: 'Total Faturado:',   value: fmtEur(totalFaturado),   color: [...AMBER] },
    { label: 'Total Por Receber:', value: fmtEur(totalPorReceber), color: [...RED]   },
    { label: 'Total Recebido:',   value: fmtEur(totalPago),       color: [...GREEN] },
    { label: 'IVA Total:',        value: fmtEur(ivaGeral),        color: [...VIOLET]},
  ];

  doc.setFontSize(8.5);
  totaisRows.forEach((row, i) => {
    const tx = ML + 3 + (i % 2) * (CW / 2);
    const ty = y + 14 + Math.floor(i / 2) * 9;
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text(row.label, tx, ty);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...row.color);
    doc.text(row.value, tx + 34, ty);
  });

  drawFooter(doc, pageRef.num);
  doc.save('Relatorio_Financeiro.pdf');
}