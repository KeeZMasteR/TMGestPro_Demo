/**
 * PDF Rendering Safe Pipeline
 * 
 * PIPELINE OBRIGATÓRIO:
 * RAW DATA → NORMALIZER → STRUCTURED DATA → RENDERER
 * 
 * O renderer NUNCA recebe dados brutos.
 * Determinístico: mesmo input = mesmo PDF, sempre.
 */

/**
 * NORMALIZER — Limpeza obrigatória de TODOS os dados visuais
 * 
 * Remove:
 * - Prefixos técnicos (!3, !2, #1, etc.)
 * - Espaços duplicados
 * - Caracteres técnicos/corrompidos
 * - Garante UTF-8 limpo para PDF
 * 
 * @param {string} text - Texto bruto do sistema
 * @returns {string} Texto limpo e pronto para renderizar
 */
export function normalize(text) {
  if (!text) return '';

  return String(text)
    // Remove prefixos técnicos (!N, #N, __...__)
    .replace(/^!\d+\s*/g, '')
    .replace(/^#\d+\s*/g, '')
    .replace(/^__.*?__\s*/g, '')
    // Remove espaços duplicados
    .replace(/\s{2,}/g, ' ')
    // Remove caracteres técnicos corrompidos (mantém acentos)
    .replace(/[^\wÀ-ÿ€%().,+\-\/\s]/g, '')
    // Trim final
    .trim();
}

/**
 * Safe text rendering para PDF
 * Garante conversão correta para string + normalização
 * 
 * @param {*} value - Qualquer valor (string, number, null)
 * @returns {string} String segura para PDF
 */
export function safeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Safe text with normalization para campos visuais
 * 
 * @param {*} value - Qualquer valor (string, number, null)
 * @returns {string} String normalizada e segura
 */
export function normalizedText(value) {
  return normalize(safeText(value));
}

/**
 * Normalizar um objeto de linha para renderização
 * 
 * @param {object} rawRow - Linha bruta do sistema
 * @param {object} options - Opções customizadas
 * @returns {object} Linha normalizada e estruturada
 */
export function normalizeLineItem(rawRow, options = {}) {
  const {
    service_field = 'nome',
    description_field = 'descricao',
    unit_field = 'unidade',
    qty_field = 'quantidade',
    unit_price_field = 'preco_unit',
    total_field = 'total',
  } = options;

  return {
    service: normalizedText(rawRow[service_field]),
    description: normalizedText(rawRow[description_field]),
    unit: safeText(rawRow[unit_field]),
    qty: rawRow[qty_field] ?? 0,
    unitPrice: rawRow[unit_price_field] ?? 0,
    total: rawRow[total_field] ?? 0,
    isSecondary: rawRow.is_secondary || false,
  };
}

/**
 * Formatador de moeda para PDF
 * 
 * @param {number} value - Valor numérico
 * @returns {string} Formatado como "1234,56 €"
 */
export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '0,00 €';
  return safeText(value.toFixed(2).replace('.', ',')) + ' €';
}

/**
 * Validator para linha — rejeita linhas inválidas
 * 
 * @param {object} line - Linha normalizada
 * @returns {boolean} True se válida, false c.c.
 */
export function isValidLine(line) {
  return (
    line.service?.trim() !== '' &&
    line.qty > 0 &&
    line.unitPrice >= 0
  );
}

/**
 * Normalização defensiva com fallbacks — transforma qualquer formato em schema consistente
 * 
 * @param {object} rawItem - Item bruto em qualquer formato
 * @returns {object} Item normalizado com schema uniforme
 */
export function normalizeItemForPDF(rawItem) {
  if (!rawItem) return null;
  
  return {
    type:        rawItem.type ?? rawItem.block_type ?? 'Outros',
    name:        rawItem.name ?? rawItem.nome ?? '',
    description: rawItem.description ?? rawItem.descricao ?? '',
    qty:         rawItem.qty ?? rawItem.quantidade ?? 0,
    price:       rawItem.price ?? rawItem.preco_unit ?? 0,
    unit:        rawItem.unit ?? rawItem.unidade ?? '',
    total:       rawItem.total ?? 0,
    isOptional:  rawItem.isOptional ?? false,
    isNocturno:  rawItem.isNocturno ?? false,
  };
}

/**
 * Normalizar array de items
 * 
 * @param {array} items - Array de items brutos
 * @returns {array} Items normalizados
 */
export function normalizeItemsForPDF(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeItemForPDF).filter(item => item != null);
}