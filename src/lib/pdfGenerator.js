/**
 * Budget & Service Note PDF Generator
 * SCHEMA CONTRACT STRICT MODE — Schema is law. Snapshot is truth. Rendering is passive.
 */
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { getItemGroup, GROUP_ORDER } from './pricelist';
import { normalize, normalizedText, safeText, formatCurrency, isValidLine } from './pdfUtils';
import { getCompanyProfile } from './companyProfile';

// ── Brand colours ─────────────────────────────────────────────────────────────
const BLUE_DARK  = [0,   60, 150];
const BLUE_MID   = [30,  90, 190];
const BLUE_LIGHT = [220, 232, 250];
const DARK       = [25,  25,  25];
const WHITE      = [255, 255, 255];
const GRAY       = [100, 100, 100];

// ── Layout (mm) ───────────────────────────────────────────────────────────────
const PAGE_W    = 210;
const PAGE_H    = 297;
const MARGIN    = 14;
const RIGHT     = PAGE_W - MARGIN;
const CONTENT_W = RIGHT - MARGIN;
const FOOTER_RESERVE = 50;
const MAX_TABLE_Y    = PAGE_H - FOOTER_RESERVE;

// ── SCHEMA FIXO: colunas do Orçamento / Nota de Serviço ───────────────────────
const COLS = [
  { label: 'SERVIÇO',   x: MARGIN, w: 30,  align: 'left'   },
  { label: 'DESCRIÇÃO', x: 44,     w: 74,  align: 'left'   },
  { label: 'UND',       x: 119,    w: 14,  align: 'center' },
  { label: 'QTD',       x: 133,    w: 14,  align: 'center' },
  { label: 'V. UNIT.',  x: 147,    w: 26,  align: 'right'  },
  { label: 'VALOR',     x: 173,    w: 23,  align: 'right'  },
];
const ROW_H     = 7.5;
const HEADER_H  = 7;
const SECTION_H = 6.5;

function resolveGroup(item) {
  const unit = item.unidade || item.unit || '';
  const cat  = item.categoria || item.subcategoria || '';
  return getItemGroup(unit, cat);
}

function mapItemForDisplay(item) {
  let nome = item.nome || item.name || '';
  nome = nome.replace(/\s*\(NOTURNO \+25%\)\s*/gi, '').trim();
  const isNight = item.isNocturno === true || item.is_night === true || item.is_night === 'true' || item.isNight === true;
  
  return {
    nome,
    descricao:  item.descricao || item.description || '',
    unidade:    item.unidade || item.unit || '',
    quantidade: item.quantidade ?? item.qty ?? 0,
    preco_unit: item.preco_unit ?? item.price ?? 0,
    total:      item.total ?? 0,
    isOptional: item.isOptional || false,
    isNocturno: isNight,
  };
}

function expandItemToRows(rawItem) {
  const item = mapItemForDisplay(rawItem);
  const rows = [item];
  
  if (item.isNocturno && item.quantidade > 0 && item.preco_unit > 0) {
    const noturnoRow = {
      nome:       '↳ Horas noturnas (+25%)',
      descricao:  '',
      unidade:    item.unidade,
      quantidade: item.quantidade,
      preco_unit: item.preco_unit * 0.25,
      total:      item.quantidade * (item.preco_unit * 0.25),
      isOptional: item.isOptional,
      isNocturno: false,
      is_secondary: true,
    };
    rows.push(noturnoRow);
  }
  return rows;
}

function isValidItem(item) {
  if (!item) return false;
  const qty = parseFloat(item.qty ?? item.quantidade ?? 0);
  const price = parseFloat(item.price ?? item.preco_unit ?? 0);
  const name = item.nome || item.name || '';
  return qty > 0 && price >= 0 && name.trim() !== '';
}

function fmtEur(v) { return formatCurrency(v); }
function fmtDate(d) {
  if (!d) return format(new Date(), 'dd/MM/yyyy');
  try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return ''; }
}
function colRight(col) { return col.x + col.w; }

async function loadBackground(url) {
  try {
    if (!window.pdfjsLib) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    const pdf    = await window.pdfjsLib.getDocument({ url, withCredentials: false }).promise;
    const page   = await pdf.getPage(1);
    const vp     = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('[pdfGenerator] bg load failed:', e);
    return null;
  }
}

function drawBg(doc, bg) {
  if (bg) doc.addImage(bg, 'PNG', 0, 0, PAGE_W, PAGE_H, undefined, 'FAST');
}

function midBaseline(y, h, fontSize) {
  return y + h / 2 + fontSize * 0.35 / 2;
}

function drawTableHeader(doc, y) {
  doc.setFillColor(...BLUE_MID);
  doc.rect(MARGIN, y, CONTENT_W, HEADER_H, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  const baseY = midBaseline(y, HEADER_H, 7.5);
  COLS.forEach(col => {
    const tx = col.align === 'right'  ? colRight(col) - 1
             : col.align === 'center' ? col.x + col.w / 2
             : col.x + 1;
    doc.text(col.label, tx, baseY, { align: col.align });
  });
  return y + HEADER_H;
}

function drawSectionLabel(doc, y, label) {
  doc.setFillColor(...BLUE_LIGHT);
  doc.rect(MARGIN, y, CONTENT_W, SECTION_H, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BLUE_DARK);
  doc.text(label.toUpperCase(), MARGIN + 2, midBaseline(y, SECTION_H, 8));
  return y + SECTION_H;
}

const FONT_SIZE  = 8;
const LINE_H     = 4.5;

function drawDataRow(doc, y, rowData, bg, isSecondary = false) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isSecondary ? 7 : FONT_SIZE);
  const svcLines  = doc.splitTextToSize(rowData.nome,      COLS[0].w - 2);
  const descLines = doc.splitTextToSize(rowData.descricao, COLS[1].w - 3);
  const maxLines  = Math.max(svcLines.length, descLines.length, 1);
  const rowH      = Math.max(ROW_H, maxLines * LINE_H + 3);

  if (y + rowH > MAX_TABLE_Y) {
    doc.addPage();
    drawBg(doc, bg);
    y = 30;
    y = drawTableHeader(doc, y);
  }

  if (isSecondary) { doc.setFillColor(250, 250, 250); } else { doc.setFillColor(255, 255, 255); }
  doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');

  const fontSize = isSecondary ? 7 : FONT_SIZE;
  const midY = midBaseline(y, rowH, fontSize);
  const blockTopY = (lines) => midBaseline(y, rowH, fontSize) - ((lines.length - 1) * LINE_H) / 2;

  doc.setFont('helvetica', isSecondary ? 'normal' : 'bold');
  doc.setFontSize(fontSize);
  doc.setTextColor(...(isSecondary ? [120, 120, 120] : DARK));
  const svcTop = blockTopY(svcLines);
  svcLines.forEach((l, i) => {
    doc.text(normalizedText(l), COLS[0].x + (isSecondary ? 3 : 1), svcTop + i * LINE_H);
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(...(isSecondary ? [120, 120, 120] : DARK));
  const descTop = blockTopY(descLines);
  descLines.forEach((l, i) => {
    doc.text(normalizedText(l), COLS[1].x + 1, descTop + i * LINE_H);
  });

  doc.text(safeText(rowData.unidade),            COLS[2].x + COLS[2].w / 2, midY, { align: 'center' });
  doc.text(safeText(rowData.quantidade),          COLS[3].x + COLS[3].w / 2, midY, { align: 'center' });
  doc.text(fmtEur(rowData.preco_unit), colRight(COLS[4]) - 1,     midY, { align: 'right'  });
  doc.text(fmtEur(rowData.total),      colRight(COLS[5]) - 1,     midY, { align: 'right'  });

  doc.setDrawColor(180, 200, 230);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y + rowH, RIGHT, y + rowH);

  return y + rowH;
}

function drawIvaNote(doc, y) {
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('Todos os valores estão sujeitos a IVA à taxa legal em vigor', MARGIN, y);
}

// ── Bloco de Totais Original (Orçamentos) ───────────────────────────────────
function drawTotals(doc, y, subtotal) {
  if (y + 30 > MAX_TABLE_Y) y = MAX_TABLE_Y - 35;
  const labelX = COLS[4].x;
  const valX   = RIGHT;
  let ty = y + 6;

  doc.setDrawColor(...BLUE_MID);
  doc.setLineWidth(0.5);
  doc.line(labelX, y + 2, RIGHT, y + 2);

  drawIvaNote(doc, ty + 6);

  doc.setFillColor(...BLUE_MID);
  doc.roundedRect(labelX, ty + 2, RIGHT - labelX, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text('TOTAL:', labelX + 3, ty + 8);
  doc.text(fmtEur(subtotal), valX - 2, ty + 8, { align: 'right' });

  return ty + 14;
}

// ── NOVO HELPER: Bloco de Totais para Nota de Serviço (Com discriminação) ────
function drawServiceNoteTotals(doc, y, subtotal, vatAmount, totalAmount) {
  if (y + 35 > MAX_TABLE_Y) y = MAX_TABLE_Y - 40;
  const labelX = COLS[4].x;
  const valX   = RIGHT;
  let ty = y + 6;

  doc.setDrawColor(...BLUE_MID);
  doc.setLineWidth(0.5);
  doc.line(labelX, y + 2, RIGHT, y + 2);

  // Linha do Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text('Subtotal:', labelX, ty);
  doc.text(fmtEur(subtotal), valX - 2, ty, { align: 'right' });
  ty += 5;

  // Linha do IVA
  doc.text('IVA (23%):', labelX, ty);
  doc.text(fmtEur(vatAmount), valX - 2, ty, { align: 'right' });
  ty += 6;

  // Bloco de destaque do Total Geral
  doc.setFillColor(...BLUE_MID);
  doc.roundedRect(labelX, ty, RIGHT - labelX, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text('TOTAL:', labelX + 3, ty + 6);
  doc.text(fmtEur(totalAmount), valX - 2, ty + 6, { align: 'right' });

  return ty + 12;
}

// ── EXPORT 1: GERAR ORÇAMENTO (Existente) ─────────────────────────────────────
export async function generateBudgetPDF(budget) {
   const allRaw = budget.items || [];
   if (!Array.isArray(allRaw)) return;
   const allItems = allRaw.filter(isValidItem);

   const company = await getCompanyProfile();
   const iban = company.iban || '';

   let logoData = null;
   if (company.logo_url) {
     try {
       const response = await fetch(company.logo_url);
       const blob = await response.blob();
       logoData = await new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onloadend = () => resolve(reader.result);
         reader.onerror = reject;
         reader.readAsDataURL(blob);
       });
     } catch { logoData = null; }
   }

   const regular = allItems.filter(i => !i.isOptional && i.block_type !== 'opcionais');
   const optItems = Array.isArray(budget.opcionais) ? budget.opcionais.filter(isValidItem) : allItems.filter(i => i.isOptional || i.block_type === 'opcionais');

   const subtotal = regular.reduce((s, item) => {
     const isNight = item.isNocturno === true || item.is_night === true;
     const baseTotal = (item.quantidade ?? item.qty ?? 0) * (item.preco_unit ?? item.price ?? 0);
     return s + baseTotal + (isNight ? baseTotal * 0.25 : 0);
   }, 0);

   const optTotal = optItems.reduce((s, item) => {
     const isNight = item.isNocturno === true || item.is_night === true;
     const baseTotal = (item.quantidade ?? item.qty ?? 0) * (item.preco_unit ?? item.price ?? 0);
     return s + baseTotal + (isNight ? baseTotal * 0.25 : 0);
   }, 0);

   const bgUrl = company.budget_background_url || null;
   const bg = bgUrl ? await loadBackground(bgUrl) : null;
   const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

   drawBg(doc, bg);

   if (logoData) {
     doc.addImage(logoData, 'PNG', RIGHT - 44, 6, 44, 22, undefined, 'FAST');
   } else if (company.company_name) {
     doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...BLUE_DARK);
     doc.text(company.company_name, RIGHT, 14, { align: 'right' });
   }

   const infoLines = [company.nif ? `NIF: ${company.nif}` : null, company.phone || null, company.email || null].filter(Boolean);
   doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAY);
   infoLines.forEach((line, i) => doc.text(line, RIGHT, 20 + i * 5, { align: 'right' }));

   let y = 20;
   doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...BLUE_DARK);
   doc.text('ORÇAMENTO', MARGIN, y);
   doc.setFontSize(14); doc.setTextColor(...BLUE_MID);
   doc.text(`# ${budget.budget_number || ''}`, MARGIN + 47, y);

   y += 7;
   doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
   doc.text(`Data: ${fmtDate(budget.date)}`, MARGIN, y);

   const CLIENT_BLOCK_START = y + 8;
   const CLIENT_BLOCK_MIN_HEIGHT = 38;
   let clientBlockY = CLIENT_BLOCK_START;

   doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...BLUE_DARK);
   doc.text('DADOS DO CLIENTE', MARGIN, clientBlockY); clientBlockY += 5;
   doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...DARK);
   doc.text(budget.client_name || '', MARGIN, clientBlockY); clientBlockY += 4.5;
   doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAY);

   if (budget.client_contact_person) { doc.text(`A/C: ${budget.client_contact_person}`, MARGIN, clientBlockY); clientBlockY += 4.2; }
   if (budget.client_address)        { doc.text(budget.client_address, MARGIN, clientBlockY);                 clientBlockY += 4.2; }
   const postalCity = [budget.client_postal_code, budget.client_city].filter(Boolean).join('  ');
   if (postalCity) { doc.text(postalCity, MARGIN, clientBlockY); clientBlockY += 4.2; }
   if (budget.client_nif) { doc.text(`NIF: ${budget.client_nif}`, MARGIN, clientBlockY); clientBlockY += 4.2; }

   const minimumTableStartY = CLIENT_BLOCK_START + CLIENT_BLOCK_MIN_HEIGHT;
   y = Math.max(clientBlockY + 5, minimumTableStartY);
   y = drawTableHeader(doc, y);

   GROUP_ORDER.forEach(grupo => {
     const grupoItems = regular.filter(i => resolveGroup(i) === grupo);
     if (grupoItems.length === 0) return;
     if (y + SECTION_H > MAX_TABLE_Y) { doc.addPage(); drawBg(doc, bg); y = 30; y = drawTableHeader(doc, y); }
     y = drawSectionLabel(doc, y, grupo);
     grupoItems.forEach(item => {
       const rows = expandItemToRows(item);
       rows.forEach((row, idx) => { y = drawDataRow(doc, y, row, bg, idx > 0); });
     });
   });

   const semGrupo = regular.filter(i => !GROUP_ORDER.includes(resolveGroup(i)));
   if (semGrupo.length > 0) {
     if (y + SECTION_H > MAX_TABLE_Y) { doc.addPage(); drawBg(doc, bg); y = 30; y = drawTableHeader(doc, y); }
     y = drawSectionLabel(doc, y, 'Outros Serviços');
     semGrupo.forEach(item => {
       const rows = expandItemToRows(item);
       rows.forEach((row, idx) => { y = drawDataRow(doc, y, row, bg, idx > 0); });
     });
   }

   y += 4;
   if (y + 30 > MAX_TABLE_Y) { doc.addPage(); drawBg(doc, bg); y = 30; }
   y = drawTotals(doc, y, subtotal);

   if (optItems.length > 0) {
     y += 6;
     if (y + SECTION_H + optItems.length * ROW_H + 20 > MAX_TABLE_Y) { doc.addPage(); drawBg(doc, bg); y = 30; }
     doc.setFillColor(255, 243, 205); doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
     doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(120, 80, 0);
     doc.text('ITENS OPCIONAIS  (Não incluídos no total)', MARGIN + 2, y + 4.8);
     y += 7;

     doc.setFillColor(220, 200, 140); doc.rect(MARGIN, y, CONTENT_W, HEADER_H, 'F');
     doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(80, 50, 0);
     COLS.forEach(col => {
       const tx = col.align === 'right' ? colRight(col) - 1 : col.align === 'center' ? col.x + col.w / 2 : col.x + 1;
       doc.text(col.label, tx, midBaseline(y, HEADER_H, 7.5), { align: col.align });
     });
     y += HEADER_H;

     optItems.forEach(item => {
       const rows = expandItemToRows(item);
       rows.forEach((row, idx) => { y = drawDataRow(doc, y, row, bg, idx > 0); });
     });

     y += 4; doc.setDrawColor(180, 150, 60); doc.setLineWidth(0.4); doc.line(COLS[4].x, y, RIGHT, y); y += 5;
     doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(120, 80, 0);
     doc.text('Total Opcionais:', COLS[4].x, y); doc.text(fmtEur(optTotal), RIGHT, y, { align: 'right' }); y += 6;
     drawIvaNote(doc, y); y += 5;
   }

   if (budget.notes) {
     y += 8; if (y + 20 > MAX_TABLE_Y) { doc.addPage(); drawBg(doc, bg); y = 30; }
     doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...BLUE_DARK);
     doc.text('NOTAS:', MARGIN, y); y += 5;
     doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...DARK);
     const noteLines = doc.splitTextToSize(budget.notes, CONTENT_W);
     noteLines.forEach(l => { doc.text(l, MARGIN, y); y += 4.5; });
   }

   const ibanY = 257; doc.setFillColor(255, 255, 255); doc.rect(21, ibanY, 90, 4.5, 'F');
   doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...DARK);
   doc.text(iban, 21, ibanY + 3.5);

   doc.setTextColor(200, 200, 200); doc.setFont('helvetica', 'bold'); doc.setFontSize(60);
   doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.15 }));
   doc.text('DEMONSTRAÇÃO', PAGE_W / 2, PAGE_H / 2, { align: 'center', angle: 45, stroke: true, lineWidth: 2 });
   doc.restoreGraphicsState();

   doc.save(`Orcamento_${(budget.budget_number || 'sem_numero').replace(/[#/\s]/g, '')}.pdf`);
}

// ── EXPORT 2: NOVA FUNÇÃO PARA NOTAS DE SERVIÇO (Com cálculo explícito de IVA) ──
export async function generateServiceNotePDF(note) {
  const allRaw = note.items || [];
  if (!Array.isArray(allRaw)) return;
  const allItems = allRaw.filter(isValidItem);

  const company = await getCompanyProfile();
  const iban = company.iban || '';

  let logoData = null;
  if (company.logo_url) {
    try {
      const response = await fetch(company.logo_url);
      const blob = await response.blob();
      logoData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch { logoData = null; }
  }

  const regular = allItems.filter(i => !i.isOptional && i.block_type !== 'opcionais');

  // Utilizar diretamente os valores calculados pelo formulário da Nota de Serviço
  const subtotal = note.subtotal ?? 0;
  const vatAmount = note.vat_amount ?? 0;
  const totalAmount = note.total_amount ?? 0;

  // Usa o background específico de Nota de Serviço se existir, senão faz fallback para o de Orçamentos
  const bgUrl = company.service_note_background_url || company.budget_background_url || null;
  const bg = bgUrl ? await loadBackground(bgUrl) : null;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  drawBg(doc, bg);

  if (logoData) {
    doc.addImage(logoData, 'PNG', RIGHT - 44, 6, 44, 22, undefined, 'FAST');
  } else if (company.company_name) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...BLUE_DARK);
    doc.text(company.company_name, RIGHT, 14, { align: 'right' });
  }

  const infoLines = [company.nif ? `NIF: ${company.nif}` : null, company.phone || null, company.email || null].filter(Boolean);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAY);
  infoLines.forEach((line, i) => doc.text(line, RIGHT, 20 + i * 5, { align: 'right' }));

  let y = 20;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...BLUE_DARK);
  doc.text('NOTA DE SERVIÇO', MARGIN, y); // Alterado título
  doc.setFontSize(14); doc.setTextColor(...BLUE_MID);
  doc.text(`# ${note.budget_number || ''}`, MARGIN + 58, y); // Ajustado offset do número devido ao título ser maior

  y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
  doc.text(`Data Emissão: ${fmtDate(note.date)}`, MARGIN, y);
  if (note.completion_date) {
    y += 4.5;
    doc.text(`Data Conclusão: ${fmtDate(note.completion_date)} ${note.completion_time || ''}`, MARGIN, y);
  }

  const CLIENT_BLOCK_START = y + 6;
  const CLIENT_BLOCK_MIN_HEIGHT = 38;
  let clientBlockY = CLIENT_BLOCK_START;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...BLUE_DARK);
  doc.text('DADOS DO CLIENTE', MARGIN, clientBlockY); clientBlockY += 5;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...DARK);
  doc.text(note.client_name || '', MARGIN, clientBlockY); clientBlockY += 4.5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAY);

  if (note.client_contact_person) { doc.text(`A/C: ${note.client_contact_person}`, MARGIN, clientBlockY); clientBlockY += 4.2; }
  if (note.client_address)        { doc.text(note.client_address, MARGIN, clientBlockY);                 clientBlockY += 4.2; }
  const postalCity = [note.client_postal_code, note.client_city].filter(Boolean).join('  ');
  if (postalCity) { doc.text(postalCity, MARGIN, clientBlockY); clientBlockY += 4.2; }
  if (note.client_nif) { doc.text(`NIF: ${note.client_nif}`, MARGIN, clientBlockY); clientBlockY += 4.2; }

  const minimumTableStartY = CLIENT_BLOCK_START + CLIENT_BLOCK_MIN_HEIGHT;
  y = Math.max(clientBlockY + 5, minimumTableStartY);
  y = drawTableHeader(doc, y);

  // Agrupamento de itens idêntico ao original
  GROUP_ORDER.forEach(grupo => {
    const grupoItems = regular.filter(i => resolveGroup(i) === grupo);
    if (grupoItems.length === 0) return;
    if (y + SECTION_H > MAX_TABLE_Y) { doc.addPage(); drawBg(doc, bg); y = 30; y = drawTableHeader(doc, y); }
    y = drawSectionLabel(doc, y, grupo);
    grupoItems.forEach(item => {
      const rows = expandItemToRows(item);
      rows.forEach((row, idx) => { y = drawDataRow(doc, y, row, bg, idx > 0); });
    });
  });

  const semGrupo = regular.filter(i => !GROUP_ORDER.includes(resolveGroup(i)));
  if (semGrupo.length > 0) {
    if (y + SECTION_H > MAX_TABLE_Y) { doc.addPage(); drawBg(doc, bg); y = 30; y = drawTableHeader(doc, y); }
    y = drawSectionLabel(doc, y, 'Outros Serviços');
    semGrupo.forEach(item => {
      const rows = expandItemToRows(item);
      rows.forEach((row, idx) => { y = drawDataRow(doc, y, row, bg, idx > 0); });
    });
  }

  // Renderização dos Totais Discriminados (Subtotal + IVA + Total)
  y += 4;
  if (y + 35 > MAX_TABLE_Y) { doc.addPage(); drawBg(doc, bg); y = 30; }
  y = drawServiceNoteTotals(doc, y, subtotal, vatAmount, totalAmount);

  if (note.notes) {
    y += 8; if (y + 20 > MAX_TABLE_Y) { doc.addPage(); drawBg(doc, bg); y = 30; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...BLUE_DARK);
    doc.text('NOTAS:', MARGIN, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...DARK);
    const noteLines = doc.splitTextToSize(note.notes, CONTENT_W);
    noteLines.forEach(l => { doc.text(l, MARGIN, y); y += 4.5; });
  }

  const ibanY = 257; doc.setFillColor(255, 255, 255); doc.rect(21, ibanY, 90, 4.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...DARK);
  doc.text(iban, 21, ibanY + 3.5);

  doc.setTextColor(200, 200, 200); doc.setFont('helvetica', 'bold'); doc.setFontSize(60);
  doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.15 }));
  doc.text('DEMONSTRAÇÃO', PAGE_W / 2, PAGE_H / 2, { align: 'center', angle: 45, stroke: true, lineWidth: 2 });
  doc.restoreGraphicsState();

  doc.save(`NotaServico_${(note.budget_number || 'sem_numero').replace(/[#/\s]/g, '')}.pdf`);
}