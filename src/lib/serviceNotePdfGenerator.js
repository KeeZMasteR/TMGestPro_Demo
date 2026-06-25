import jsPDF from 'jspdf';
import { COMPANY_INFO } from './pricelist';
import { format } from 'date-fns';
import { normalize, normalizedText, safeText, formatCurrency } from './pdfUtils';

const DARK = [15, 15, 15];
const BLUE_HEADER = [0, 84, 166];
const WHITE = [255, 255, 255];
const MID_GRAY = [80, 80, 80];

// ───────────────────────────────
// RESET GLOBAL (CRÍTICO)
// ───────────────────────────────
function resetStyle(doc) {
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
}

// ───────────────────────────────
// IMAGE
// ───────────────────────────────
async function loadImageAsDataUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ───────────────────────────────
// FIELD ROW (igual ao original)
// ───────────────────────────────
function fieldRow(doc, label, value, x, y, labelW, totalW) {
  resetStyle(doc);

  doc.setFont('helvetica', 'bold');
  doc.text(`${label}:`, x, y);

  doc.setFont('helvetica', 'normal');
  doc.text(value || '', x + labelW + 2, y);

  doc.setDrawColor(...MID_GRAY);
  doc.setLineWidth(0.35);
  doc.line(x + labelW + 1, y + 1, x + totalW, y + 1);
}

// ───────────────────────────────
// HEADER TABELA (RESTAURADO + FIX)
// ───────────────────────────────
function renderTableHeader(doc, y, COL) {
  const hH = 8;

  doc.setFillColor(25, 25, 25);
  doc.rect(14, y, 182, hH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);

  COL.forEach(col => {
    doc.text(col.label, col.x + col.w / 2, y + 5.5, { align: 'center' });
  });

  resetStyle(doc);
  return y + hH;
}

// ───────────────────────────────
// MAIN
// ───────────────────────────────
export async function generateServiceNotePDF(budget) {
  const doc = new jsPDF('p', 'mm', 'a4');

  const mL = 14;
  const mR = 14;
  const pageW = 210;
  const pageH = 297;
  const cW = pageW - mL - mR;

  const logo = await loadImageAsDataUrl(
    'https://media.base44.com/images/public/69e7cf65e769dab3c40900be/ba85edc51_Logotelmo.png'
  );

  if (logo) doc.addImage(logo, 'PNG', mL, 6, 44, 30);

  resetStyle(doc);

  let y = 40;

  // ── HEADER TEXTO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('NOTA DE SERVIÇO', mL, y);

  doc.setFontSize(12);
  doc.setTextColor(...BLUE_HEADER);
  doc.text(budget.budget_number || '', pageW - mR, y, { align: 'right' });

  y += 10;
  resetStyle(doc);

  // ── CLIENTE (RESTAURADO VISUAL ORIGINAL)
  fieldRow(doc, 'Cliente', budget.client_name, mL, y, 14, cW);
  y += 7;

  fieldRow(doc, 'Local', budget.client_address || '', mL, y, 10, cW);
  y += 7;

  fieldRow(doc, 'C. POSTAL', budget.client_postal_code || '', mL, y, 18, cW / 2);
  fieldRow(doc, 'NIF', budget.client_nif || '', mL + cW / 2, y, 8, cW / 2);

  y += 10;

  // ── LINHA TRACEJADA (RESTAURADA)
  doc.setDrawColor(120, 120, 120);
  doc.setLineDashPattern([1, 2], 0);
  doc.line(mL, y, pageW - mR, y);
  doc.setLineDashPattern([], 0);

  y += 8;

  // ── TABELA
  const COL = [
    { label: 'QTD', x: mL, w: 18 },
    { label: 'DISCRIMINAÇÃO', x: mL + 18, w: 104 },
    { label: 'PREÇO UNIT', x: mL + 122, w: 34 },
    { label: 'TOTAL', x: mL + 156, w: 26 },
  ];

  y = renderTableHeader(doc, y, COL);

  const items = budget.items || [];

  items.forEach(item => {
    const rowH = 7.5;

    if (y + rowH > pageH - 40) {
      doc.addPage();
      y = 20;
      y = renderTableHeader(doc, y, COL);
    }

    doc.setDrawColor(180, 185, 200);
    doc.rect(mL, y, cW, rowH, 'S'); // 🔥 GRELHA RESTAURADA

    resetStyle(doc);

    const midY = y + 5.2;

    doc.text(String(item.quantidade ?? 0), COL[0].x + 9, midY, { align: 'center' });

    doc.text(
      normalizedText(item.nome || ''),
      COL[1].x + 2,
      midY
    );

    doc.text(
      formatCurrency(item.preco_unit ?? 0),
      COL[2].x + COL[2].w - 2,
      midY,
      { align: 'right' }
    );

    doc.text(
      formatCurrency(item.total ?? 0),
      COL[3].x + COL[3].w - 2,
      midY,
      { align: 'right' }
    );

    // 🔥 COLUNAS (GRELHA VERTICAL)
    [COL[1].x, COL[2].x, COL[3].x].forEach(x => {
      doc.line(x, y, x, y + rowH);
    });

    y += rowH;
  });

  doc.save(
    `NotaServico_${(budget.budget_number || 'sem_numero').replace(/[#/\s]/g, '')}.pdf`
  );
}