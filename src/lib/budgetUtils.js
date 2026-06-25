import { calcItemTotal, calcLineItemsTotal, validateItemsForSave, normalizeLineItem } from './lineItemAdapter';

export function itemTotal(item) {
  return calcItemTotal(item);
}

export function calcTotal(items = []) {
  return calcLineItemsTotal(items);
}

export function stampTotals(items = []) {
  return items.map(item => ({
    ...item,
    total: calcItemTotal(item),
  }));
}

export function prepareItemsForSave(items = []) {
  const errors = validateItemsForSave(items);
  if (errors.length > 0) throw new Error(errors.join('\n'));
  return items.map(normalizeLineItem);
}

export function readItem(item) {
  const n = normalizeLineItem(item);
  return {
    tipo: n.type,
    nome: n.name,
    descricao: n.description,
    unidade: n.unit,
    quantidade: n.qty,
    preco_unit: n.price,
    total: n.total,
  };
}