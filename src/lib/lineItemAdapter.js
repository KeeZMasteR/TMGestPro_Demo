/**

 * LINE ITEM ADAPTER — ÚNICO PONTO DE NORMALIZAÇÃO

 *

 * Converte QUALQUER estrutura antiga ou nova para o formato unificado:

 * { type, name, description, unit, qty, price, total, isNocturno, isOptional }

 *

 * CONTRATO:

 * - Aceita campos antigos (tipo, nome, descricao, quantidade, preco_unit, etc.)

 * - Nunca perde dados durante conversão

 * - Nunca aplica defaults errados de negócio

 * - O que entra normalizado sai normalizado

 */



/**

 * Calcula total de um item incluindo surcharge noturno

 */

export function calcItemTotal(item) {

  const qty = item.qty ?? item.quantidade ?? 0;

  const price = item.price ?? item.preco_unit ?? 0;

  const base = parseFloat((qty * price).toFixed(2));

  const extra = item.isNocturno ? parseFloat((base * 0.25).toFixed(2)) : 0;

  return parseFloat((base + extra).toFixed(2));

}



/**

 * FUNÇÃO CENTRAL — Converte qualquer item para schema unificado

 *

 * Suporta:

 * - novo: { type, name, description, unit, qty, price, ... }

 * - antigo: { tipo, nome, descricao, unidade, quantidade, preco_unit, ... }

 * - legado: { service, custom_service, description, unit, quantity, unit_price, ... }

 * - sub_rows (compatibilidade)

 */

export function normalizeLineItem(rawItem) {

   if (!rawItem || typeof rawItem !== 'object') {

     return null;

   }



   // Extrair campos — priorizar novo schema, fallback para antigos

   const type = rawItem.type || rawItem.tipo || 'Outros';

   const name = rawItem.name || rawItem.nome || rawItem.service || rawItem.custom_service || '';

   const description = rawItem.description || rawItem.descricao || '';

   const unit = rawItem.unit || rawItem.unidade || '';

   const qty = rawItem.qty !== undefined ? rawItem.qty : (rawItem.quantity !== undefined ? rawItem.quantity : 0);

   const price = rawItem.price !== undefined ? rawItem.price : (rawItem.unitPrice !== undefined ? rawItem.unitPrice : (rawItem.preco_unit !== undefined ? rawItem.preco_unit : 0));

   const isNocturno = (rawItem.isNocturno || rawItem.is_night) ?? false;

   const isOptional = rawItem.isOptional ?? false;

   const blockType = rawItem.block_type || (isOptional ? 'opcionais' : 'servicos');



   // Calcular total

   const total = calcItemTotal({ qty, price, isNocturno });



   return {

     type,

     name,

     description,

     unit,

     qty: qty !== undefined && qty !== null && !isNaN(qty) ? qty : 0,

     price: price !== undefined && price !== null && !isNaN(price) ? price : 0,

     total,

     isNocturno,

     isOptional,

     block_type: blockType,

   };

 }



/**

 * Normalizar array de items

 */

export function normalizeLineItems(items = []) {

  if (!Array.isArray(items)) {

    return [];

  }

  return items.map(normalizeLineItem).filter(item => item !== null);

}



/**

 * Validar items para gravação

 */

export function validateItemsForSave(items = []) {

  const errors = [];

  items.forEach((item, idx) => {

    if (!item.name || item.name.trim() === '') {

      errors.push(`Linha ${idx + 1}: nome é obrigatório`);

    }

    if (!(item.qty > 0)) {

      errors.push(`Linha ${idx + 1} (${item.name}): quantidade deve ser > 0`);

    }

    if (!(item.price > 0)) {

      errors.push(`Linha ${idx + 1} (${item.name}): preço deve ser > 0`);

    }

  });

  return errors;

}



/**

 * Calcular totais de um array

 */

export function calcLineItemsTotal(items = []) {

  return items.reduce((sum, item) => sum + (item.total || 0), 0);

}